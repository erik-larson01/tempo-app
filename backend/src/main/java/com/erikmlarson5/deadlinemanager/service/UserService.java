package com.erikmlarson5.deadlinemanager.service;

import com.erikmlarson5.deadlinemanager.dto.UserInputDTO;
import com.erikmlarson5.deadlinemanager.dto.UserOutputDTO;
import com.erikmlarson5.deadlinemanager.entity.User;
import com.erikmlarson5.deadlinemanager.repository.ProjectRepository;
import com.erikmlarson5.deadlinemanager.repository.TaskRepository;
import com.erikmlarson5.deadlinemanager.repository.UserRepository;
import com.erikmlarson5.deadlinemanager.utils.UserMapper;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.dao.DataIntegrityViolationException;

/**
 * Service layer for the current authenticated user profile.
 */
@Service
@Transactional
public class UserService {
    private final UserRepository userRepository;

    private final String NAMESPACE = "https://withtempo.app/";

    /**
     * User service which connects to the repository layer.
     * @param userRepository injected repository for Tempo users
     * @param projectRepository injected project repository for user statistics
     * @param taskRepository injected task repository for user statistics
     */
    @Autowired
    public UserService(UserRepository userRepository, ProjectRepository projectRepository,
                       TaskRepository taskRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Returns the current authenticated user, creating a new record on first login if needed.
     * @param jwt the authenticated JWT
     * @return the persisted user entity
     */
    public User getOrCreateUser(Jwt jwt) {
        String auth0Id = jwt.getSubject();
        return userRepository.findById(auth0Id)
            .map(existing -> syncMissingProfileFields(existing, jwt))
            .orElseGet(() -> createUser(jwt));
    }

    /**
     * Updates the current user's display name.
     * @param jwt the authenticated JWT
     * @param dto the input payload containing the new display name
     * @return the updated user profile and lifetime statistics
     */
    public UserOutputDTO updateCurrentUserDisplayName(Jwt jwt, UserInputDTO dto) {
        User user = getOrCreateUser(jwt);
        String displayName = dto.getDisplayName().trim();
        if (!StringUtils.hasText(displayName)) {
            throw new IllegalArgumentException("Display name is required");
        }

        user.setDisplayName(displayName);
        userRepository.saveAndFlush(user);
        return UserMapper.toOutputDto(user);
    }

    /**
     * Creates a new user record in the database based on the authenticated JWT.
     * @param jwt the authenticated JWT
     * @return the newly created user entity
     */
    private User createUser(Jwt jwt) {
        String auth0Id = jwt.getSubject();

        User user = new User();
        user.setAuth0Id(auth0Id);
        user.setDisplayName(resolveDefaultDisplayName(jwt));
        user.setEmail(resolveEmail(jwt));
        try {
            return userRepository.save(user);
        } catch (DataIntegrityViolationException e) {
            return userRepository.findById(auth0Id)
                .orElseThrow(() -> new IllegalStateException("User creation failed"));
        } catch (Exception e) {
            throw new IllegalStateException("User creation failed", e);
        }
    }

    /**
     * Returns the current authenticated user's profile and lifetime statistics.
     * @param jwt the authenticated JWT
     * @return the current user's profile and lifetime statistics
     */
    public UserOutputDTO getCurrentUserProfile(Jwt jwt) {
        User user = getOrCreateUser(jwt);
        return UserMapper.toOutputDto(user);
    }


    /**
     * Helper method to sync missing profile fields from the JWT to the user entity.
     * @param user
     * @param jwt
     * @return
     */
    private User syncMissingProfileFields(User user, Jwt jwt) {
        boolean changed = false;

        if (!StringUtils.hasText(user.getDisplayName())) {
            user.setDisplayName(resolveDefaultDisplayName(jwt));
            changed = true;
        }

        if (!StringUtils.hasText(user.getEmail())) {
            user.setEmail(resolveEmail(jwt));
            changed = true;
        }

        if (changed) {
            return userRepository.saveAndFlush(user);
        }

        return user;
    }

    /**
     * Helper method to resolve a default display name from the JWT claims.
     * @param jwt
     * @return
     */
    private String resolveDefaultDisplayName(Jwt jwt) {
        String name = jwt.getClaimAsString(NAMESPACE + "name");
        String nickname = jwt.getClaimAsString(NAMESPACE + "nickname");
        if (StringUtils.hasText(nickname)) {
            return nickname.trim();
        }

        if (StringUtils.hasText(name)) {
            return name.trim();
        }

        String email = resolveEmail(jwt);
        if (StringUtils.hasText(email) && email.contains("@")) {
            return email.substring(0, email.indexOf('@'));
        }

        return "Tempo User";
    }

    /**
     * Helper method to resolve the user's email from the JWT claims.
     * @param jwt
     * @return
     */
    private String resolveEmail(Jwt jwt) {
        String email = jwt.getClaimAsString(NAMESPACE + "email");
        if (StringUtils.hasText(email)) {
            return email.trim();
        }


        return jwt.getSubject() + "@auth0.com";
    }
}
