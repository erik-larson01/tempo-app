package com.erikmlarson5.deadlinemanager.utils;

import com.erikmlarson5.deadlinemanager.dto.UserOutputDTO;
import com.erikmlarson5.deadlinemanager.entity.User;

/**
 * Mapper methods for clean User DTO conversions.
 */
public class UserMapper {
    /**
     * Maps a database entity to an output DTO.
     * @param user the user entity to be converted
     * @return the entity in outputDTO form
     */
    public static UserOutputDTO toOutputDto(User user, long projectCount, long taskCount, long completedTaskCount) {
        UserOutputDTO dto = new UserOutputDTO();
        dto.setDisplayName(user.getDisplayName());
        dto.setEmail(user.getEmail());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setProjectCount(projectCount);
        dto.setTaskCount(taskCount);
        dto.setCompletedTaskCount(completedTaskCount);
        dto.setCompletionRate(taskCount == 0 ? 0.0 : Math.round((completedTaskCount * 1000.0 / taskCount)) / 10.0);
        return dto;
    }
}
