package com.courseflow.assignments.service;

import java.io.IOException;

/**
 * Interface for file storage service.
 */
public interface FileStorageService {

    /**
     * Upload a file and return its public URL.
     * 
     * @param fileName    The name of the file
     * @param fileData    The file content in bytes
     * @param contentType The MIME type of the file
     * @return The public URL of the uploaded file
     * @throws IOException If the file upload fails
     */
    String uploadFile(String fileName, byte[] fileData, String contentType) throws IOException;

    /**
     * Generate a pre-signed URL for direct upload to S3.
     */
    String generatePresignedUrl(String key, String contentType);

    void deleteFile(String fileUrl);
}
