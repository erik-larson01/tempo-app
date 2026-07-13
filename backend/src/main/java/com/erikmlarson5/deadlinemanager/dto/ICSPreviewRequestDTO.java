package com.erikmlarson5.deadlinemanager.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * A DTO which validates the input for an ICS preview request
 */
public class ICSPreviewRequestDTO {
    @NotBlank(message = "ICS URL must not be blank")
    private String url;

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }
}
