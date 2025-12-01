/**
 * Modules API functions (Canvas-like structure)
 */

import { apiFetch, ApiResponse } from './api';

export type ModuleItemType = 'PAGE' | 'ASSIGNMENT' | 'QUIZ' | 'FILE' | 'URL';

export interface ModuleItem {
  id: string;
  moduleId: string;
  courseId: string;
  type: ModuleItemType;
  title: string;
  contentRefId?: string;
  url?: string;
  position: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  position: number;
  published: boolean;
  unlockAt?: string;
  createdAt: string;
  updatedAt: string;
  items: ModuleItem[];
}

export interface ModulesResponse {
  modules: Module[];
}

export interface CreateModuleRequest {
  title: string;
  position?: number;
  published?: boolean;
  unlockAt?: string;
}

export interface UpdateModuleRequest {
  title?: string;
  position?: number;
  published?: boolean;
  unlockAt?: string;
}

export interface CreateModuleItemRequest {
  title: string;
  type: ModuleItemType;
  contentRefId?: string;
  url?: string;
  position?: number;
  published?: boolean;
}

export interface UpdateModuleItemRequest {
  title?: string;
  position?: number;
  published?: boolean;
  contentRefId?: string;
  url?: string;
}

export interface ReorderRequest {
  moduleOrder: string[];
  itemOrders: Record<string, string[]>;
}

/**
 * Get modules for a course
 */
export const getModules = async (courseId: string): Promise<ModulesResponse> => {
  const response = await apiFetch<ModulesResponse>(`/courses/${courseId}/modules`);
  
  if (!response.data) {
    throw new Error('Failed to get modules');
  }

  return response.data;
};

/**
 * Create a new module
 */
export const createModule = async (
  courseId: string,
  data: CreateModuleRequest
): Promise<Module> => {
  const response = await apiFetch<Module>(`/courses/${courseId}/modules`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.data) {
    throw new Error('Failed to create module');
  }

  return response.data;
};

/**
 * Update a module
 */
export const updateModule = async (
  moduleId: string,
  data: UpdateModuleRequest
): Promise<Module> => {
  const response = await apiFetch<Module>(`/courses/modules/${moduleId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  if (!response.data) {
    throw new Error('Failed to update module');
  }

  return response.data;
};

/**
 * Delete a module
 */
export const deleteModule = async (moduleId: string): Promise<void> => {
  const response = await apiFetch(`/courses/modules/${moduleId}`, {
    method: 'DELETE',
  });

  if (!response.success) {
    throw new Error(response.message || 'Failed to delete module');
  }
};

/**
 * Create a new module item
 */
export const createModuleItem = async (
  moduleId: string,
  data: CreateModuleItemRequest
): Promise<ModuleItem> => {
  const response = await apiFetch<ModuleItem>(`/courses/modules/${moduleId}/items`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.data) {
    throw new Error('Failed to create module item');
  }

  return response.data;
};

/**
 * Update a module item
 */
export const updateModuleItem = async (
  itemId: string,
  data: UpdateModuleItemRequest
): Promise<ModuleItem> => {
  const response = await apiFetch<ModuleItem>(`/courses/module-items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  if (!response.data) {
    throw new Error('Failed to update module item');
  }

  return response.data;
};

/**
 * Delete a module item
 */
export const deleteModuleItem = async (itemId: string): Promise<void> => {
  const response = await apiFetch(`/courses/module-items/${itemId}`, {
    method: 'DELETE',
  });

  if (!response.success) {
    throw new Error(response.message || 'Failed to delete module item');
  }
};

/**
 * Reorder modules and items
 */
export const reorderModules = async (
  courseId: string,
  data: ReorderRequest
): Promise<ModulesResponse> => {
  const response = await apiFetch<ModulesResponse>(`/courses/${courseId}/modules/reorder`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.data) {
    throw new Error('Failed to reorder modules');
  }

  return response.data;
};


