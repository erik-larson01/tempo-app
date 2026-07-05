package com.erikmlarson5.deadlinemanager.service;

import com.erikmlarson5.deadlinemanager.dto.TaskInputDTO;
import com.erikmlarson5.deadlinemanager.dto.ProjectOutputDTO;
import com.erikmlarson5.deadlinemanager.dto.TaskOutputDTO;
import com.erikmlarson5.deadlinemanager.entity.Project;
import com.erikmlarson5.deadlinemanager.entity.Task;
import com.erikmlarson5.deadlinemanager.entity.User;
import com.erikmlarson5.deadlinemanager.repository.ProjectRepository;
import com.erikmlarson5.deadlinemanager.repository.TaskRepository;
import com.erikmlarson5.deadlinemanager.utils.ProjectMapper;
import com.erikmlarson5.deadlinemanager.utils.Status;
import com.erikmlarson5.deadlinemanager.utils.TaskMapper;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

/**
 * Service layer for all task endpoints which connects to the repository layer
 */
@Service
@Transactional
public class TaskService {
    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final ProjectService projectService;
    private final UserService userService;

    /**
     * Task service which connects to the repository layer
     * @param taskRepository injected repository to manage tasks
     * @param projectRepository injected repository for priority recalculation
     * @param projectService injected service for priority recalculation
     */
    @Autowired
    public TaskService(TaskRepository taskRepository, ProjectRepository projectRepository,
                       ProjectService projectService, UserService userService) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
        this.projectService = projectService;
        this.userService = userService;
    }

    /**
     * Creates a task and saves to PostgresSQL
     * @param projectId the id of the associated project
     * @param dto the inputDTO of all task fields
     * @return an outputDTO of the saved task
     */
    public ProjectOutputDTO createTask(Long projectId, TaskInputDTO dto, Jwt jwt) {
        validateDueDateForCreate(dto.getDueDate(), dto.getClientDate());
        validateStatusForCreate(dto.getStatus());

        User user = userService.getOrCreateUser(jwt);
        Project project = projectRepository.findByProjectIdAndUser(projectId, user)
                .orElseThrow(() -> new IllegalArgumentException("Project with id: " + projectId + " not " + "found!"));

        Task task = TaskMapper.toEntity(dto, project);

        if (project.getTasks() == null) {
            project.setTasks(new ArrayList<>());
        }
        project.getTasks().add(task);

        float newPriority = projectService.calculatePriority(project);
        project.setPriority(newPriority);
        Project savedProject = projectRepository.saveAndFlush(project);

        return ProjectMapper.toOutputDto(savedProject);
    }

    /**
     * Gets a task by its unique id
     * @param projectId the id of the associated project
     * @param taskId the id of the task to be found
     * @return an outputDTO of the found task
     */
    public TaskOutputDTO getTaskById(Long projectId, Long taskId, Jwt jwt) {
        User user = userService.getOrCreateUser(jwt);
        Task task = taskRepository
            .findByTaskIdAndProject_ProjectIdAndProject_User(taskId, projectId, user)
            .orElseThrow(() -> new IllegalArgumentException("Task not found"));

        return TaskMapper.toOutputDto(task);
    }

    /**
     * Gets a list of all tasks across all projects
     * @return a list of all tasks, converted to outputDTOs
     */
    public List<TaskOutputDTO> getAllTasks(Jwt jwt) {
        User user = userService.getOrCreateUser(jwt);
        List<Task> allTasks = taskRepository.findByProject_User(user);
        List<TaskOutputDTO> allOutputDTOs = new ArrayList<>();
        for (Task task : allTasks) {
            allOutputDTOs.add(TaskMapper.toOutputDto(task));
        }
        return allOutputDTOs;
    }

    /**
     * Gets a list of all tasks by an enum status
     * @param status the status query to search by
     * @return a list of all tasks by specific status, converted to outputDTOs
     */
    public List<TaskOutputDTO> getAllTasksByStatus(Status status, Jwt jwt) {
        User user = userService.getOrCreateUser(jwt);
        List<Task> allTasks = taskRepository.findByStatusAndProject_User(status, user);
        List<TaskOutputDTO> allOutputDTOs = new ArrayList<>();
        for (Task task : allTasks) {
            allOutputDTOs.add(TaskMapper.toOutputDto(task));
        }
        return allOutputDTOs;
    }

    /**
     * Gets a list of all tasks within a specific project
     * @param projectId the project to get all tasks from
     * @return a list of all tasks in a project, converted to outputDTOs
     */
    public List<TaskOutputDTO> getTasksInProject(Long projectId, Jwt jwt) {
        // ensures project belongs to user and returns tasks for that project
        User user = userService.getOrCreateUser(jwt);
        projectRepository.findByProjectIdAndUser(projectId, user)
                .orElseThrow(() -> new IllegalArgumentException("Project with id: " + projectId + " not found!"));

        List<Task> allTasks = taskRepository.findByProject_ProjectIdAndProject_User(projectId, user);
        List<TaskOutputDTO> allOutputDTOs = new ArrayList<>();
        for (Task task : allTasks) {
            allOutputDTOs.add(TaskMapper.toOutputDto(task));
        }
        return allOutputDTOs;
    }

    /**
     * A more specific search by status query, getting all incomplete tasks in a project
     * @param projectId the project to get all incomplete tasks from
     * @return a list of all incomplete tasks in a project, converted to outputDTOs
     */
    public List<TaskOutputDTO> getIncompleteTasksInProject(Long projectId, Jwt jwt) {
        User user = userService.getOrCreateUser(jwt);
        projectRepository.findByProjectIdAndUser(projectId, user)
                .orElseThrow(() -> new IllegalArgumentException("Project with id: " + projectId + " not found!"));

        List<Task> allTasks = taskRepository.findByProject_ProjectIdAndProject_User(projectId, user);
        List<TaskOutputDTO> incompleteTasks = new ArrayList<>();

        for (Task task : allTasks) {
            if (task.getStatus() != Status.COMPLETED) {
                incompleteTasks.add(TaskMapper.toOutputDto(task));
            }
        }

        return incompleteTasks;
    }

    /**
     * Fully updates all fields of a task, replacing every value and field including priority
     * @param projectId the id of the associated project
     * @param taskId the id of the task to update
     * @param dto an inputDTO object of all fields to replace
     * @return an outputDTO of the updated and saved task
     */
    public ProjectOutputDTO updateTask(Long projectId, Long taskId, TaskInputDTO dto, Jwt jwt) {
        User user = userService.getOrCreateUser(jwt);
        Task existingTask = taskRepository
                .findByTaskIdAndProject_ProjectIdAndProject_User(taskId, projectId, user)
                .orElseThrow(() -> new NoSuchElementException("Task with id " + taskId + " not " +
                        "found"));

        Project project = existingTask.getProject();

        validateDueDateForUpdate(existingTask, dto.getDueDate());

        existingTask.setTitle(dto.getTitle());
        existingTask.setDescription(dto.getDescription());
        existingTask.setDueDate(dto.getDueDate());
        existingTask.setEstimatedHours(dto.getEstimatedHours());
        existingTask.setDifficulty(dto.getDifficulty());
        existingTask.setStatus(Status.valueOf(dto.getStatus().toUpperCase()));
        existingTask.setProject(project);

        taskRepository.saveAndFlush(existingTask);

        float newPriority = projectService.calculatePriority(project);
        project.setPriority(newPriority);
        Project savedProject = projectRepository.saveAndFlush(project);

        return ProjectMapper.toOutputDto(savedProject);
    }

    /**
     * Enforces due-date rules for task creation.
     * @param dueDate the due date from the input DTO
     */
    private void validateDueDateForCreate(LocalDate dueDate, LocalDate clientDate) {
        if (dueDate == null) {
            return;
        }
        LocalDate today = clientDate != null ? clientDate : LocalDate.now();
        if (dueDate.isBefore(today)) {
            throw new IllegalArgumentException("Due date must be today or in the future when creating a task");
        }
    }

    /**
     * Enforces due-date rules for task updates.
     * @param task the existing task being updated
     * @param dueDate the due date from the input DTO
     */
    private void validateDueDateForUpdate(Task task, LocalDate dueDate) {
        if (dueDate == null) {
            return;
        }

        if (task.getCreatedAt() == null) {
            throw new IllegalStateException("Task creation timestamp is missing");
        }

        if (dueDate.isBefore(task.getCreatedOnDate())) {
            throw new IllegalArgumentException("Due date cannot be before the task creation date");
        }
    }

    /**
     * Enforces status rules for task creation.
     * @param status the status from the input DTO
     */
    private void validateStatusForCreate(String status) {
        if (Status.COMPLETED.name().equalsIgnoreCase(status)) {
            throw new IllegalArgumentException("New tasks cannot be created with COMPLETED status");
        }
    }

    /**
     * Updates only a task's enum status
     * @param projectId the id of the associated project
     * @param taskId the id of the task to update
     * @param newStatus the new status to change to
     * @return an outputDTO of the updated and saved task
     */
    public ProjectOutputDTO updateTaskStatus(Long projectId, Long taskId, String newStatus, Jwt jwt) {
        User user = userService.getOrCreateUser(jwt);
        Task task = taskRepository
            .findByTaskIdAndProject_ProjectIdAndProject_User(taskId, projectId, user)
            .orElseThrow(() -> new NoSuchElementException("Task with id " + taskId + " not found!"));

        task.setStatus(Status.valueOf(newStatus.toUpperCase()));
        taskRepository.saveAndFlush(task);

        Project project = task.getProject();
        project.setPriority(projectService.calculatePriority(project));
        Project savedProject = projectRepository.saveAndFlush(project);

        return ProjectMapper.toOutputDto(savedProject);
    }

    /**
     * Deletes a task in the database
     * @param projectId the id of the associated project
     * @param taskId the id of the task to delete
     */
    public ProjectOutputDTO deleteTask(Long projectId, Long taskId, Jwt jwt) {
        User user = userService.getOrCreateUser(jwt);
        Task task = taskRepository
            .findByTaskIdAndProject_ProjectIdAndProject_User(taskId, projectId, user)
            .orElseThrow(() -> new NoSuchElementException("Task with id " + taskId + " not found!"));

        Project project = task.getProject();

        // Orphan removal handles the deletion of the task when removed from the project
        project.removeTask(task);

        float newPriority = projectService.calculatePriority(project);
        project.setPriority(newPriority);
        Project savedProject = projectRepository.saveAndFlush(project);
        return ProjectMapper.toOutputDto(savedProject);
    }
}
