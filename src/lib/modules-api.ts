/**
 * Modules API functions
 */

import { apiFetch, ApiResponse } from './api';

export type ModuleItemType = 'VIDEO' | 'DOC' | 'LINK' | 'ASSIGNMENT' | 'QUIZ';

export interface ModuleItem {
  itemId: string;
  type: ModuleItemType;
  title: string;
  url?: string;
  dueDate?: string;
  published: boolean;
}

export interface Module {
  moduleId: string;
  title: string;
  position: number;
  items: ModuleItem[];
}

export interface ModuleResponse {
  courseId: string;
  modules: Module[];
  updatedAt: string;
}

export interface UpdateModulesRequest {
  modules: {
    moduleId: string;
    title: string;
    position: number;
    items: {
      itemId: string;
      type: ModuleItemType;
      title: string;
      url?: string;
      dueDate?: string;
      published: boolean;
    }[];
  }[];
}

export interface AddModuleRequest {
  title: string;
  position: number;
}

export interface AddModuleItemRequest {
  title: string;
  type: ModuleItemType;
  url?: string;
  dueDate?: string;
  published?: boolean;
}

/**
 * Get modules for a course
 */
export const getModules = async (courseId: string): Promise<ModuleResponse> => {
  const response = await apiFetch<ModuleResponse>(`/courses/${courseId}/modules`);
  
  if (!response.data) {
    throw new Error('Failed to get modules');
  }

  return response.data;
};

/**
 * Update all modules for a course (replace entire tree)
 */
export const updateModules = async (
  courseId: string,
  data: UpdateModulesRequest
): Promise<ModuleResponse> => {
  const response = await apiFetch<ModuleResponse>(`/courses/${courseId}/modules`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  if (!response.data) {
    throw new Error('Failed to update modules');
  }

  return response.data;
};

/**
 * Add a new module to a course
 */
export const addModule = async (
  courseId: string,
  data: AddModuleRequest
): Promise<ModuleResponse> => {
  const response = await apiFetch<ModuleResponse>(`/courses/${courseId}/modules`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.data) {
    throw new Error('Failed to add module');
  }

  return response.data;
};

/**
 * Add a new item to a module
 */
export const addModuleItem = async (
  courseId: string,
  moduleId: string,
  data: AddModuleItemRequest
): Promise<ModuleResponse> => {
  const response = await apiFetch<ModuleResponse>(
    `/courses/${courseId}/modules/${moduleId}/items`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );

  if (!response.data) {
    throw new Error('Failed to add module item');
  }

  return response.data;
};


