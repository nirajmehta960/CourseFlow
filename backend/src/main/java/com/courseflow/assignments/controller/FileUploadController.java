package com.courseflow.assignments.controller;

import com.courseflow.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import com.courseflow.assignments.service.FileStorageService;
import java.io.IOException;
import java.util.Base64;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for file upload endpoints (basic base64 support for now).
 * TODO: Replace with S3/MinIO in production.
 */
@RestController
@RequestMapping("/files")
@RequiredArgsConstructor
@Tag(name = "File Upload", description = "File upload endpoints")
public class FileUploadController {

    private final FileStorageService fileStorageService;
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    @PostMapping("/upload")
    @Operation(summary = "Upload file", description = "Upload a file as base64. Returns a data URL that can be stored in submissions.")
    public ResponseEntity<ApiResponse<FileUploadResponse>> uploadFile(
            @RequestBody FileUploadRequest request) {

        // Validate file size (base64 is ~33% larger than original)
        long estimatedSize = (request.getBase64Data().length() * 3) / 4;
        if (estimatedSize > MAX_FILE_SIZE) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("FILE_TOO_LARGE", "File size exceeds 10MB limit", null));
        }

        // Validate base64 format
        if (!request.getBase64Data().matches("^data:[^;]+;base64,[A-Za-z0-9+/=]+$")) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("INVALID_FORMAT", "Invalid base64 data URL format", null));
        }

        try {
            // Parse base64
            String[] parts = request.getBase64Data().split(",");
            String contentType = parts[0].split(":")[1].split(";")[0];
            String base64String = parts[1];
            byte[] fileData = Base64.getDecoder().decode(base64String);

            // Upload to S3
            String fileUrl = fileStorageService.uploadFile(request.getFileName(), fileData, contentType);

            FileUploadResponse response = FileUploadResponse.builder()
                    .url(fileUrl)
                    .fileName(request.getFileName())
                    .fileSize(estimatedSize)
                    .build();

            return ResponseEntity.ok(ApiResponse.success(response, "File uploaded successfully"));
        } catch (IOException | IllegalArgumentException e) {
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.error("UPLOAD_FAILED", "Failed to upload file: " + e.getMessage(), null));
        }

    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FileUploadRequest {
        private String fileName;
        private String base64Data; // data:image/png;base64,iVBORw0KG...
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FileUploadResponse {
        private String url;
        private String fileName;
        private Long fileSize;
    }
}
