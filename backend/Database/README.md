# CourseFlow Database Dummy Data

This folder contains dummy data files in JavaScript format that can be imported into MongoDB.

## Files

- `users.js` - 15 students, 5 teachers, 5 TAs (25 users total)
- `courses.js` - 10 courses (2 per teacher)
- `course_modules.js` - Modules and lessons for courses
- `assignments.js` - 30 assignments (3 per course)
- `enrollments.js` - Student, teacher, and TA enrollments
- `index.js` - Main export file

## Password

**All accounts use the password:** `Course@98420`

The password is stored as a BCrypt hash in the `passwordHash` field.

## How to Import into MongoDB

### Option 1: Using MongoDB Compass

1. Open MongoDB Compass
2. Connect to your database
3. Select the `CourseFlow` database
4. For each collection (users, courses, course_modules, assignments, enrollments):
   - Click "Add Data" → "Insert Document"
   - Copy the array from the corresponding `.js` file (remove `export default`)
   - Paste as JSON array
   - Click "Insert"

### Option 2: Using MongoDB Shell

Convert the files to JSON format and import:

```bash
# Convert JS to JSON (remove 'export default' and ensure valid JSON)
# Then import:
mongoimport --db CourseFlow --collection users --file users.json --jsonArray
mongoimport --db CourseFlow --collection courses --file courses.json --jsonArray
mongoimport --db CourseFlow --collection course_modules --file course_modules.json --jsonArray
mongoimport --db CourseFlow --collection assignments --file assignments.json --jsonArray
mongoimport --db CourseFlow --collection enrollments --file enrollments.json --jsonArray
```

### Option 3: Using MongoDB Compass Shell

1. Open MongoDB Compass
2. Go to the Shell tab
3. For each file, copy the array content (without `export default`)
4. Use `db.collection.insertMany()`:

```javascript
// Example for users
db.users.insertMany([
  // ... paste array content here
]);
```

## Data Summary

- **Users:** 25 total (15 students, 5 teachers, 5 TAs)
- **Courses:** 10 courses
- **Course Modules:** 10 module documents (one per course, each with 5 modules)
- **Assignments:** 30 assignments (3 per course)
- **Enrollments:** 65 enrollments total
  - 10 teacher enrollments (as instructors)
  - 5 TA enrollments
  - 50 student enrollments (3-4 courses per student)

## Notes

- All IDs are simple strings (e.g., "student-001", "course-001") for easy reference
- All dates are in ISO 8601 format
- All courses are PUBLISHED
- All assignments are published
- Students are enrolled in 3-4 random courses each
