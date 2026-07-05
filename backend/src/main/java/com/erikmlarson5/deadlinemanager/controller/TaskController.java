package com.erikmlarson5.deadlinemanager.controller;

import com.erikmlarson5.deadlinemanager.dto.ProjectOutputDTO;
import com.erikmlarson5.deadlinemanager.dto.TaskInputDTO;
import com.erikmlarson5.deadlinemanager.dto.TaskOutputDTO;
import com.erikmlarson5.deadlinemanager.service.TaskService;
import com.erikmlarson5.deadlinemanager.utils.Status;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * A controller which sets all task related endpoints and connects to the service logic layer
 */
@Validated
@RestController
@RequestMapping(path = "/api/v1")
public class TaskController {
    private final TaskService taskService;

    /**
     * Task controller which connects to the service layer
     * @param taskService the injected service to connect to
     */
    @Autowired
    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    /**
     * Creates an endpoint to save a new task to PostgresSQL
     * @param projectId the id of the associated project
     * @param dto the inputDTO object to convert and save
     * @return a response entity containing the created task
     */
    @PostMapping(path = "projects/{projectId}/tasks")
    public ResponseEntity<ProjectOutputDTO> createTask(@PathVariable @Positive Long projectId,
                                                       @RequestBody @Valid TaskInputDTO dto,
                                                       @AuthenticationPrincipal Jwt jwt) {
        ProjectOutputDTO updatedProject = taskService.createTask(projectId, dto, jwt);
        return ResponseEntity.status(HttpStatus.CREATED).body(updatedProject);
    }

    /**
     * Creates an endpoint to get a task by its unique id
     * @param projectId the id of the associated project
     * @param taskId the id of the task to get
     * @return a response entity containing the found task
     */
    @GetMapping(path = "projects/{projectId}/tasks/{taskId}")
    public ResponseEntity<TaskOutputDTO> getTaskById(@PathVariable @Positive Long projectId,
                                                     @PathVariable @Positive Long taskId,
                                                     @AuthenticationPrincipal Jwt jwt) {
        TaskOutputDTO task = taskService.getTaskById(projectId, taskId, jwt);
        return ResponseEntity.ok(task);
    }

    /**
     * Creates an endpoint to get all tasks
     * @return a response entity containing all tasks
     */
    @GetMapping(path = "/tasks")
    public ResponseEntity<List<TaskOutputDTO>> getAllTasks(@AuthenticationPrincipal Jwt jwt) {
        List<TaskOutputDTO> allTasks = taskService.getAllTasks(jwt);
        return ResponseEntity.ok(allTasks);
    }

    /**
     * Creates an endpoint to get all tasks in a given project
     * @param projectId the id of the associated project
     * @return a response entity containing the found tasks
     */
    @GetMapping(path = "/projects/{projectId}/tasks")
    public ResponseEntity<List<TaskOutputDTO>> getTasksInProject(@PathVariable @Positive Long projectId, @AuthenticationPrincipal Jwt jwt) {
        List<TaskOutputDTO> allTasksInProject = taskService.getTasksInProject(projectId, jwt);
        return ResponseEntity.ok(allTasksInProject);
    }

    /**
     * Creates an endpoint to get all tasks by an enum status
     * @param status the enum status to search by
     * @return a response entity containing the found tasks
     */
    @GetMapping(path = "/tasks/status")
    public ResponseEntity<List<TaskOutputDTO>> getAllTasksByStatus(@RequestParam @Valid Status status, @AuthenticationPrincipal Jwt jwt) {
        List<TaskOutputDTO> tasksByStatus = taskService.getAllTasksByStatus(status, jwt);
        return ResponseEntity.ok(tasksByStatus);
    }

    /**
     * Creates an endpoint to get all incomplete tasks in a given project
     * @param projectId the id of the associated project
     * @return a response entity containing the found tasks
     */
    @GetMapping(path = "/projects/{projectId}/tasks/incomplete")
    public ResponseEntity<List<TaskOutputDTO>> getIncompleteTasksInProject(@PathVariable @Positive Long projectId, @AuthenticationPrincipal Jwt jwt) {
        List<TaskOutputDTO> incompleteTasks = taskService.getIncompleteTasksInProject(projectId, jwt);
        return ResponseEntity.ok(incompleteTasks);
    }

    /**
     * Creates an endpoint to update a specific task
     * @param projectId the id of the associated project
     * @param taskId the id of the task to update
     * @param dto the new inputDTO to be saved
     * @return a response entity of the updated task
     */
    @PutMapping(path = "/projects/{projectId}/tasks/{taskId}")
    public ResponseEntity<ProjectOutputDTO> updateTask(@PathVariable @Positive Long projectId,
                                                       @PathVariable @Positive Long taskId,
                                                       @RequestBody @Valid TaskInputDTO dto,
                                                       @AuthenticationPrincipal Jwt jwt) {
        ProjectOutputDTO updatedProject = taskService.updateTask(projectId, taskId, dto, jwt);
        return ResponseEntity.ok(updatedProject);
    }

    /**
     * Creates an endpoint to update a specific task's status field
     * @param projectId the id of the associated project
     * @param taskId the id of the task to update
     * @param newStatus the new enum status to be saved
     * @return a response entity of the updated task
     */
    @PatchMapping(path = "/projects/{projectId}/tasks/{taskId}/status")
        public ResponseEntity<ProjectOutputDTO> updateTaskStatus(@PathVariable @Positive Long projectId,
                                     @PathVariable @Positive Long taskId,
                                     @RequestParam
                                     @Pattern(regexp = "(?i)^(NOT_STARTED|IN_PROGRESS|COMPLETED)$",
                                         message = "newStatus must be one of: NOT_STARTED, IN_PROGRESS, COMPLETED")
                                     String newStatus,
                                     @AuthenticationPrincipal Jwt jwt) {
        ProjectOutputDTO updatedProject = taskService.updateTaskStatus(projectId, taskId, newStatus, jwt);
        return ResponseEntity.ok(updatedProject);
    }

    /**
     * Creates an endpoint to delete a specific project
     * @param projectId the id of the associated project
     * @param taskId the id of the task to update
     * @return a response entity of the updated task
     */
    @DeleteMapping("/projects/{projectId}/tasks/{taskId}")
    public ResponseEntity<ProjectOutputDTO> deleteTask(@PathVariable @Positive Long projectId,
                                                       @PathVariable @Positive Long taskId,
                                                       @AuthenticationPrincipal Jwt jwt) {
        ProjectOutputDTO updatedProject = taskService.deleteTask(projectId, taskId, jwt);
        return ResponseEntity.ok(updatedProject);
    }
}
