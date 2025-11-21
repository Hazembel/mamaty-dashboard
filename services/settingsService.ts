
import { API_BASE_URL } from '../lib/api';

export const changePassword = async (token: string, oldPassword: string, newPassword: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/admin/change-password`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ oldPassword, newPassword }),
  });

  if (!response.ok) {
    let errorMessage = 'Erreur lors du changement de mot de passe';
    try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
    } catch (e) {
        // ignore json parse error
    }
    throw new Error(errorMessage);
  }
};
