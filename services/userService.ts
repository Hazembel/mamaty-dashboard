
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
      throw new Error(`Erreur du serveur : ${response.status}. Réponse inattendue.`);
    }
    throw new Error(errorData.message || 'Une erreur est survenue.');
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
    // Normalize User Gender
    let normalizedGender: 'Male' | 'Female' | 'Other' | undefined = undefined;
    if (typeof user.gender === 'string') {
      const lowerGender = user.gender.toLowerCase();
      if (lowerGender === 'male') normalizedGender = 'Male';
      else if (lowerGender === 'female') normalizedGender = 'Female';
      else if (lowerGender === 'other') normalizedGender = 'Other';
    }

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

    return { ...user, gender: normalizedGender, babies: normalizedBabies || user.babies };
  });


  // 🔹 Log the full response from the backend
  console.log("[GET USERS] Full response:", data);

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
  return data.user;
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
  return data.user; // Backend returns { ..., user: {...} }
};

export const deleteUser = async (token: string, userId: string): Promise<void> => {
  const response = await fetch(`${USERS_URL}/${userId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  await handleResponse(response);
};
