package com.erikmlarson5.deadlinemanager.repository;
import com.erikmlarson5.deadlinemanager.entity.Task;
import com.erikmlarson5.deadlinemanager.entity.User;
import com.erikmlarson5.deadlinemanager.utils.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * A JPA repository for all task related functions, connecting to PostgresSQL
 */
@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByProject_User(User user);

    long countByProject_User(User user);

    List<Task> findByProject_ProjectIdAndProject_User(Long projectId, User user);

    Optional<Task> findByTaskIdAndProject_User(Long taskId, User user);

    // Strongly-typed user-scoped lookup enforcing task->project->user ownership in a single query
    Optional<Task> findByTaskIdAndProject_ProjectIdAndProject_User(Long taskId, Long projectId, User user);

    // Push status + user filter down to the database
    List<Task> findByStatusAndProject_User(Status status, User user);

    long countByStatusAndProject_User(Status status, User user);

}
