package com.courseflow.assignments.service;

import io.awspring.cloud.s3.S3Template;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.UUID;

/**
 * AWS S3 implementation of FileStorageService.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class S3FileStorageService implements FileStorageService {

    private final S3Template s3Template;

    @Value("${spring.cloud.aws.s3.bucket}")
    private String bucketName;

    @Override
    public String uploadFile(String fileName, byte[] fileData, String contentType) throws IOException {
        String key = "uploads/" + UUID.randomUUID() + "-" + fileName;

        try {
            return s3Template.upload(bucketName, key, new ByteArrayInputStream(fileData)).getURL().toString();
        } catch (Exception e) {
            log.error("Failed to upload file to S3", e);
            throw new IOException("Failed to upload file to S3: " + e.getMessage(), e);
        }
    }

    @Override
    public void deleteFile(String fileUrl) {
        // Simple extraction of key from URL - robustness improved needed for production
        try {
            String key = fileUrl.substring(fileUrl.indexOf("uploads/"));
            s3Template.deleteObject(bucketName, key);
        } catch (Exception e) {
            log.error("Failed to delete file from S3: {}", fileUrl, e);
        }
    }
}
