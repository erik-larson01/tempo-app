package com.erikmlarson5.deadlinemanager.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;


/**
 * The database entity for Tempo users authenticated through Auth0.
 */
@Entity
@Table(name="users")
public class User {
    @Id
    @Column(name = "auth0_id", nullable = false, updatable = false)
    private String auth0Id;

    @Column(nullable = false)
    private String displayName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(nullable = false)
    private long lifetimeCompletedTasks = 0;

    @Column(nullable = false)
    private long lifetimeCreatedProjects = 0;


    public User() {

    }

    public String getAuth0Id() {
        return auth0Id;
    }

    public void setAuth0Id(String auth0Id) {
        this.auth0Id = auth0Id;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public long getLifetimeCompletedTasks() { 
        return lifetimeCompletedTasks; 
    }

    public void setLifetimeCompletedTasks(long value) { 
        this.lifetimeCompletedTasks = value; 
    }
    
    public void incrementLifetimeCompletedTasks() { 
        this.lifetimeCompletedTasks++; 
    }

    public long getLifetimeCreatedProjects() { 
        return lifetimeCreatedProjects; 
    }

    public void setLifetimeCreatedProjects(long value) { 
        this.lifetimeCreatedProjects = value; 
    }

    public void incrementLifetimeCreatedProjects() { 
      this.lifetimeCreatedProjects++; 
    }

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now(ZoneOffset.UTC);
    }
}
