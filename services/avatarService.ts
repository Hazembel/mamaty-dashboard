
import { API_BASE_URL } from '../lib/api';
import { AvatarItem } from '../types';

const AVATARS_URL = `${API_BASE_URL}/admin/avatars`;

// Helper to handle API responses and authentication errors
const handleResponse = async (response: Response) => {
  if (response.status === 401 || response.status === 403) {
    throw new Error("Session expirée. Veuillez vous reconnecter.");
  }
  
  if (!response.ok) {
    let errorData;
    try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
        } else {
            const text = await response.text();
            throw new Error(`Erreur du serveur : ${response.status}. ${text}`);
        }
    } catch (e: any) {
        throw new Error(e.message || `Erreur du serveur : ${response.status}`);
    }
    throw new Error(errorData.message || 'Une erreur est survenue.');
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null;
  }
  
  return response.json();
};

export const getAvatars = async (token: string): Promise<AvatarItem[]> => {
  const response = await fetch(AVATARS_URL, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await handleResponse(response);
  return data.avatars || [];
};

export const saveAvatar = async (token: string, file: File, type: 'parent' | 'baby', gender: 'male' | 'female'): Promise<AvatarItem> => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('type', type);
  formData.append('gender', gender);

  const response = await fetch(AVATARS_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      // Content-Type is set automatically for FormData
    },
    body: formData,
  });

  const data = await handleResponse(response);
  return data.avatar;
};

export const deleteAvatar = async (token: string, id: string): Promise<void> => {
  const url = `${AVATARS_URL}/${id}`;
  console.log(`[DELETE AVATAR] Tentative de suppression à: ${url}`);
  
  const response = await fetch(url, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  
  console.log(`[DELETE AVATAR] Status response: ${response.status}`);
  await handleResponse(response);
};
