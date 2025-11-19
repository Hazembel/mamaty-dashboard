
import { API_BASE_URL } from '../lib/api';
import { Article } from '../types';

const ARTICLES_URL = `${API_BASE_URL}/admin/articles`;

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

export const getArticles = async (token: string): Promise<Article[]> => {
  const response = await fetch(ARTICLES_URL, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await handleResponse(response);
  return data.articles || []; 
};

export const createArticle = async (token: string, articleData: Partial<Article>): Promise<Article> => {
  const response = await fetch(ARTICLES_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(articleData),
  });
  return handleResponse(response);
};

export const updateArticle = async (token: string, articleId: string, articleData: Partial<Article>): Promise<Article> => {
  const response = await fetch(`${ARTICLES_URL}/${articleId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(articleData),
  });
  return handleResponse(response);
};

export const deleteArticle = async (token: string, articleId: string): Promise<void> => {
  const response = await fetch(`${ARTICLES_URL}/${articleId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  await handleResponse(response);
};
