package com.courseflow.inbox.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for sending messages.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageRequest {

    @NotBlank(message = "Message body is required")
    @Size(max = 5000, message = "Message body must be at most 5000 characters")
    private String body;

    private java.util.List<com.courseflow.inbox.model.Message.Attachment> attachments;
}
