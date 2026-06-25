package com.erikmlarson5.deadlinemanager.dto;

import jakarta.validation.constraints.*;

import java.time.LocalDate;

/**
 * A DTO which validates all fields of an incoming Project
 */
public class TaskInputDTO {

    @NotBlank(message = "Title must not be blank")
    @Size(max = 70, message = "Title must be 70 characters or fewer")
    private String title;

    @Size(max = 500, message = "Description must be 500 characters or fewer")
    private String description;

    private LocalDate dueDate;

    @NotNull(message = "Estimated hours is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Estimated hours must be at least 0")
    @DecimalMax(value = "1000.0", inclusive = true, message = "Estimated hours must not exceed 1000")
    private Float estimatedHours;

    @NotNull(message = "Difficulty is required")
    @Min(value = 1, message = "Difficulty must be between 1 and 10")
    @Max(value = 10, message = "Difficulty must be between 1 and 10")
    private Integer difficulty;

    @NotBlank(message = "Status is required")
    @Pattern(regexp = "(?i)^(NOT_STARTED|IN_PROGRESS|COMPLETED)$",
            message = "Status must be one of: NOT_STARTED, IN_PROGRESS, COMPLETED")
    private String status;

    private LocalDate clientDate;

    public LocalDate getClientDate() { return clientDate; }
    public void setClientDate(LocalDate clientDate) { this.clientDate = clientDate; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public Float getEstimatedHours() { return estimatedHours; }
    public void setEstimatedHours(Float estimatedHours) { this.estimatedHours = estimatedHours; }

    public Integer getDifficulty() { return difficulty; }
    public void setDifficulty(Integer difficulty) { this.difficulty = difficulty; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
