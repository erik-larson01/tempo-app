package com.erikmlarson5.deadlinemanager.repository;

import com.erikmlarson5.deadlinemanager.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * A JPA repository for Tempo users.
 */
@Repository
public interface UserRepository extends JpaRepository<User, String> {
  
}
