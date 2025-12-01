/**
 * Role guard utilities for checking user permissions
 */

import { UserInfo } from '@/lib/auth-api';

export type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'TA' | 'ADMIN';

/**
 * Check if user has at least one of the required roles
 */
export const hasRole = (user: UserInfo | null, ...requiredRoles: UserRole[]): boolean => {
  if (!user || !user.roles || user.roles.length === 0) {
    return false;
  }
  
  return requiredRoles.some(role => user.roles.includes(role));
};

/**
 * Check if user has instructor or TA role (for course content management)
 */
export const canManageContent = (user: UserInfo | null): boolean => {
  return hasRole(user, 'INSTRUCTOR', 'TA', 'ADMIN');
};

/**
 * Check if user is an admin
 */
export const isAdmin = (user: UserInfo | null): boolean => {
  return hasRole(user, 'ADMIN');
};

/**
 * Check if user is an instructor
 */
export const isInstructor = (user: UserInfo | null): boolean => {
  return hasRole(user, 'INSTRUCTOR', 'ADMIN');
};

/**
 * Check if user is a TA
 */
export const isTA = (user: UserInfo | null): boolean => {
  return hasRole(user, 'TA', 'ADMIN');
};

/**
 * Check if user is a student (only student role, no other roles)
 */
export const isStudentOnly = (user: UserInfo | null): boolean => {
  if (!user || !user.roles || user.roles.length === 0) {
    return false;
  }
  
  return user.roles.length === 1 && user.roles[0] === 'STUDENT';
};
