package com.erikmlarson5.deadlinemanager.controller;

import com.erikmlarson5.deadlinemanager.dto.ProjectInputDTO;
import com.erikmlarson5.deadlinemanager.dto.ProjectOutputDTO;
import com.erikmlarson5.deadlinemanager.service.ProjectService;
import com.erikmlarson5.deadlinemanager.utils.Status;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.oauth2.jwt.Jwt;
import java.util.List;

/**
 * A controller which sets all project related endpoints and connects to the service logic layer
 */
@Validated
@RestController
@RequestMapping(path = "/api/v1/projects")
public class ProjectController {
    private final ProjectService projectService;

    /**
     * Project controller which connects to the service layer
     * @param projectService the injected service to connect to
     */
    @Autowired
    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    /**
     * Creates an endpoint to save a new project to PostgresSQL
     * @param dto the inputDTO object to convert and save
     * @return a response entity containing the created project
     */
    @PostMapping
    public ResponseEntity<ProjectOutputDTO> createProject(@RequestBody @Valid ProjectInputDTO dto, @AuthenticationPrincipal Jwt jwt) {
        ProjectOutputDTO createdProject = projectService.createProject(dto, jwt);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdProject);
    }

    /**
     * Creates an endpoint to get a project by its unique id
     * @param id the id of the project to get
     * @return a response entity containing the found project
     */
    @GetMapping(path = "/{id}")
    public ResponseEntity<ProjectOutputDTO> getProjectById(@PathVariable @Positive Long id, @AuthenticationPrincipal Jwt jwt) {
        ProjectOutputDTO project = projectService.getProjectById(id, jwt);
        return ResponseEntity.ok(project);
    }

    /**
     * Creates an endpoint to get all projects
     * @return a response entity containing all projects
     */
    @GetMapping
    public ResponseEntity<List<ProjectOutputDTO>> getAllProjects(@AuthenticationPrincipal Jwt jwt) {
        List<ProjectOutputDTO> allProjects = projectService.getAllProjects(jwt);
        return ResponseEntity.ok(allProjects);
    }

    /**
     * Creates an endpoint to get all projects by a given category
     * @param category the category to search by
     * @return a response entity containing the found projects
     */
    @GetMapping(path = "/category/{category}")
    public ResponseEntity<List<ProjectOutputDTO>> getProjectsByCategory(@PathVariable String category, @AuthenticationPrincipal Jwt jwt) {
        List<ProjectOutputDTO> categoryProjects = projectService.getProjectsInCategory(category, jwt);
        return ResponseEntity.ok(categoryProjects);
    }

    /**
     * Creates an endpoint to get all projects by an enum status
     * @param status the enum status to search by
     * @return a response entity containing the found projects
     */
    @GetMapping(path = "/status")
    public ResponseEntity<List<ProjectOutputDTO>> getProjectsByStatus(@RequestParam @Valid Status status, @AuthenticationPrincipal Jwt jwt) {
        List<ProjectOutputDTO> projectsByStatus = projectService.getProjectsByStatus(status, jwt);
        return ResponseEntity.ok(projectsByStatus);
    }

    /**
     * Creates an endpoint to get all projects due in X days
     * @param days the number of days until a given deadline
     * @return a response entity containing the found projects
     */
    @GetMapping(path = "/due-in")
    public ResponseEntity<List<ProjectOutputDTO>> getProjectsDueInDays(@RequestParam @PositiveOrZero int days, @AuthenticationPrincipal Jwt jwt) {
        List<ProjectOutputDTO> projectsDueIn = projectService.getProjectsDueInDays(days, jwt);
        return ResponseEntity.ok(projectsDueIn);
    }

    /**
     * Creates an endpoint to get all completed projects
     * @return a response entity containing the found projects
     */
    @GetMapping(path = "/completed")
    public ResponseEntity<List<ProjectOutputDTO>> getCompletedProjects(@AuthenticationPrincipal Jwt jwt) {
        List<ProjectOutputDTO> completedProjects = projectService.getCompletedProjects(jwt);
        return ResponseEntity.ok(completedProjects);
    }

    /**
     * Creates an endpoint to get all project sorted by priority
     * @return a response entity containing the found projects, sorted by priority descending
     */
    @GetMapping(path = "/priority")
    public ResponseEntity<List<ProjectOutputDTO>> getProjectsSortedByPriority(@AuthenticationPrincipal Jwt jwt) {
        List<ProjectOutputDTO> sortedProjects = projectService.getProjectsSortedByPriority(jwt);
        return ResponseEntity.ok(sortedProjects);
    }

    /**
     * Creates an endpoint to update a specific project
     * @param id the id of the project to be updated
     * @param dto the new inputDTO to be saved
     * @return a response entity of the updated project
     */
    @PutMapping(path = "/{id}")
    public ResponseEntity<ProjectOutputDTO> updateProject(@PathVariable @Positive Long id,
                                                          @RequestBody @Valid ProjectInputDTO dto,
                                                          @AuthenticationPrincipal Jwt jwt) {
        ProjectOutputDTO updatedProject = projectService.updateProject(id, dto, jwt);
        return ResponseEntity.ok(updatedProject);
    }

    /**
     * Creates an endpoint to update a specific project's status field
     * @param id the id of the project to be updated
     * @param newStatus the new enum status to be saved
     * @return a response entity of the updated project
     */
        @PatchMapping(path = "/{id}/status")
        public ResponseEntity<ProjectOutputDTO> updateProjectStatus(@PathVariable @Positive Long id,
                                    @RequestParam
                                    @Pattern(regexp = "(?i)^(NOT_STARTED|IN_PROGRESS|COMPLETED)$",
                                        message = "newStatus must be one of: NOT_STARTED, IN_PROGRESS, COMPLETED")
                                    String newStatus,
                                    @AuthenticationPrincipal Jwt jwt) {
        ProjectOutputDTO updatedProject = projectService.updateProjectStatus(id, newStatus, jwt);
        return ResponseEntity.ok(updatedProject);
    }

    /**
     * Creates an endpoint to update the priority of all projects
     * @return a response entity that displays the successful update
     */
    @PatchMapping(path = "/update-priorities")
    public ResponseEntity<Void> updateAllProjectPriorities(@AuthenticationPrincipal Jwt jwt) {
        projectService.updateAllProjectPriorities(jwt);
        return ResponseEntity.noContent().build();
    }

    /**
     * Creates an endpoint to delete a specific project
     * @param id the id of the project to be deleted
     * @return a response entity that displays the successful deletion
     */
    @DeleteMapping(path = "/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable @Positive Long id, @AuthenticationPrincipal Jwt jwt) {
        projectService.deleteProject(id, jwt);
        return ResponseEntity.noContent().build();
    }
}
