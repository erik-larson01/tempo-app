package com.erikmlarson5.deadlinemanager.entity;

import com.erikmlarson5.deadlinemanager.utils.Status;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

/**
 * The database entity of all Projects and its included fields
 */
@Entity
@Table
public class Project {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long projectId;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String category;

    @Column(nullable = false)
    private LocalDate dueDate;

    @Column(nullable = false, updatable = false)
    private LocalDate createdOnDate;

    private Integer difficulty;

    private float priority = 0.0f;

    @Max(value = 500, message = "Estimated hours must not exceed 500")
    private Float estimatedHours;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    @Enumerated(EnumType.STRING)
    private Status status;

    @Transient
    private Status previousStatus;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Task> tasks = new ArrayList<>();

    public Project() {

    }

    public Project(String title, String description, String category, LocalDate dueDate,
                   Float estimatedHours, Integer difficulty, Status status) {
        this.title = title;
        this.description = description;
        this.category = category;
        this.dueDate = dueDate;
        this.estimatedHours = estimatedHours;
        this.difficulty = difficulty;
        this.status = status;
    }

    public Long getProjectId() {
        return projectId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public Integer getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(Integer difficulty) {
        this.difficulty = difficulty;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public float getPriority() {
        return priority;
    }

    public void setPriority(float priority) {
        this.priority = priority;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public void setEstimatedHours(Float estimatedHours) {
        this.estimatedHours = estimatedHours;
    }

    public Float getEstimatedHours() {
        return estimatedHours;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public OffsetDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(OffsetDateTime completedAt) {
        this.completedAt = completedAt;
    }

    public List<Task> getTasks() {
        return tasks;
    }

    public void setTasks(List<Task> tasks) {
        this.tasks = tasks;
    }

    public void addTask(Task task) {
        tasks.add(task);
        task.setProject(this);
    }

    public void removeTask(Task task) {
        tasks.remove(task);
        task.setProject(null);
    }

    public void setCreatedOnDate(LocalDate createdOnDate) {
        this.createdOnDate = createdOnDate;
    }

    public LocalDate getCreatedOnDate() {
        return createdOnDate;
    }


    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now(ZoneOffset.UTC);
        if (status == Status.COMPLETED) {
            completedAt = OffsetDateTime.now(ZoneOffset.UTC);
        }
    }

    @PostLoad
    protected void onLoad() {
        previousStatus = status;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now(ZoneOffset.UTC);

        if (status == Status.COMPLETED && previousStatus != Status.COMPLETED) {
            completedAt = OffsetDateTime.now(ZoneOffset.UTC);
        }

        if (status != Status.COMPLETED) {
            completedAt = null;
        }

        previousStatus = status;
    }

    @Override
    public String toString() {
        return "Project{" +
                "projectId=" + projectId +
                ", title='" + title + '\'' +
                ", description='" + description + '\'' +
                ", category='" + category + '\'' +
                ", dueDate=" + dueDate +
                ", estimatedHours=" + estimatedHours +
                ", difficulty=" + difficulty +
                ", priority=" + priority +
                ", status=" + status +
                ", createdOnDate=" + createdOnDate +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                ", completedAt=" + completedAt +
                '}';
    }
}
