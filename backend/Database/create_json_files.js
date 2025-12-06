// Create proper JSON files from the data structure
// This script creates valid JSON arrays that can be imported into MongoDB

const fs = require('fs');

// Users data
const users = [
  // Students (15)
  { _id: "student-001", name: "Alice Smith", email: "alice.smith@student.edu", passwordHash: "$2a$10$DCH4IOrtZCG7TegvPmR.fuT.WGa74GAOBMxVc.UEjR8fnyhYB/LIS", roles: ["STUDENT"], createdAt: "2024-01-01T00:00:00.000Z", updatedAt: "2024-01-01T00:00:00.000Z" },
  { _id: "student-002", name: "Bob Johnson", email: "bob.johnson@student.edu", passwordHash: "$2a$10$DCH4IOrtZCG7TegvPmR.fuT.WGa74GAOBMxVc.UEjR8fnyhYB/LIS", roles: ["STUDENT"], createdAt: "2024-01-01T00:00:00.000Z", updatedAt: "2024-01-01T00:00:00.000Z" },
  { _id: "student-003", name: "Charlie Williams", email: "charlie.williams@student.edu", passwordHash: "$2a$10$DCH4IOrtZCG7TegvPmR.fuT.WGa74GAOBMxVc.UEjR8fnyhYB/LIS", roles: ["STUDENT"], createdAt: "2024-01-01T00:00:00.000Z", updatedAt: "2024-01-01T00:00:00.000Z" },
  { _id: "student-004", name: "Diana Brown", email: "diana.brown@student.edu", passwordHash: "$2a$10$DCH4IOrtZCG7TegvPmR.fuT.WGa74GAOBMxVc.UEjR8fnyhYB/LIS", roles: ["STUDENT"], createdAt: "2024-01-01T00:00:00.000Z", updatedAt: "2024-01-01T00:00:00.000Z" },
  { _id: "student-005", name: "Eve Jones", email: "eve.jones@student.edu", passwordHash: "$2a$10$DCH4IOrtZCG7TegvPmR.fuT.WGa74GAOBMxVc.UEjR8fnyhYB/LIS", roles: ["STUDENT"], createdAt: "2024-01-01T00:00:00.000Z", updatedAt: "2024-01-01T00:00:00.000Z" },
  { _id: "student-006", name: "Frank Garcia", email: "frank.garcia@student.edu", passwordHash: "$2a$10$DCH4IOrtZCG7TegvPmR.fuT.WGa74GAOBMxVc.UEjR8fnyhYB/LIS", roles: ["STUDENT"], createdAt: "2024-01-01T00:00:00.000Z", updatedAt: "2024-01-01T00:00:00.000Z" },
  { _id: "student-007", name: "Grace Miller", email: "grace.miller@student.edu", passwordHash: "$2a$10$DCH4IOrtZCG7TegvPmR.fuT.WGa74GAOBMxVc.UEjR8fnyhYB/LIS", roles: ["STUDENT"], createdAt: "2024-01-01T00:00:00.000Z", updatedAt: "2024-01-01T00:00:00.000Z" },
  { _id: "student-008", name: "Henry Davis", email: "henry.davis@student.edu", passwordHash: "$2a$10$DCH4IOrtZCG7TegvPmR.fuT.WGa74GAOBMxVc.UEjR8fnyhYB/LIS", roles: ["STUDENT"], createdAt: "2024-01-01T00:00:00.000Z", updatedAt: "2024-01-01T00:00:00.000Z" },
  { _id: "student-009", name: "Ivy Rodriguez", email: "ivy.rodriguez@student.edu", passwordHash: "$2a$10$DCH4IOrtZCG7TegvPmR.fuT.WGa74GAOBMxVc.UEjR8fnyhYB/LIS", roles: ["STUDENT"], createdAt: "2024-01-01T00:00:00.000Z", updatedAt: "2024-01-01T00:00:00.000Z" },
  { _id: "student-010", name: "Jack Martinez", email: "jack.martinez@student.edu", passwordHash: "$2a$10$DCH4IOrtZCG7TegvPmR.fuT.WGa74GAOBMxVc.UEjR8fnyhYB/LIS", roles: ["STUDENT"], createdAt: "2024-01-01T00:00:00.000Z", updatedAt: "2024-01-01T00:00:00.000Z" },
  { _id: "student-011", name: "Kate Hernandez", email: "kate.hernandez@student.edu", passwordHash: "$2a$10$DCH4IOrtZCG7TegvPmR.fuT.WGa74GAOBMxVc.UEjR8fnyhYB/LIS", roles: ["STUDENT"], createdAt: "2024-01-01T00:00:00.000Z", updatedAt: "2024-01-01T00:00:00.000Z" },
  { _id: "student-012", name: "Liam Lopez", email: "liam.lopez@student.edu", passwordHash: "$2a$10$DCH4IOrtZCG7TegvPmR.fuT.WGa74GAOBMxVc.UEjR8fnyhYB/LIS", roles: ["STUDENT"], createdAt: "2024-01-01T00:00:00.000Z", updatedAt: "2024-01-01T00:00:00.000Z" },
  { _id: "student-013", name: "Mia Wilson", email: "mia.wilson@student.edu", passwordHash: "$2a$10$DCH4IOrtZCG7TegvPmR.fuT.WGa74GAOBMxVc.UEjR8fnyhYB/LIS", roles: ["STUDENT"], createdAt: "2024-01-01T00:00:00.000Z", updatedAt: "2024-01-01T00:00:00.000Z" },
  { _id: "student-014", name: "Noah Anderson", email: "noah.anderson@student.edu", passwordHash: "$2a$10$DCH4IOrtZCG7TegvPmR.fuT.WGa74GAOBMxVc.UEjR8fnyhYB/LIS", roles: ["STUDENT"], createdAt: "2024-01-01T00:00:00.000Z", updatedAt: "2024-01-01T00:00:00.000Z" },
  { _id: "student-015", name: "Olivia Thomas", email: "olivia.thomas@student.edu", passwordHash: "$2a$10$DCH4IOrtZCG7TegvPmR.fuT.WGa74GAOBMxVc.UEjR8fnyhYB/LIS", roles: ["STUDENT"], createdAt: "2024-01-01T00:00:00.000Z", updatedAt: "2024-01-01T00:00:00.000Z" },
  // Teachers (5)
  { _id: "teacher-001", name: "Dr. Sarah Anderson", email: "dr.sarah.anderson@university.edu", passwordHash: "$2a$10$DCH4IOrtZCG7TegvPmR.fuT.WGa74GAOBMxVc.UEjR8fnyhYB/LIS", roles: ["INSTRUCTOR"], createdAt: "2023-12-01T00:00:00.000Z", updatedAt: "2023-12-01T00:00:00.000Z" },
  { _id: "teacher-002", name: "Prof. Michael Brown", email: "prof.michael.brown@university.edu", passwordHash: "$2a$10$DCH4IOrtZCG7TegvPmR.fuT.WGa74GAOBMxVc.UEjR8fnyhYB/LIS", roles: ["INSTRUCTOR"], createdAt: "2023-12-01T00:00:00.000Z", updatedAt: "2023-12-01T00:00:00.000Z" },
  { _id: "teacher-003", name: "Dr. Emily Chen", email: "dr.emily.chen@university.edu", passwordHash: "$2a$10$DCH4IOrtZCG7TegvPmR.fuT.WGa74GAOBMxVc.UEjR8fnyhYB/LIS", roles: ["INSTRUCTOR"], createdAt: "2023-12-01T00:00:00.000Z", updatedAt: "2023-12-01T00:00:00.000Z" },
  { _id: "teacher-004", name: "Prof. David Davis", email: "prof.david.davis@university.edu", passwordHash: "$2a$10$DCH4IOrtZCG7TegvPmR.fuT.WGa74GAOBMxVc.UEjR8fnyhYB/LIS", roles: ["INSTRUCTOR"], createdAt: "2023-12-01T00:00:00.000Z", updatedAt: "2023-12-01T00:00:00.000Z" },
  { _id: "teacher-005", name: "Dr. Jennifer Evans", email: "dr.jennifer.evans@university.edu", passwordHash: "$2a$10$DCH4IOrtZCG7TegvPmR.fuT.WGa74GAOBMxVc.UEjR8fnyhYB/LIS", roles: ["INSTRUCTOR"], createdAt: "2023-12-01T00:00:00.000Z", updatedAt: "2023-12-01T00:00:00.000Z" },
  // TAs (5)
  { _id: "ta-001", name: "Alex Taylor", email: "alex.taylor@ta.edu", passwordHash: "$2a$10$DCH4IOrtZCG7TegvPmR.fuT.WGa74GAOBMxVc.UEjR8fnyhYB/LIS", roles: ["TA"], createdAt: "2023-12-15T00:00:00.000Z", updatedAt: "2023-12-15T00:00:00.000Z" },
  { _id: "ta-002", name: "Blake Moore", email: "blake.moore@ta.edu", passwordHash: "$2a$10$DCH4IOrtZCG7TegvPmR.fuT.WGa74GAOBMxVc.UEjR8fnyhYB/LIS", roles: ["TA"], createdAt: "2023-12-15T00:00:00.000Z", updatedAt: "2023-12-15T00:00:00.000Z" },
  { _id: "ta-003", name: "Casey White", email: "casey.white@ta.edu", passwordHash: "$2a$10$DCH4IOrtZCG7TegvPmR.fuT.WGa74GAOBMxVc.UEjR8fnyhYB/LIS", roles: ["TA"], createdAt: "2023-12-15T00:00:00.000Z", updatedAt: "2023-12-15T00:00:00.000Z" },
  { _id: "ta-004", name: "Drew Harris", email: "drew.harris@ta.edu", passwordHash: "$2a$10$DCH4IOrtZCG7TegvPmR.fuT.WGa74GAOBMxVc.UEjR8fnyhYB/LIS", roles: ["TA"], createdAt: "2023-12-15T00:00:00.000Z", updatedAt: "2023-12-15T00:00:00.000Z" },
  { _id: "ta-005", name: "Jordan Clark", email: "jordan.clark@ta.edu", passwordHash: "$2a$10$DCH4IOrtZCG7TegvPmR.fuT.WGa74GAOBMxVc.UEjR8fnyhYB/LIS", roles: ["TA"], createdAt: "2023-12-15T00:00:00.000Z", updatedAt: "2023-12-15T00:00:00.000Z" }
];

// Write users.js as JSON
fs.writeFileSync('users.js', JSON.stringify(users, null, 2));
console.log('Created users.js with valid JSON');
