
import { API_BASE_URL } from '../lib/api';
import { Baby } from '../types';

const BABIES_URL = `${API_BASE_URL}/admin/babies`;

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
      const errorText = await response.text();
      throw new Error(`Erreur du serveur : ${response.status}. ${errorText}`);
    }
    throw new Error(errorData.message || 'Une erreur est survenue.');
  }

  // Handle successful responses with no content (e.g., DELETE)
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null;
  }
  
  return response.json();
};

export const getBabies = async (token: string): Promise<Baby[]> => {
  const response = await fetch(BABIES_URL, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });

  const data = await handleResponse(response);

  const normalizedBabies = data.babies.map((baby: Baby) => {
    let normalizedGender: 'Male' | 'Female' | undefined = undefined;
    if (typeof baby.gender === 'string') {
      const lowerGender = baby.gender.toLowerCase();
      if (lowerGender === 'male') normalizedGender = 'Male';
      else if (lowerGender === 'female') normalizedGender = 'Female';
    }
    return { ...baby, gender: normalizedGender };
  });

  return normalizedBabies;
};

export const updateBaby = async (token: string, babyId: string, babyData: Partial<Baby>): Promise<Baby> => {
  const response = await fetch(`${BABIES_URL}/${babyId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(babyData),
  });
  const data = await handleResponse(response);
  return data.baby; 
};

export const deleteBaby = async (token: string, babyId: string): Promise<void> => {
  const response = await fetch(`${BABIES_URL}/${babyId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  await handleResponse(response);
};
