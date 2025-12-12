package com.courseflow.auth.dto;

import com.courseflow.users.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

/**
 * Response DTO for authentication endpoints.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String accessToken;
    private UserInfo user;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        private String id;
        private String name;
        private String email;
        private List<User.UserRole> roles;

        // Profile fields
        private String bio;
        private String phone;
        private String location;
        private String avatarUrl;
        private String major;
        private String year;
        private String enrollmentDate;
        private String studentId;
        private String timezone;

        private List<User.Link> links;
    }
}
