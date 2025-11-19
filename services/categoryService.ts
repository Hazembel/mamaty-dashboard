
import { API_BASE_URL } from '../lib/api';
import { Category } from '../types';

const CATEGORIES_URL = `${API_BASE_URL}/admin/categories`;

// Helper to handle API responses and authentication errors
const handleResponse = async (response: Response) => {
  if (response.status === 401 || response.status === 403) {
    throw new Error("Session expirée. Veuillez vous reconnecter.");
  }
  
  if (!response.ok) {
    let errorData;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      errorData = await response.json();
    } else {
      throw new Error(`Erreur du serveur : ${response.status}. Réponse inattendue.`);
    }
    throw new Error(errorData.message || 'Une erreur est survenue.');
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null;
  }
  
  return response.json();
};

export const getCategories = async (token: string): Promise<Category[]> => {
  const response = await fetch(CATEGORIES_URL, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await handleResponse(response);
  // Assuming backend returns { categories: [...] } or just the array. 
  // Adjusting based on previous service patterns in this project (usually wrapping object)
  return data.categories || data; 
};

export const createCategory = async (token: string, categoryData: Partial<Category>): Promise<Category> => {
  const response = await fetch(CATEGORIES_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(categoryData),
  });
  const data = await handleResponse(response);
  return data.category || data;
};

export const updateCategory = async (token: string, categoryId: string, categoryData: Partial<Category>): Promise<Category> => {
  const response = await fetch(`${CATEGORIES_URL}/${categoryId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(categoryData),
  });
  const data = await handleResponse(response);
  return data.category || data;
};

export const deleteCategory = async (token: string, categoryId: string): Promise<void> => {
  const response = await fetch(`${CATEGORIES_URL}/${categoryId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  await handleResponse(response);
};
