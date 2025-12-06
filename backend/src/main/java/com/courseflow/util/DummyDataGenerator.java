package com.courseflow.util;

import com.courseflow.assignments.model.Assignment;
import com.courseflow.courses.model.Course;
import com.courseflow.enrollments.model.Enrollment;
import com.courseflow.modules.model.CourseModule;
import com.courseflow.users.model.User;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * Utility class to generate dummy data for the database.
 * 
 * Generates:
 * - 15 students
 * - 5 teachers (INSTRUCTOR role)
 * - 5 TAs
 * - 2 courses per teacher (10 courses total)
 * - Modules and lessons for each course
 * - Assignments for each course
 * - Enrollments (students enrolled in courses)
 * 
 * All passwords are set to: Course@98420
 * 
 * Usage: Run this class and copy the output to insert into MongoDB
 */
public class DummyDataGenerator {
    
    private static final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private static final String PASSWORD = "Course@98420";
    private static final String PASSWORD_HASH = passwordEncoder.encode(PASSWORD);
    
    public static void main(String[] args) {
        System.out.println("// =========================================");
        System.out.println("// DUMMY DATA FOR COURSEFLOW DATABASE");
        System.out.println("// =========================================");
        System.out.println("// Password for all accounts: " + PASSWORD);
        System.out.println("// =========================================");
        System.out.println();
        
        // Generate users
        List<User> students = generateStudents();
        List<User> teachers = generateTeachers();
        List<User> tas = generateTAs();
        
        // Generate courses (2 per teacher)
        List<Course> courses = generateCourses(teachers);
        
        // Generate modules and lessons
        List<CourseModule> courseModules = generateCourseModules(courses);
        
        // Generate assignments
        List<Assignment> assignments = generateAssignments(courses, teachers);
        
        // Generate enrollments
        List<Enrollment> enrollments = generateEnrollments(courses, students, teachers, tas);
        
        // Print all data
        printUsers(students, teachers, tas);
        printCourses(courses);
        printCourseModules(courseModules);
        printAssignments(assignments);
        printEnrollments(enrollments);
        
        System.out.println();
        System.out.println("// =========================================");
        System.out.println("// SUMMARY");
        System.out.println("// =========================================");
        System.out.println("// Students: " + students.size());
        System.out.println("// Teachers: " + teachers.size());
        System.out.println("// TAs: " + tas.size());
        System.out.println("// Courses: " + courses.size());
        System.out.println("// Course Modules: " + courseModules.size());
        System.out.println("// Assignments: " + assignments.size());
        System.out.println("// Enrollments: " + enrollments.size());
        System.out.println("// =========================================");
    }
    
    private static List<User> generateStudents() {
        List<User> students = new ArrayList<>();
        String[] firstNames = {"Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Henry", "Ivy", "Jack", "Kate", "Liam", "Mia", "Noah", "Olivia"};
        String[] lastNames = {"Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas"};
        
        for (int i = 0; i < 15; i++) {
            String firstName = firstNames[i];
            String lastName = lastNames[i];
            String email = firstName.toLowerCase() + "." + lastName.toLowerCase() + "@student.edu";
            
            User student = User.builder()
                    .id(UUID.randomUUID().toString())
                    .name(firstName + " " + lastName)
                    .email(email)
                    .passwordHash(PASSWORD_HASH)
                    .roles(List.of(User.UserRole.STUDENT))
                    .createdAt(Instant.now().minus(30, ChronoUnit.DAYS))
                    .updatedAt(Instant.now().minus(30, ChronoUnit.DAYS))
                    .build();
            
            students.add(student);
        }
        
        return students;
    }
    
    private static List<User> generateTeachers() {
        List<User> teachers = new ArrayList<>();
        String[] firstNames = {"Dr. Sarah", "Prof. Michael", "Dr. Emily", "Prof. David", "Dr. Jennifer"};
        String[] lastNames = {"Anderson", "Brown", "Chen", "Davis", "Evans"};
        String[] subjects = {"Computer Science", "Mathematics", "Physics", "Chemistry", "Biology"};
        
        for (int i = 0; i < 5; i++) {
            String firstName = firstNames[i];
            String lastName = lastNames[i];
            String email = firstName.toLowerCase().replace(" ", ".").replace("dr.", "dr").replace("prof.", "prof") + "." + lastName.toLowerCase() + "@university.edu";
            
            User teacher = User.builder()
                    .id(UUID.randomUUID().toString())
                    .name(firstName + " " + lastName)
                    .email(email)
                    .passwordHash(PASSWORD_HASH)
                    .roles(List.of(User.UserRole.INSTRUCTOR))
                    .createdAt(Instant.now().minus(60, ChronoUnit.DAYS))
                    .updatedAt(Instant.now().minus(60, ChronoUnit.DAYS))
                    .build();
            
            teachers.add(teacher);
        }
        
        return teachers;
    }
    
