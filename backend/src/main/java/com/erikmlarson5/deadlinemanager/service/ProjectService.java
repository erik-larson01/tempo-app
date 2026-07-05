package com.erikmlarson5.deadlinemanager.service;

import com.erikmlarson5.deadlinemanager.dto.ProjectInputDTO;
import com.erikmlarson5.deadlinemanager.dto.ProjectOutputDTO;
import com.erikmlarson5.deadlinemanager.entity.Project;
import com.erikmlarson5.deadlinemanager.entity.Task;
import com.erikmlarson5.deadlinemanager.entity.User;
import com.erikmlarson5.deadlinemanager.repository.ProjectRepository;
import com.erikmlarson5.deadlinemanager.utils.ProjectMapper;
import com.erikmlarson5.deadlinemanager.utils.Status;
import com.erikmlarson5.deadlinemanager.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

/**
 * Service layer for all project endpoints which connects to the repository layer
 */
@Service
@Transactional
public class ProjectService {
    private final ProjectRepository projectRepository;
    private final UserService userService;
    private final UserRepository userRepository;

    /**
     * Project service which connects to the repository layer
     * @param projectRepository injected repository to manage projects
     */
    @Autowired
    public ProjectService(ProjectRepository projectRepository, UserService userService, UserRepository userRepository) {
        this.projectRepository = projectRepository;
        this.userService = userService;
        this.userRepository = userRepository;
    }

    /**
     * Creates a project and saves to PostgresSQL
     * @param dto the inputDTO of all project fields
     * @return an outputDTO of the saved project
     */
    public ProjectOutputDTO createProject(ProjectInputDTO dto, Jwt jwt) {
        validateDueDateForCreate(dto.getDueDate(), dto.getClientDate());
        validateStatusForCreate(dto.getStatus());

        User user = userService.getOrCreateUser(jwt);
        Project project = ProjectMapper.toEntity(dto);
        project.setUser(user);

        if (projectRepository.existsByTitleAndUser(project.getTitle(), user)) {
            throw new IllegalStateException("Project with the same title already exists!");
        }
        recalculateProjectPriority(project);

        Project savedProject = projectRepository.save(project);

        user.incrementLifetimeCreatedProjects();
        userRepository.save(user);
        
        return ProjectMapper.toOutputDto(savedProject);
    }

    /**
     * Gets a project by its unique id
     * @param id the id of the project
     * @return an outputDTO of the found project
     */
    public ProjectOutputDTO getProjectById(Long id, Jwt jwt) {
        User user = userService.getOrCreateUser(jwt);
        Project project = projectRepository.findByProjectIdAndUser(id, user)
                .orElseThrow(() -> new IllegalArgumentException("Project with id: " + id + " not found!"));

        if (recalculateProjectPriority(project)) {
            projectRepository.save(project);
        }
        return ProjectMapper.toOutputDto(project);
    }

    /**
     * Gets all projects with a shared category field
     * @param category the name of the category to search by
     * @return a list of all projects in the provided category, converted to outputDTOs
     */
    public List<ProjectOutputDTO> getProjectsInCategory(String category, Jwt jwt) {
        User user = userService.getOrCreateUser(jwt);
        List<Project> allProjects = projectRepository.findByCategoryIgnoreCaseAndUser(category, user);
        List<ProjectOutputDTO> allOutputDTOs = new ArrayList<>();
        for (Project project : allProjects) {
            allOutputDTOs.add(ProjectMapper.toOutputDto(project));
        }
        return allOutputDTOs;
    }

    /**
     * Gets a list of all projects
     * @return a list of all projects, converted to outputDTOs
     */
    public List<ProjectOutputDTO> getAllProjects(Jwt jwt) {
        User user = userService.getOrCreateUser(jwt);
        List<Project> allProjects = projectRepository.findByUser(user);

        for (Project project : allProjects) {
            if (recalculateProjectPriority(project)) {
                projectRepository.save(project);
            }
        }

        List<ProjectOutputDTO> allOutputDTOs = new ArrayList<>();
        for (Project project : allProjects) {
            allOutputDTOs.add(ProjectMapper.toOutputDto(project));
        }
        return allOutputDTOs;
    }

