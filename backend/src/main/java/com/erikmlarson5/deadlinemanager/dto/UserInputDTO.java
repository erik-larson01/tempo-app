package com.erikmlarson5.deadlinemanager.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * A DTO used to update the current authenticated user's editable profile fields.
 */
public class UserInputDTO {
    @NotBlank(message = "Display name is required")
    @Size(max = 50, message = "Display name must be 50 characters or fewer")
    private String displayName;

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }
}
