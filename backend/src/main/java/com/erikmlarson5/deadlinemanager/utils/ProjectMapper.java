package com.erikmlarson5.deadlinemanager.utils;

import com.erikmlarson5.deadlinemanager.dto.ProjectInputDTO;
import com.erikmlarson5.deadlinemanager.dto.ProjectOutputDTO;
import com.erikmlarson5.deadlinemanager.dto.TaskOutputDTO;
import com.erikmlarson5.deadlinemanager.entity.Project;
import com.erikmlarson5.deadlinemanager.entity.Task;

import java.util.ArrayList;
import java.util.List;

/**
 * Mapper methods for clean Project DTO conversions
 */
public class ProjectMapper {

    /**
     * Maps an input DTO to a Postgres database entity
     * @param dto the input DTO
     * @return the DTO in entity form
     */
    public static Project toEntity(ProjectInputDTO dto) {
        Project project = new Project();
        project.setTitle(dto.getTitle());
        project.setDescription(dto.getDescription());
        project.setCategory(dto.getCategory());
        project.setDueDate(dto.getDueDate());
        project.setEstimatedHours(dto.getEstimatedHours());
        project.setDifficulty(dto.getDifficulty());
        project.setStatus(Status.valueOf(dto.getStatus().toUpperCase()));
        project.setCreatedOnDate(dto.getClientDate());
        return project;
    }

    /**
     * Maps a database entity to an output DTO
     * @param project the project entity to be converted
     * @return the entity in outputDTO form
     */
    public static ProjectOutputDTO toOutputDto(Project project) {
        ProjectOutputDTO dto = new ProjectOutputDTO();
        dto.setProjectId(project.getProjectId());
        dto.setTitle(project.getTitle());
        dto.setDescription(project.getDescription());
        dto.setCategory(project.getCategory());
        dto.setDueDate(project.getDueDate());
        dto.setEstimatedHours(project.getEstimatedHours());
        dto.setDifficulty(project.getDifficulty());
        dto.setStatus(project.getStatus() != null ? project.getStatus().name() : null);
        dto.setPriority(project.getPriority());
        dto.setCreatedAt(project.getCreatedAt());
        dto.setUpdatedAt(project.getUpdatedAt());
        dto.setCompletedAt(project.getCompletedAt());
        dto.setCreatedOnDate(project.getCreatedOnDate());

        if (project.getTasks() != null) {
            List<TaskOutputDTO> taskDtos = new ArrayList<>();
            for (Task task : project.getTasks()) {
                TaskOutputDTO taskDto = TaskMapper.toOutputDto(task);
                taskDtos.add(taskDto);
            }
            dto.setTasks(taskDtos);
        }
        return dto;
    }
}
