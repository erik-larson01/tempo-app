package com.erikmlarson5.deadlinemanager.service;

import com.erikmlarson5.deadlinemanager.dto.*;
import com.erikmlarson5.deadlinemanager.entity.Project;
import com.erikmlarson5.deadlinemanager.entity.User;
import com.erikmlarson5.deadlinemanager.repository.ProjectRepository;
import com.erikmlarson5.deadlinemanager.utils.ICSParser;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service layer for ICS preview and import functionality
 */
@Service
@Transactional
public class ICSImportService {

    private final ProjectRepository projectRepository;
    private final ProjectService projectService;
    private final UserService userService;
    private final ICSParser icsParser;

    @Autowired
    public ICSImportService(ProjectRepository projectRepository,
                             ProjectService projectService,
                             UserService userService,
                             ICSParser icsParser) {
        this.projectRepository = projectRepository;
        this.projectService = projectService;
        this.userService = userService;
        this.icsParser = icsParser;
    }

    /**
     * Fetches and parses an ICS URL, returns a preview list without saving anything.
     * Marks items that already exist as projects for this user.
     */
    public List<ICSPreviewItemDTO> previewICS(ICSPreviewRequestDTO request, Jwt jwt, String timezone) {
        User user = userService.getOrCreateUser(jwt);

        // Validate the URL before making any external request
        validateUrl(request.getUrl());

        // Fetch the raw ICS content from the external calendar URL
        String icsContent = fetchIcsContent(request.getUrl());

        // Determine the user's current local date for filtering past events
        ZoneId zoneId = resolveZone(timezone);
        LocalDate today = LocalDate.now(zoneId);

        // Parse the ICS content into preview items
        List<ICSPreviewItemDTO> items = icsParser.parse(icsContent, timezone, today);

        // Get all existing project titles for this user to check for duplicates
        Set<String> existingTitles = projectRepository.findByUser(user)
                .stream()
                .map(Project::getTitle)
                .collect(Collectors.toSet());

        // Mark each item that already exists as a project
        for (ICSPreviewItemDTO item : items) {
            if (existingTitles.contains(item.getTitle())) {
                item.setAlreadyExists(true);
            }
        }

        // Sort by due date ascending to show the soonest deadlines first
        items.sort((a, b) -> a.getDueDate().compareTo(b.getDueDate()));

        return items;
    }

    /**
     * Creates projects from the user-confirmed list of ProjectInputDTOs.
     * Each item has already been edited and confirmed by the user on the frontend.
     * Skips any that already exist — catches the duplicate exception cleanly.
     */
    public ICSImportResultDTO importProjectsFromICS(List<ProjectInputDTO> selectedItems,Jwt jwt) {
        List<ProjectOutputDTO> created = new ArrayList<>();

        for (ProjectInputDTO dto : selectedItems) {
            ProjectOutputDTO project = projectService.createProject(dto, jwt);
            created.add(project);
        }

        return new ICSImportResultDTO(created);
    }

    /**
     * Fetches raw ICS content from an external URL using Java's built-in HttpClient.
     * Times out after 10 seconds to prevent hanging on slow calendar servers.
     */
    private String fetchIcsContent(String url) {
        try {
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new IllegalArgumentException(
                    "Calendar server returned status " + response.statusCode() +
                    ". Check that your calendar URL is correct and still valid."
                );
            }

            String body = response.body();
            if (body == null || body.isBlank()) {
                throw new IllegalArgumentException("Calendar URL returned empty content.");
            }

            // Check beginning of ICS file as ICS files always start with BEGIN:VCALENDAR
            if (!body.contains("BEGIN:VCALENDAR")) {
                throw new IllegalArgumentException(
                    "URL did not return a valid calendar file. Make sure you copied the calendar feed URL, not a regular webpage URL."
                );
            }

            return body;

        } catch (IllegalArgumentException e) {
            throw e;  // re-throw our own errors as-is
        } catch (Exception e) {
            throw new IllegalArgumentException(
                "Could not fetch calendar from URL: " + e.getMessage()
            );
        }
    }

    /**
     * Validates the ICS URL before making any external request.
     * Prevents SSRF attacks by blocking internal/private addresses.
     */
    private void validateUrl(String url) {
        if (url == null || url.isBlank()) {
            throw new IllegalArgumentException("URL is required");
        }

        URI uri;
        try {
            uri = URI.create(url);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid URL format");
        }

        String scheme = uri.getScheme();
        if (!"https".equals(scheme) && !"http".equals(scheme)) {
            throw new IllegalArgumentException("URL must use http or https");
        }

        String host = uri.getHost();
        if (host == null || host.isBlank()) {
            throw new IllegalArgumentException("URL must have a valid host");
        }

        // Block internal addresses prevents SSRF attacks by disallowing localhost
        if (host.equals("localhost") ||
            host.equals("127.0.0.1") ||
            host.startsWith("192.168.") ||
            host.startsWith("10.") ||
            host.startsWith("172.16.")) {
            throw new IllegalArgumentException("Invalid URL");
        }
    }

    /**
     * Safely resolves a timezone string. Falls back to UTC if invalid.
     */
    private ZoneId resolveZone(String timezone) {
        try {
            return ZoneId.of(timezone != null ? timezone : "UTC");
        } catch (Exception e) {
            return ZoneId.of("UTC");
        }
    }
}