    /**
     * Gets a list of all projects due in X days,
     * @param days the number of days until a given deadline
     * @return a list of all projects due in X days, converted to outputDTOs
     */
    public List<ProjectOutputDTO> getProjectsDueInDays(int days, Jwt jwt) {
        User user = userService.getOrCreateUser(jwt);
        LocalDate today = LocalDate.now();
        LocalDate deadline = today.plusDays(days);
        List<Project> projects = projectRepository.findByDueDateBetweenAndUser(today, deadline, user);

        List<ProjectOutputDTO> allOutputDTOs = new ArrayList<>();
        for (Project project : projects) {
            allOutputDTOs.add(ProjectMapper.toOutputDto(project));
        }
        return allOutputDTOs;
    }

    /**
     * Gets a list of all projects by an enum status
     * @param status the status query to search by
     * @return a list of all projects by specific status, converted to outputDTOs
     */
    public List<ProjectOutputDTO> getProjectsByStatus(Status status, Jwt jwt) {
        User user = userService.getOrCreateUser(jwt);
        List<Project> allProjects = projectRepository.findByStatusAndUser(status, user);
        List<ProjectOutputDTO> allOutputDTOs = new ArrayList<>();
        for (Project project : allProjects) {
            allOutputDTOs.add(ProjectMapper.toOutputDto(project));
        }
        return allOutputDTOs;
    }

    /**
     * Gets all projects with a status of COMPLETED
     * @return a list of all incomplete tasks in a project, converted to outputDTOs
     */
    public List<ProjectOutputDTO> getCompletedProjects(Jwt jwt) {
        return getProjectsByStatus(Status.COMPLETED, jwt);
    }

    /**
     * Gets all projects in a list, sorted by calculated priority
     * @return a list of projects in priority order, converted to outputDTOs
     */
    public List<ProjectOutputDTO> getProjectsSortedByPriority(Jwt jwt) {
        User user = userService.getOrCreateUser(jwt);
        updateAllProjectPriorities(jwt);

        List<Project> allProjects = projectRepository.findAllByUserOrderByPriorityDesc(user);
        List<ProjectOutputDTO> allOutputDTOs = new ArrayList<>();
        for (Project project : allProjects) {
            allOutputDTOs.add(ProjectMapper.toOutputDto(project));
        }
        return allOutputDTOs;
    }

    /**
     * Recalculates a project's priority and applies it only when it changes.
     * @param project the project to recalculate
     * @return true when the priority value was changed
     */
    private boolean recalculateProjectPriority(Project project) {
        float recalculatedPriority = calculatePriority(project);
        if (Float.compare(project.getPriority(), recalculatedPriority) == 0) {
            return false;
        }

        project.setPriority(recalculatedPriority);
        return true;
    }

    /**
     * Fully updates all fields of a project, replacing every value and field including priority
     * and tasks
     * @param id the id of the project to update
     * @param dto an inputDTO object of all fields to replace
     * @return an outputDTO of the updated and saved task
     */
    public ProjectOutputDTO updateProject(Long id, ProjectInputDTO dto, Jwt jwt) {
        User user = userService.getOrCreateUser(jwt);
        Project existingProject = projectRepository.findByProjectIdAndUser(id, user)
                .orElseThrow(() -> new NoSuchElementException("Project with id " + id + " not found!"));

        if (!existingProject.getTitle().equals(dto.getTitle()) &&
            projectRepository.existsByTitleAndUser(dto.getTitle(), user)) {
            throw new IllegalStateException("Project with the same title already exists");
        }

        validateDueDateForUpdate(existingProject, dto.getDueDate());

        existingProject.setTitle(dto.getTitle());
        existingProject.setDescription(dto.getDescription());
        existingProject.setCategory(dto.getCategory());
        existingProject.setDueDate(dto.getDueDate());
        existingProject.setEstimatedHours(dto.getEstimatedHours());
        existingProject.setDifficulty(dto.getDifficulty());
        existingProject.setStatus(Status.valueOf(dto.getStatus().toUpperCase()));

        recalculateProjectPriority(existingProject);

        Project savedProject = projectRepository.saveAndFlush(existingProject);
        return ProjectMapper.toOutputDto(savedProject);
    }

