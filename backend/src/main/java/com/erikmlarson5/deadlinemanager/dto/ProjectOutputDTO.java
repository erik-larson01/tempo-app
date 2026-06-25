package com.erikmlarson5.deadlinemanager.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * A DTO for Projects which is returned to the user in a ResponseEntity
 */
public class ProjectOutputDTO {

    private Long projectId;
    private String title;
    private String description;
    private String category;
    private LocalDate dueDate;
    private Float estimatedHours;
    private Integer difficulty;
    private String status;
    private float priority;
    private LocalDate createdOnDate;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private OffsetDateTime completedAt;
    private List<TaskOutputDTO> tasks;

    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public Float getEstimatedHours() { return estimatedHours; }
    public void setEstimatedHours(Float estimatedHours) { this.estimatedHours = estimatedHours; }

    public Integer getDifficulty() { return difficulty; }
    public void setDifficulty(Integer difficulty) { this.difficulty = difficulty; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public float getPriority() { return priority; }
    public void setPriority(float priority) { this.priority = priority; }

    public LocalDate getCreatedOnDate() { return createdOnDate; }
    public void setCreatedOnDate(LocalDate createdOnDate) { this.createdOnDate = createdOnDate; }

    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
    public void setCompletedAt(OffsetDateTime completedAt) { this.completedAt = completedAt; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public OffsetDateTime getCompletedAt() { return completedAt; }


    public List<TaskOutputDTO> getTasks() { return tasks; }
    public void setTasks(List<TaskOutputDTO> tasks) { this.tasks = tasks; }
}
