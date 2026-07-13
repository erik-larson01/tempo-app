package com.erikmlarson5.deadlinemanager.controller;

import com.erikmlarson5.deadlinemanager.dto.ProjectInputDTO;
import com.erikmlarson5.deadlinemanager.service.ICSImportService;
import com.erikmlarson5.deadlinemanager.dto.ICSImportResultDTO;
import com.erikmlarson5.deadlinemanager.dto.ICSPreviewItemDTO;
import com.erikmlarson5.deadlinemanager.dto.ICSPreviewRequestDTO;
import com.erikmlarson5.deadlinemanager.service.ProjectService;
import com.erikmlarson5.deadlinemanager.service.UserService;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;

/**
 * A controller for handling ICS import functionality.
 */
@Validated
@RestController
@RequestMapping(path = "/api/v1/integrations/ics")
public class ICSImportController {
    private final ICSImportService icsImportService;

    // This controller is currently a placeholder for future ICS import functionality.

    @Autowired
    public ICSImportController(ICSImportService icsImportService, UserService userService, ProjectService projectService) {
        this.icsImportService = icsImportService;
    }

    @PostMapping("/preview")
    public ResponseEntity<List<ICSPreviewItemDTO>> preview(@RequestBody @Valid ICSPreviewRequestDTO request, @AuthenticationPrincipal Jwt jwt,
        @RequestHeader(value = "X-Timezone", defaultValue = "UTC") String timezone) {

        List<ICSPreviewItemDTO> preview = icsImportService.previewICS(request, jwt, timezone);

        return ResponseEntity.ok(preview);
    }

    @PostMapping("/import")
    public ResponseEntity<ICSImportResultDTO> importProjects(
          @RequestBody List<@Valid ProjectInputDTO> projectsToImport,
          @AuthenticationPrincipal Jwt jwt) {

        ICSImportResultDTO result = icsImportService.importProjectsFromICS(projectsToImport, jwt);

        return ResponseEntity.ok(result);
    }
}