    /**
     * Enforces due-date rules for project creation.
     * @param dueDate the due date from the input DTO
     */
    private void validateDueDateForCreate(LocalDate dueDate, LocalDate clientDate) {
        if (dueDate == null) {
            throw new IllegalArgumentException("Due date is required");
        }

        LocalDate today = clientDate != null ? clientDate : LocalDate.now();
        if (dueDate.isBefore(today)) {
            throw new IllegalArgumentException("Due date must be today or in the future when creating a project");
        }
    }

    /**
     * Enforces due-date rules for project updates.
     * @param project the existing project being updated
     * @param dueDate the due date from the input DTO
     */
    private void validateDueDateForUpdate(Project project, LocalDate dueDate) {
        if (dueDate == null) {
            throw new IllegalArgumentException("Due date is required");
        }

        if (project.getCreatedAt() == null) {
            throw new IllegalStateException("Project creation timestamp is missing");
        }

        if (dueDate.isBefore(project.getCreatedOnDate())) {
            throw new IllegalArgumentException("Due date cannot be before the project creation date");
        }
    }

    /**
     * Enforces status rules for project creation.
     * @param status the status from the input DTO
     */
    private void validateStatusForCreate(String status) {
        if (Status.COMPLETED.name().equalsIgnoreCase(status)) {
            throw new IllegalArgumentException("New projects cannot be created with COMPLETED status");
        }
    }

    /**
     * Updates only a project's enum status
     * @param id the id of the project to update
     * @param newStatus the new status to change to
     * @return an outputDTO of the updated and saved task
     */
    public ProjectOutputDTO updateProjectStatus(Long id, String newStatus, Jwt jwt) {
        User user = userService.getOrCreateUser(jwt);
        Project project = projectRepository.findByProjectIdAndUser(id, user)
                .orElseThrow(() -> new NoSuchElementException("Project with id " + id + " not " + "found!"));

        project.setStatus(Status.valueOf(newStatus.toUpperCase()));
        projectRepository.saveAndFlush(project);

        return ProjectMapper.toOutputDto(project);
    }

    /**
     * Recalculates all project priorities to account for the current date and time
     */
    public void updateAllProjectPriorities(Jwt jwt) {
        User user = userService.getOrCreateUser(jwt);
        List<Project> projects = projectRepository.findByUser(user);
        List<Project> changedProjects = new ArrayList<>();

        for (Project project : projects) {
            if (recalculateProjectPriority(project)) {
                changedProjects.add(project);
            }
        }

        if (!changedProjects.isEmpty()) {
            projectRepository.saveAll(changedProjects);
        }
    }

    /**
     * Deletes a project in the database
     * @param id the id of the project to delete
     */
    public void deleteProject(Long id, Jwt jwt) {
        User user = userService.getOrCreateUser(jwt);
        Project project = projectRepository.findByProjectIdAndUser(id, user)
                .orElseThrow(() -> new NoSuchElementException("Project with id: " + id + " not found!"));
        projectRepository.delete(project);
    }

    /**
     * Calculates a priority score for a project based on time pressure, workload, difficulty, and progress factors
     * @param project the project to calculate the priority score for
     * @return a priority score from 0-10, rounded to 1 decimal place
     */
    public float calculatePriority(Project project) {
        LocalDate today = LocalDate.now();
        long daysLeft = ChronoUnit.DAYS.between(today, project.getDueDate());

        // Calculate estimated hours remaining across all incomplete tasks
        double hoursRemaining = calculateRemainingWork(project);

        // Get scores for time pressure, work pressure, and progress
        double timePressure  = calculateTimePressure(daysLeft);
        double workPressure  = calculateWorkPressure(hoursRemaining, daysLeft);
        double progressScore = calculateProgressScore(project, daysLeft);

        double baseScore = (timePressure * 0.50) + (workPressure * 0.30) + (progressScore * 0.20);

        // Adjust the base score by a difficulty multiplier to get the final priority score
        double priority = baseScore * getDifficultyMultiplier(project);

        // Ensure the final priority score is between 0 and 10, and round to 1 decimal place
        return (float) (Math.round(Math.min(priority, 10.0) * 10.0) / 10.0);
    }

