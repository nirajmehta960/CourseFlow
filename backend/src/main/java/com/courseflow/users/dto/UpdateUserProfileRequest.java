package com.courseflow.users.dto;

import com.courseflow.users.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for updating user profile.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserProfileRequest {
    private String name; // Allow updating name
    private String bio;
    private String phone;
    private String location;
    private String avatarUrl;
    private String timezone;
    private List<User.Link> links;

    // Academic info (usually read-only or admin only, but allowing update for now
    // as requested)
    private String major;
    private String year;
    private String enrollmentDate;
    private String studentId;
}
