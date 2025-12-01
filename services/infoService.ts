
import { API_BASE_URL } from '../lib/api';
import { FAQ, ContactInfo } from '../types';

const ADMIN_URL = `${API_BASE_URL}/admin`;

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
      const text = await response.text();
      throw new Error(`Erreur du serveur : ${response.status}. ${text}`);
    }
    throw new Error(errorData.message || 'Une erreur est survenue.');
  }

  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null;
  }
  
  return response.json();
};

// --- FAQs ---

export const getFaqs = async (token: string): Promise<FAQ[]> => {
  const response = await fetch(`${ADMIN_URL}/faqs`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const data = await handleResponse(response);
  return Array.isArray(data) ? data : (data.faqs || []);
};

export const createFaq = async (token: string, faqData: Partial<FAQ>): Promise<FAQ> => {
  const response = await fetch(`${ADMIN_URL}/faqs`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(faqData),
  });
  return handleResponse(response);
};

export const updateFaq = async (token: string, id: string, faqData: Partial<FAQ>): Promise<FAQ> => {
  const response = await fetch(`${ADMIN_URL}/faqs/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(faqData),
  });
  return handleResponse(response);
};

export const deleteFaq = async (token: string, id: string): Promise<void> => {
  const response = await fetch(`${ADMIN_URL}/faqs/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  await handleResponse(response);
};

// --- Contact Info ---

export const getContactInfos = async (token: string): Promise<ContactInfo[]> => {
  const url = `${ADMIN_URL}/contact-info`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`
        // Removed Content-Type: application/json for GET request to avoid 500 errors on some backends
      },
    });

    if (!response.ok) {
        let errorMessage = `Erreur ${response.status}`;
        try {
            const errorJson = await response.json();
            errorMessage = errorJson.message || errorMessage;
        } catch (e) {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
    }

    const data = await response.json();

    // Handle various response formats
    if (Array.isArray(data)) return data;
    if (data.infos && Array.isArray(data.infos)) return data.infos;
    if (data._id || data.email) return [data]; // Wrap single object
    
    return [];
  } catch (error) {
    console.error('Error in getContactInfos:', error);
    throw error;
  }
};

export const createContactInfo = async (token: string, infoData: Partial<ContactInfo>): Promise<ContactInfo> => {
  const response = await fetch(`${ADMIN_URL}/contact-info`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(infoData),
  });
  return handleResponse(response);
};

export const updateContactInfo = async (token: string, id: string, infoData: Partial<ContactInfo>): Promise<ContactInfo> => {
  const response = await fetch(`${ADMIN_URL}/contact-info/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(infoData),
  });
  return handleResponse(response);
};

export const deleteContactInfo = async (token: string, id: string): Promise<void> => {
  const response = await fetch(`${ADMIN_URL}/contact-info/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  await handleResponse(response);
};
