package com.erikmlarson5.deadlinemanager.repository;

import com.erikmlarson5.deadlinemanager.entity.Project;
import com.erikmlarson5.deadlinemanager.entity.User;
import com.erikmlarson5.deadlinemanager.utils.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * A JPA repository for all project related functions, connecting to PostgresSQL
 */
@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    Optional<Project> findByProjectIdAndUser(Long projectId, User user);

    List<Project> findByUser(User user);

    long countByUser(User user);

    List<Project> findByCategoryIgnoreCaseAndUser(String category, User user);

    List<Project> findByStatusAndUser(Status status, User user);

    List<Project> findByDueDateBetweenAndUser(LocalDate start, LocalDate end, User user);

    List<Project> findAllByUserOrderByPriorityDesc(User user);

    boolean existsByTitleAndUser(String title, User user);
}
