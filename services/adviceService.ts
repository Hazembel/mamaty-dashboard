
import { API_BASE_URL } from '../lib/api';
import { Advice } from '../types';

const ADVICES_URL = `${API_BASE_URL}/admin/advices`;

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

export const getAdvices = async (token: string): Promise<Advice[]> => {
  const response = await fetch(ADVICES_URL, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await handleResponse(response);
  // Assuming backend returns { advices: [...], count: ... }
  return data.advices || []; 
};

export const createAdvice = async (token: string, adviceData: Partial<Advice>): Promise<Advice> => {
  const response = await fetch(ADVICES_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(adviceData),
  });
  return handleResponse(response);
};

export const updateAdvice = async (token: string, adviceId: string, adviceData: Partial<Advice>): Promise<Advice> => {
  const response = await fetch(`${ADVICES_URL}/${adviceId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(adviceData),
  });
  return handleResponse(response);
};

export const deleteAdvice = async (token: string, adviceId: string): Promise<void> => {
  const response = await fetch(`${ADVICES_URL}/${adviceId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  await handleResponse(response);
};

export const activateAdvice = async (token: string, adviceId: string): Promise<Advice> => {
  const response = await fetch(`${ADVICES_URL}/${adviceId}/activate`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await handleResponse(response);
  return data.advice || data;
};

export const deactivateAdvice = async (token: string, adviceId: string): Promise<Advice> => {
  const response = await fetch(`${ADVICES_URL}/${adviceId}/deactivate`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await handleResponse(response);
  return data.advice || data;
};
