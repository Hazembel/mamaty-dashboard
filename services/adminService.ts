
import { API_BASE_URL } from '../lib/api';
import { User } from '../types';

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

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[LOGIN ERROR] Corps de la réponse brute (erreur):', errorBody);

      let errorData;
      try {
        errorData = JSON.parse(errorBody);
      } catch (e) {
        throw new Error(`Erreur du serveur : ${response.status}. La réponse n'est pas du JSON valide.`);
      }
      
      let message = errorData.message || 'Échec de la connexion';
      const lowerMsg = message.toLowerCase();
      
      // Translate common login errors from English to French
      if (lowerMsg.includes('invalid password') || lowerMsg.includes('wrong password') || lowerMsg.includes('password is incorrect')) {
          message = 'Mot de passe incorrect.';
      } else if (lowerMsg.includes('user not found') || lowerMsg.includes('admin not found') || lowerMsg.includes('no user found') || lowerMsg.includes('account not found') || lowerMsg.includes("user doesn't exist")) {
          message = 'Compte administrateur introuvable.';
      } else if (lowerMsg.includes('invalid email')) {
          message = 'Adresse email invalide.';
      } else if (lowerMsg.includes('invalid credentials') || lowerMsg.includes('bad credentials')) {
          message = 'Identifiants incorrects.';
      } else if (lowerMsg.includes('unauthorized') || lowerMsg.includes('access denied') || lowerMsg.includes('forbidden')) {
          message = 'Accès refusé.';
      } else if (lowerMsg.includes('server error') || lowerMsg.includes('internal server error')) {
          message = 'Erreur interne du serveur.';
      } else if (lowerMsg.includes('please fill out') || lowerMsg.includes('required')) {
          message = 'Veuillez remplir tous les champs obligatoires.';
      }

      throw new Error(message);
    }

    const data = await response.json();
    console.log('[LOGIN SUCCESS] Données de la réponse analysées:', data);

    if (!data.token) {
      console.error('[LOGIN ERROR] Token non trouvé dans la réponse JSON.');
      throw new Error('Token non trouvé dans la réponse');
    }

    // Cache user if provided in login response (check for .user, .admin, .data, or flat object)
    const userObj = data.user || data.admin || data.data;
    if (userObj) {
        console.log('[LOGIN SUCCESS] Utilisateur trouvé, mise en cache.');
        localStorage.setItem('currentUser', JSON.stringify(userObj));
    }

    console.log('[LOGIN SUCCESS] Connexion réussie, token reçu.');
    return data.token;

  } catch (error) {
    console.error('[LOGIN CRITICAL] Erreur critique lors de la tentative de connexion:', error);
    throw error;
  }
};

export const getProfile = async (token: string): Promise<User> => {
  try {
    const response = await fetch(`${ADMIN_URL}/profile`, {
        method: 'GET',
        headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        console.warn('[GET PROFILE] Failed to fetch profile, status:', response.status);
        const cached = localStorage.getItem('currentUser');
        if (cached) return JSON.parse(cached);
        throw new Error('Impossible de récupérer le profil administrateur');
    }

    const data = await response.json();
    // Check for user, admin, data wrapper, or spread data
    const user = data.user || data.admin || data.data || data;
    
    // Update cache
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    return user;
  } catch (error) {
    console.error('[GET PROFILE] Error:', error);
    const cached = localStorage.getItem('currentUser');
    if (cached) return JSON.parse(cached);
    throw error;
  }
};

export const updateProfile = async (token: string, userData: Partial<User>): Promise<User> => {
  const response = await fetch(`${ADMIN_URL}/profile`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    let errorData;
    try {
        errorData = await response.json();
    } catch(e) {
        // ignore json parse error
    }
    
    let message = errorData?.message || 'Impossible de mettre à jour le profil';
    
    // Handle duplicates for profile update too
    if (typeof message === 'string' && message.includes('E11000 duplicate key error')) {
        if (message.includes('phone')) message = "Ce numéro de téléphone est déjà utilisé.";
        else if (message.includes('email')) message = "Cet email est déjà utilisé.";
    }

    throw new Error(message);
  }

  const data = await response.json();
  const user = data.user || data.admin || data.data || data;
  return user;
};