    private static List<User> generateTAs() {
        List<User> tas = new ArrayList<>();
        String[] firstNames = {"Alex", "Blake", "Casey", "Drew", "Jordan"};
        String[] lastNames = {"Taylor", "Moore", "White", "Harris", "Clark"};
        
        for (int i = 0; i < 5; i++) {
            String firstName = firstNames[i];
            String lastName = lastNames[i];
            String email = firstName.toLowerCase() + "." + lastName.toLowerCase() + "@ta.edu";
            
            User ta = User.builder()
                    .id(UUID.randomUUID().toString())
                    .name(firstName + " " + lastName)
                    .email(email)
                    .passwordHash(PASSWORD_HASH)
                    .roles(List.of(User.UserRole.TA))
                    .createdAt(Instant.now().minus(45, ChronoUnit.DAYS))
                    .updatedAt(Instant.now().minus(45, ChronoUnit.DAYS))
                    .build();
            
            tas.add(ta);
        }
        
        return tas;
    }
    
    private static List<Course> generateCourses(List<User> teachers) {
        List<Course> courses = new ArrayList<>();
        String[] courseTitles = {
            "Introduction to Programming", "Data Structures and Algorithms",
            "Database Systems", "Web Development Fundamentals",
            "Machine Learning Basics", "Software Engineering Principles",
            "Computer Networks", "Operating Systems",
            "Cybersecurity Fundamentals", "Mobile App Development"
        };
        String[] courseCodes = {"CS101", "CS201", "CS301", "CS401", "CS501", "CS601", "CS701", "CS801", "CS901", "CS1001"};
        String[] terms = {"Fall 2024", "Spring 2024", "Fall 2024", "Spring 2024", "Fall 2024", "Spring 2024", "Fall 2024", "Spring 2024", "Fall 2024", "Spring 2024"};
        String[] sections = {"A", "B", "A", "B", "A", "B", "A", "B", "A", "B"};
        
        int courseIndex = 0;
        for (User teacher : teachers) {
            for (int i = 0; i < 2; i++) {
                Course course = Course.builder()
                        .id(UUID.randomUUID().toString())
                        .title(courseTitles[courseIndex])
                        .code(courseCodes[courseIndex])
                        .term(terms[courseIndex])
                        .section(sections[courseIndex])
                        .description("This course covers fundamental concepts and practical applications in " + courseTitles[courseIndex].toLowerCase() + ". Students will learn through lectures, assignments, and hands-on projects.")
                        .coverImageUrl("https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800")
                        .status(Course.CourseStatus.PUBLISHED)
                        .createdBy(teacher.getId())
                        .instructorIds(List.of(teacher.getId()))
                        .published(true)
                        .createdAt(Instant.now().minus(20, ChronoUnit.DAYS))
                        .updatedAt(Instant.now().minus(5, ChronoUnit.DAYS))
                        .build();
                
                courses.add(course);
                courseIndex++;
            }
        }
        
        return courses;
    }
    
