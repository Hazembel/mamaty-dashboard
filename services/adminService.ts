import { API_BASE_URL } from '../lib/api';

const ADMIN_URL = `${API_BASE_URL}/admin`;

export const loginAdmin = async (email: string, password: string): Promise<string> => {
  const loginUrl = `${ADMIN_URL}/login`;
  console.log(`[LOGIN ATTEMPT] Tentative de connexion à: ${loginUrl}`);

  try {
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    console.log('[LOGIN RESPONSE] Réponse brute du serveur:', response);
    console.log(`[LOGIN RESPONSE] Statut: ${response.status} ${response.statusText}`);
    console.log('[LOGIN RESPONSE] Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[LOGIN ERROR] Corps de la réponse brute (erreur):', errorBody);

      let errorData;
      try {
        errorData = JSON.parse(errorBody);
      } catch (e) {
        // This handles cases where the server returns HTML (like a 404 page) instead of JSON
        throw new Error(`Erreur du serveur : ${response.status}. La réponse n'est pas du JSON valide.`);
      }
      throw new Error(errorData.message || 'Échec de la connexion');
    }

    const data = await response.json();
    console.log('[LOGIN SUCCESS] Données de la réponse analysées:', data);

    if (!data.token) {
      console.error('[LOGIN ERROR] Token non trouvé dans la réponse JSON.');
      throw new Error('Token non trouvé dans la réponse');
    }

    console.log('[LOGIN SUCCESS] Connexion réussie, token reçu.');
    return data.token;

  } catch (error) {
    console.error('[LOGIN CRITICAL] Erreur critique lors de la tentative de connexion:', error);
    // Re-throw the error so the UI can catch it and display a message
    throw error;
  }
};