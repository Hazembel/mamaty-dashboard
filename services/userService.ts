
import { API_BASE_URL } from '../lib/api';
import { User, Baby } from '../types';

const USERS_URL = `${API_BASE_URL}/admin/users`;

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
    
    let message = errorData.message || 'Une erreur est survenue.';

    // Translate MongoDB Duplicate Key Errors
    if (typeof message === 'string' && message.includes('E11000 duplicate key error')) {
        if (message.includes('phone')) {
            message = "Ce numéro de téléphone est déjà utilisé par un autre utilisateur.";
        } else if (message.includes('email')) {
            message = "Cette adresse email est déjà utilisée par un autre utilisateur.";
        } else {
            message = "Une entrée avec ces informations existe déjà (doublon).";
        }
    }

    throw new Error(message);
  }

  // Handle successful responses with no content (e.g., DELETE)
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null;
  }
  
  return response.json();
};

export const getUsers = async (token: string): Promise<User[]> => {
  const response = await fetch(USERS_URL, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });

  const data = await handleResponse(response);

  // Normalize gender casing (e.g., "male" -> "Male") to match frontend types
  const normalizedUsers = data.users.map((user: User) => {
    // User gender is passed through as-is (lowercase)

    // Normalize Babies Gender if they exist
    let normalizedBabies: Baby[] | undefined = undefined;
    if (user.babies && Array.isArray(user.babies)) {
        normalizedBabies = user.babies.map((baby: any) => {
            let babyGender: 'Male' | 'Female' | undefined = undefined;
            if (typeof baby.gender === 'string') {
                const lower = baby.gender.toLowerCase();
                if (lower === 'male') babyGender = 'Male';
                else if (lower === 'female') babyGender = 'Female';
            }
            return { ...baby, gender: babyGender };
        });
    }

    return { ...user, babies: normalizedBabies || user.babies };
  });

  return normalizedUsers;
};

export const createUser = async (token: string, userData: Partial<User>): Promise<User> => {
  const response = await fetch(USERS_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  const data = await handleResponse(response);
  return data.user || data;
};

export const updateUser = async (token: string, userId: string, userData: Partial<User>): Promise<User> => {
  const response = await fetch(`${USERS_URL}/${userId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  const data = await handleResponse(response);
  return data.user || data;
};

export const deleteUser = async (token: string, userId: string): Promise<void> => {
  const response = await fetch(`${USERS_URL}/${userId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  await handleResponse(response);
};