    private static List<CourseModule> generateCourseModules(List<Course> courses) {
        List<CourseModule> courseModules = new ArrayList<>();
        String[] moduleTitles = {
            "Introduction and Overview",
            "Core Concepts",
            "Advanced Topics",
            "Practical Applications",
            "Final Project"
        };
        
        for (Course course : courses) {
            List<CourseModule.Module> modules = new ArrayList<>();
            
            for (int i = 0; i < 5; i++) {
                List<CourseModule.ModuleItem> items = new ArrayList<>();
                
                // Add different types of items
                // Video lesson
                items.add(CourseModule.ModuleItem.builder()
                        .itemId(UUID.randomUUID().toString())
                        .type(CourseModule.ModuleItem.ItemType.VIDEO)
                        .title("Introduction Video")
                        .url("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
                        .published(true)
                        .build());
                
                // Document lesson
                items.add(CourseModule.ModuleItem.builder()
                        .itemId(UUID.randomUUID().toString())
                        .type(CourseModule.ModuleItem.ItemType.DOC)
                        .title("Course Notes")
                        .url("https://example.com/notes.pdf")
                        .published(true)
                        .build());
                
                // Assignment item
                items.add(CourseModule.ModuleItem.builder()
                        .itemId(UUID.randomUUID().toString())
                        .type(CourseModule.ModuleItem.ItemType.ASSIGNMENT)
                        .title("Module " + (i + 1) + " Assignment")
                        .dueDate(Instant.now().plus(7 + i * 7, ChronoUnit.DAYS))
                        .published(true)
                        .build());
                
                CourseModule.Module module = CourseModule.Module.builder()
                        .moduleId(UUID.randomUUID().toString())
                        .title(moduleTitles[i])
                        .position(i + 1)
                        .items(items)
                        .build();
                
                modules.add(module);
            }
            
            Instant cmNow = Instant.now().minus(5, ChronoUnit.DAYS);
            CourseModule courseModule = CourseModule.builder()
                    .id(UUID.randomUUID().toString())
                    .courseId(course.getId())
                    .modules(modules)
                    .createdAt(cmNow)
                    .updatedAt(cmNow)
                    .build();
            
            courseModules.add(courseModule);
        }
        
        return courseModules;
    }
    
    private static List<Assignment> generateAssignments(List<Course> courses, List<User> teachers) {
        List<Assignment> assignments = new ArrayList<>();
        String[] assignmentTitles = {
            "Programming Exercise 1",
            "Data Structures Lab",
            "Database Design Project",
            "Web Development Assignment",
            "Machine Learning Quiz",
            "Software Design Document",
            "Network Configuration Lab",
            "OS Concepts Assignment",
            "Security Analysis Report",
            "Mobile App Prototype"
        };
        
        int assignmentIndex = 0;
        for (Course course : courses) {
            User teacher = teachers.get(assignmentIndex / 2);
            
            for (int i = 0; i < 3; i++) {
                Assignment assignment = Assignment.builder()
                        .id(UUID.randomUUID().toString())
                        .courseId(course.getId())
                        .title(assignmentTitles[assignmentIndex] + " - Part " + (i + 1))
                        .description("<p>Complete the following tasks:</p><ul><li>Task 1: Implement the required functionality</li><li>Task 2: Write test cases</li><li>Task 3: Submit documentation</li></ul>")
                        .points(100.0)
                        .dueAt(Instant.now().plus(14 + i * 7, ChronoUnit.DAYS))
                        .availableFrom(Instant.now().minus(7, ChronoUnit.DAYS))
                        .availableUntil(Instant.now().plus(21 + i * 7, ChronoUnit.DAYS))
                        .published(true)
                        .createdBy(teacher.getId())
                        .createdAt(Instant.now().minus(10, ChronoUnit.DAYS))
                        .updatedAt(Instant.now().minus(5, ChronoUnit.DAYS))
                        .build();
                
                assignments.add(assignment);
            }
            assignmentIndex++;
        }
        
        return assignments;
    }
    
    private static List<Enrollment> generateEnrollments(List<Course> courses, List<User> students, List<User> teachers, List<User> tas) {
        List<Enrollment> enrollments = new ArrayList<>();
        
        // Enroll teachers as instructors
        int courseIndex = 0;
        for (User teacher : teachers) {
            for (int i = 0; i < 2; i++) {
                Instant enTs = Instant.now().minus(20, ChronoUnit.DAYS);
                Enrollment enrollment = Enrollment.builder()
                        .id(UUID.randomUUID().toString())
                        .courseId(courses.get(courseIndex).getId())
                        .userId(teacher.getId())
                        .courseRole(Enrollment.CourseRole.INSTRUCTOR)
                        .status(Enrollment.EnrollmentStatus.ACTIVE)
                        .createdAt(enTs)
                        .updatedAt(enTs)
                        .build();
                
                enrollments.add(enrollment);
                courseIndex++;
            }
        }
        
        // Enroll TAs (assign 1 TA per course)
        courseIndex = 0;
        for (User ta : tas) {
            if (courseIndex < courses.size()) {
                Instant enTs = Instant.now().minus(18, ChronoUnit.DAYS);
                Enrollment enrollment = Enrollment.builder()
                        .id(UUID.randomUUID().toString())
                        .courseId(courses.get(courseIndex).getId())
                        .userId(ta.getId())
                        .courseRole(Enrollment.CourseRole.TA)
                        .status(Enrollment.EnrollmentStatus.ACTIVE)
                        .createdAt(enTs)
                        .updatedAt(enTs)
                        .build();
                
                enrollments.add(enrollment);
                courseIndex++;
            }
        }
        
        // Enroll students (each student in 3-4 random courses)
        for (User student : students) {
            int coursesToEnroll = 3 + (int)(Math.random() * 2); // 3 or 4 courses
            List<Integer> enrolledCourseIndices = new ArrayList<>();
            
            for (int i = 0; i < coursesToEnroll; i++) {
                int courseIdx;
                do {
                    courseIdx = (int)(Math.random() * courses.size());
                } while (enrolledCourseIndices.contains(courseIdx));
                
                enrolledCourseIndices.add(courseIdx);
                
                Instant enTs = Instant.now().minus(15, ChronoUnit.DAYS);
                Enrollment enrollment = Enrollment.builder()
                        .id(UUID.randomUUID().toString())
                        .courseId(courses.get(courseIdx).getId())
                        .userId(student.getId())
                        .courseRole(Enrollment.CourseRole.STUDENT)
                        .status(Enrollment.EnrollmentStatus.ACTIVE)
                        .createdAt(enTs)
                        .updatedAt(enTs)
                        .build();
                
                enrollments.add(enrollment);
            }
        }
        
        return enrollments;
    }
    
    private static void printUsers(List<User> students, List<User> teachers, List<User> tas) {
        System.out.println("// users.js - JSON array format");
        System.out.println();
        
        List<User> allUsers = new ArrayList<>();
        allUsers.addAll(students);
        allUsers.addAll(teachers);
        allUsers.addAll(tas);
        
        System.out.println("[");
        for (int i = 0; i < allUsers.size(); i++) {
            User user = allUsers.get(i);
            System.out.println("  {");
            System.out.println("    \"_id\": \"" + user.getId() + "\",");
            System.out.println("    \"name\": \"" + user.getName() + "\",");
            System.out.println("    \"email\": \"" + user.getEmail() + "\",");
            System.out.println("    \"passwordHash\": \"" + user.getPasswordHash() + "\",");
            System.out.println("    \"roles\": [\"" + user.getRoles().get(0).name() + "\"],");
            System.out.println("    \"createdAt\": \"" + user.getCreatedAt() + "\",");
            System.out.println("    \"updatedAt\": \"" + user.getUpdatedAt() + "\"");
            System.out.print("  }");
            if (i < allUsers.size() - 1) System.out.println(",");
            else System.out.println();
        }
        System.out.println("]");
    }
    
    private static void printCourses(List<Course> courses) {
        System.out.println("// =========================================");
        System.out.println("// COURSES COLLECTION");
        System.out.println("// =========================================");
        
        for (Course course : courses) {
            System.out.println("db.courses.insertOne(");
            System.out.println("  {");
            System.out.println("    _id: \"" + course.getId() + "\",");
            System.out.println("    title: \"" + course.getTitle() + "\",");
            System.out.println("    code: \"" + course.getCode() + "\",");
            System.out.println("    term: \"" + course.getTerm() + "\",");
            System.out.println("    section: \"" + course.getSection() + "\",");
            System.out.println("    description: \"" + course.getDescription() + "\",");
            System.out.println("    coverImageUrl: \"" + course.getCoverImageUrl() + "\",");
            System.out.println("    status: \"" + course.getStatus().name() + "\",");
            System.out.println("    createdBy: \"" + course.getCreatedBy() + "\",");
            System.out.println("    instructorIds: [\"" + course.getInstructorIds().get(0) + "\"],");
            System.out.println("    published: " + course.getPublished() + ",");
            System.out.println("    createdAt: ISODate(\"" + course.getCreatedAt() + "\"),");
            System.out.println("    updatedAt: ISODate(\"" + course.getUpdatedAt() + "\")");
            System.out.println("  }");
            System.out.println(");");
            System.out.println();
        }
    }
    
    private static void printCourseModules(List<CourseModule> courseModules) {
        System.out.println("// =========================================");
        System.out.println("// COURSE_MODULES COLLECTION");
        System.out.println("// =========================================");
        
        for (CourseModule courseModule : courseModules) {
            System.out.println("db.course_modules.insertOne(");
            System.out.println("  {");
            System.out.println("    _id: \"" + courseModule.getId() + "\",");
            System.out.println("    courseId: \"" + courseModule.getCourseId() + "\",");
            System.out.println("    modules: [");
            
            for (int i = 0; i < courseModule.getModules().size(); i++) {
                CourseModule.Module module = courseModule.getModules().get(i);
                System.out.println("      {");
                System.out.println("        moduleId: \"" + module.getModuleId() + "\",");
                System.out.println("        title: \"" + module.getTitle() + "\",");
                System.out.println("        position: " + module.getPosition() + ",");
                System.out.println("        items: [");
                
                for (int j = 0; j < module.getItems().size(); j++) {
                    CourseModule.ModuleItem item = module.getItems().get(j);
                    System.out.println("          {");
                    System.out.println("            itemId: \"" + item.getItemId() + "\",");
                    System.out.println("            type: \"" + item.getType().name() + "\",");
                    System.out.println("            title: \"" + item.getTitle() + "\",");
                    if (item.getUrl() != null) {
                        System.out.println("            url: \"" + item.getUrl() + "\",");
                    }
                    if (item.getDueDate() != null) {
                        System.out.println("            dueDate: ISODate(\"" + item.getDueDate() + "\"),");
                    }
                    System.out.println("            published: " + item.getPublished());
                    System.out.print("          }");
                    if (j < module.getItems().size() - 1) System.out.println(",");
                    else System.out.println();
                }
                
                System.out.println("        ]");
                System.out.print("      }");
                if (i < courseModule.getModules().size() - 1) System.out.println(",");
                else System.out.println();
            }
            
            System.out.println("    ],");
            System.out.println("    createdAt: ISODate(\"" + courseModule.getCreatedAt() + "\"),");
            System.out.println("    updatedAt: ISODate(\"" + courseModule.getUpdatedAt() + "\")");
            System.out.println("  }");
            System.out.println(");");
            System.out.println();
        }
    }
    
    private static void printAssignments(List<Assignment> assignments) {
        System.out.println("// =========================================");
        System.out.println("// ASSIGNMENTS COLLECTION");
        System.out.println("// =========================================");
        
        for (Assignment assignment : assignments) {
            System.out.println("db.assignments.insertOne(");
            System.out.println("  {");
            System.out.println("    _id: \"" + assignment.getId() + "\",");
            System.out.println("    courseId: \"" + assignment.getCourseId() + "\",");
            System.out.println("    title: \"" + assignment.getTitle() + "\",");
            System.out.println("    description: \"" + assignment.getDescription().replace("\"", "\\\"") + "\",");
            System.out.println("    points: " + assignment.getPoints() + ",");
            System.out.println("    dueAt: ISODate(\"" + assignment.getDueAt() + "\"),");
            System.out.println("    availableFrom: ISODate(\"" + assignment.getAvailableFrom() + "\"),");
            System.out.println("    availableUntil: ISODate(\"" + assignment.getAvailableUntil() + "\"),");
            System.out.println("    published: " + assignment.getPublished() + ",");
            System.out.println("    createdBy: \"" + assignment.getCreatedBy() + "\",");
            System.out.println("    createdAt: ISODate(\"" + assignment.getCreatedAt() + "\"),");
            System.out.println("    updatedAt: ISODate(\"" + assignment.getUpdatedAt() + "\")");
            System.out.println("  }");
            System.out.println(");");
            System.out.println();
        }
    }
    
    private static void printEnrollments(List<Enrollment> enrollments) {
        System.out.println("// =========================================");
        System.out.println("// ENROLLMENTS COLLECTION");
        System.out.println("// =========================================");
        
        for (Enrollment enrollment : enrollments) {
            System.out.println("db.enrollments.insertOne(");
            System.out.println("  {");
            System.out.println("    _id: \"" + enrollment.getId() + "\",");
            System.out.println("    courseId: \"" + enrollment.getCourseId() + "\",");
            System.out.println("    userId: \"" + enrollment.getUserId() + "\",");
            System.out.println("    courseRole: \"" + enrollment.getCourseRole().name() + "\",");
            System.out.println("    status: \"" + enrollment.getStatus().name() + "\",");
            System.out.println("    createdAt: ISODate(\"" + enrollment.getCreatedAt() + "\"),");
            System.out.println("    updatedAt: ISODate(\"" + enrollment.getUpdatedAt() + "\")");
            System.out.println("  }");
            System.out.println(");");
            System.out.println();
        }
    }
}
