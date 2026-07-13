package com.erikmlarson5.deadlinemanager.dto;

import java.util.List;

/**
 * A DTO which represents the result of an ICS import operation
 */
public class ICSImportResultDTO {
    public ICSImportResultDTO(List<ProjectOutputDTO> createdProjects) {
      this.createdProjects = createdProjects;
    }
    private List<ProjectOutputDTO> createdProjects;

    public List<ProjectOutputDTO> getCreatedProjects() {
      return createdProjects;
    }

    public void setCreatedProjects(List<ProjectOutputDTO> createdProjects) {
      this.createdProjects = createdProjects;
    }
}
