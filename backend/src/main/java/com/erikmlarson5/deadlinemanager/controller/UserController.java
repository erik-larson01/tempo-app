package com.erikmlarson5.deadlinemanager.controller;

import com.erikmlarson5.deadlinemanager.dto.UserInputDTO;
import com.erikmlarson5.deadlinemanager.dto.UserOutputDTO;
import com.erikmlarson5.deadlinemanager.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * A controller for the current authenticated user profile.
 */
@Validated
@RestController
@RequestMapping(path = "/api/v1/users")
public class UserController {
    private final UserService userService;

    /**
     * User controller which connects to the service layer.
     * @param userService the injected service to connect to
     */
    @Autowired
    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Returns the current authenticated user profile.
     * @param jwt the authenticated JWT
     * @return the current user's profile and lifetime statistics
     */
    @GetMapping(path = "/me")
    public ResponseEntity<UserOutputDTO> getCurrentUser(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(userService.getCurrentUserProfile(jwt));
    }

    /**
     * Updates the current authenticated user's display name.
     * @param dto the new display name payload
     * @param jwt the authenticated JWT
     * @return the updated user profile and lifetime statistics
     */
    @PatchMapping(path = "/me")
    public ResponseEntity<UserOutputDTO> updateCurrentUserDisplayName(@RequestBody @Valid UserInputDTO dto,
                                                                      @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(userService.updateCurrentUserDisplayName(jwt, dto));
    }
}
