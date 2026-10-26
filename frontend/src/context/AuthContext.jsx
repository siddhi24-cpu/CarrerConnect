import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser   ] = useState(null);
  const [token,   setToken  ] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode,setDarkMode] = useState(false);

  // Rehydrate auth + theme from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('cc_token');
    const storedUser  = localStorage.getItem('cc_user');
    const storedTheme = localStorage.getItem('cc_theme');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('cc_token');
        localStorage.removeItem('cc_user');
      }
    }

    const dark = storedTheme === 'dark';
    setDarkMode(dark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');

    setLoading(false);
  }, []);

  const login = useCallback((userData, jwt) => {
    setUser(userData);
    setToken(jwt);
    localStorage.setItem('cc_token', jwt);
    localStorage.setItem('cc_user', JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('cc_token');
    localStorage.removeItem('cc_user');
  }, []);

  /** Update the cached user object (after profile edit) */
  const updateUser = useCallback((partial) => {
    setUser((prev) => {
      const next = { ...prev, ...partial };
      localStorage.setItem('cc_user', JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('cc_theme', next ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, loading, darkMode, login, logout, updateUser, toggleDarkMode }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
