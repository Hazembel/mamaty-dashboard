
import { API_BASE_URL } from '../lib/api';
import { Recipe } from '../types';

const RECIPES_URL = `${API_BASE_URL}/admin/recipes`;

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

export const getRecipes = async (token: string): Promise<Recipe[]> => {
  const response = await fetch(RECIPES_URL, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await handleResponse(response);
  return data.recipes || []; 
};

export const createRecipe = async (token: string, recipeData: Partial<Recipe>): Promise<Recipe> => {
  const response = await fetch(RECIPES_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(recipeData),
  });
  return handleResponse(response);
};

export const updateRecipe = async (token: string, recipeId: string, recipeData: Partial<Recipe>): Promise<Recipe> => {
  const response = await fetch(`${RECIPES_URL}/${recipeId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(recipeData),
  });
  const data = await handleResponse(response);
  return data.recipe || data;
};

export const deleteRecipe = async (token: string, recipeId: string): Promise<void> => {
  const response = await fetch(`${RECIPES_URL}/${recipeId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  await handleResponse(response);
};
