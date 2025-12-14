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
     * Delete a file by its URL.
     * 
     * @param fileUrl The URL of the file to delete
     */
    void deleteFile(String fileUrl);
}
