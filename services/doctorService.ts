
import { API_BASE_URL } from '../lib/api';
import { Doctor } from '../types';

const DOCTORS_URL = `${API_BASE_URL}/admin/doctors`;

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

export const getDoctors = async (token: string): Promise<Doctor[]> => {
  const response = await fetch(DOCTORS_URL, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await handleResponse(response);
  return data.doctors;
};

export const createDoctor = async (token: string, doctorData: Partial<Doctor>): Promise<Doctor> => {
  const response = await fetch(DOCTORS_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(doctorData),
  });
  return handleResponse(response);
};

export const updateDoctor = async (token: string, doctorId: string, doctorData: Partial<Doctor>): Promise<Doctor> => {
  const response = await fetch(`${DOCTORS_URL}/${doctorId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(doctorData),
  });
  return handleResponse(response);
};

export const deleteDoctor = async (token: string, doctorId: string): Promise<void> => {
  const response = await fetch(`${DOCTORS_URL}/${doctorId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  await handleResponse(response);
};