    /**
     * Used to calculate the total estimated hours across all tasks
     * @param project the project to calculate the total for
     * @return the total estimated hours across all tasks, or 5.0 if none
     */
    private double calculateRemainingWork(Project project) {
        // If no tasks, use estimated hours from project or default to 5.0 if not provided
        if (project.getTasks() == null || project.getTasks().isEmpty()) {
            return project.getEstimatedHours() != null
                ? Math.max(project.getEstimatedHours(), 0.5)
                : 5.0;
        }

        double totalHours = 0.0;

        // Sum estimated hours for all incomplete tasks
        for (Task task : project.getTasks()) {
            if (task.getStatus() != Status.COMPLETED) {
                totalHours += task.getEstimatedHours();
            }
        }
        return totalHours;
    }

    /**
     * Used to calculate a time pressure score based on urgency
     * @param daysLeft the number of days until a project's deadline
     * @return a score based on estimated time pressure
     */
    private double calculateTimePressure(long daysLeft) {
        // If overdue, very high pressure but decays as it gets more overdue to avoid infinite pressure
        if (daysLeft < 0) {
            double daysOverdue = Math.abs(daysLeft);
            return 6.0 + 4.0 / (1.0 + 0.08 * daysOverdue);
        }

        if (daysLeft == 0) return 9.5;

        // Exponential decay of time pressure as the deadline gets further away
        return 9.5 * Math.exp(-0.11 * daysLeft);
    }

    /**
     * Used to calculate a work pressure score based on estimated hours left in a project and time until deadline
     * @param hoursRemaining estimated hours left in a given project
     * @param daysLeft the number of days until a project's deadline
     * @return a score based on estimated workload and urgency
     */
    private double calculateWorkPressure(double hoursRemaining, long daysLeft) {
        if (hoursRemaining <= 0) return 0.0;

        // If overdue, work pressure is high 
        if (daysLeft <= 0) {
            return Math.min(10.0, 2.0 + hoursRemaining * 0.7);
        }

        double hoursPerDay = hoursRemaining / daysLeft;

        // Exponential growth of work pressure as hours per day increases, capped at 10
        return Math.min(10.0, 10.0 * (1.0 - Math.exp(-0.3 * hoursPerDay)));
    }


    /**
     * Calculates a progress score based on the number of completed tasks, or 5.0 if none
     * @param project the project to calculate the score for
     * @return a score based on estimated progress
     */
    private double calculateProgressScore(Project project, long daysLeft) {
        List<Task> tasks = project.getTasks();

        // If no tasks, use time pressure score
        if (tasks == null || tasks.isEmpty()) {
            return daysLeft <= 7 ? 7.0 : 5.0;
        }

        // Calculate completion ratio of tasks
        long total = tasks.size();
        long completed = tasks.stream()
            .filter(t -> t.getStatus() == Status.COMPLETED)
            .count();

        double completionRatio = (double) completed / total;

        double rawScore = 10.0 * (1.0 - completionRatio);

        // If deadline is close, adjust the score to be higher to reflect urgency
        double timeAdjustment =
            daysLeft <= 0 ? 1.3 :
            daysLeft <= 3 ? 1.2 :
            daysLeft <= 7 ? 1.1 :
            1.0;

        return Math.min(10.0, rawScore * timeAdjustment);
    }

    /**
     * Calculates a difficulty multiplier to adjust the priority score based on the project's difficulty
     * @param project the project to calculate the multiplier for
     * @return a multiplier where higher difficulty results in a higher multiplier
     */
    private double getDifficultyMultiplier(Project project) {
        if (project.getDifficulty() == null) return 1.25;

        // Clamp difficulty to a range of 1-10 to avoid extreme multipliers
        double difficulty = Math.min(Math.max(project.getDifficulty(), 1), 10);
        return 1.0 + (difficulty / 15.0);
    }
}

