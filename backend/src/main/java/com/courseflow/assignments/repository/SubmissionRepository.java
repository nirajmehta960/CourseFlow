package com.courseflow.assignments.repository;

import com.courseflow.assignments.model.Submission;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Submission entity operations.
 */
@Repository
public interface SubmissionRepository extends MongoRepository<Submission, String> {

    /**
     * Find a submission by assignment ID and student ID.
     * 
     * @param assignmentId The assignment ID
     * @param studentId    The student ID
     * @return Optional submission
     */
    Optional<Submission> findByAssignmentIdAndStudentId(String assignmentId, String studentId);

    /**
     * Find all submissions for an assignment.
     * 
     * @param assignmentId The assignment ID
     * @return List of submissions
     */
    List<Submission> findByAssignmentIdOrderBySubmittedAtDesc(String assignmentId);

    /**
     * Find all submissions for an assignment (unordered).
     * 
     * @param assignmentId The assignment ID
     * @return List of submissions
     */
    List<Submission> findByAssignmentId(String assignmentId);

    /**
     * Find all submissions for a course and student.
     * 
     * @param courseId  The course ID
     * @param studentId The student ID
     * @return List of submissions
     */
    List<Submission> findByCourseIdAndStudentIdOrderBySubmittedAtDesc(String courseId, String studentId);

    /**
     * Check if a submission exists for an assignment and student.
     * 
     * @param assignmentId The assignment ID
     * @param studentId    The student ID
     * @return true if submission exists, false otherwise
     */
    boolean existsByAssignmentIdAndStudentId(String assignmentId, String studentId);

    /**
     * Count submissions for a course with a specific status and no grade (pending).
     * 
     * @param courseId The course ID
     * @param status   The submission status
     * @return Count of pending submissions
     */
    long countByCourseIdAndStatusAndGradeIsNull(String courseId, Submission.SubmissionStatus status);

    /**
     * Find all submissions for a list of assignment IDs.
     * 
     * @param assignmentIds List of assignment IDs
     * @return List of submissions
     */
    List<Submission> findByAssignmentIdIn(List<String> assignmentIds);
}
