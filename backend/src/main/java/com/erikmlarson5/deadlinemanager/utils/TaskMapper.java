package com.erikmlarson5.deadlinemanager.utils;

import com.erikmlarson5.deadlinemanager.dto.TaskInputDTO;
import com.erikmlarson5.deadlinemanager.dto.TaskOutputDTO;
import com.erikmlarson5.deadlinemanager.entity.Project;
import com.erikmlarson5.deadlinemanager.entity.Task;

/**
 * Mapper methods for clean Task DTO conversions
 */
public class TaskMapper {
    /**
     * Maps an input DTO to a Postgres database entity
     * @param dto the input DTO
     * @param project the project object associated with the task
     * @return the DTO in entity form
     */
    public static Task toEntity(TaskInputDTO dto, Project project) {
        Task task = new Task();
        task.setTitle(dto.getTitle());
        task.setDescription(dto.getDescription());
        task.setDueDate(dto.getDueDate());
        task.setEstimatedHours(dto.getEstimatedHours());
        task.setDifficulty(dto.getDifficulty());
        task.setStatus(Status.valueOf(dto.getStatus().toUpperCase()));
        task.setProject(project);
        task.setCreatedOnDate(dto.getClientDate());
        return task;
    }

    /**
     * Maps a database entity to an output DTO
     * @param task the task entity to be converted
     * @return the entity in outputDTO form
     */
    public static TaskOutputDTO toOutputDto(Task task) {
        TaskOutputDTO dto = new TaskOutputDTO();
        dto.setTaskId(task.getTaskId());
        dto.setTitle(task.getTitle());
        dto.setDescription(task.getDescription());
        dto.setDueDate(task.getDueDate());
        dto.setEstimatedHours(task.getEstimatedHours());
        dto.setDifficulty(task.getDifficulty());
        dto.setStatus(task.getStatus().toString());
        dto.setCreatedAt(task.getCreatedAt());
        dto.setUpdatedAt(task.getUpdatedAt());
        dto.setCompletedAt(task.getCompletedAt());
        dto.setProjectId(task.getProject().getProjectId());
        dto.setCreatedOnDate(task.getCreatedOnDate());
        return dto;
    }
}
