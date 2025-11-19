
import React, { useState, useCallback, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import PanelPage from './components/PanelPage';
import { loadSavedTheme } from './lib/theme';

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Load Auth Token
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setToken(storedToken);
    }
    
    // Load Theme Color
    loadSavedTheme();
  }, []);

  const handleLoginSuccess = useCallback((newToken: string) => {
    localStorage.setItem('authToken', newToken);
    setToken(newToken);
  }, []);
  
  const handleLogout = useCallback(() => {
    localStorage.removeItem('authToken');
    setToken(null);
  }, []);

  return (
    <>
      {token ? (
        <PanelPage token={token} onLogout={handleLogout} />
      ) : (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      )}
    </>
  );
};

export default App;
