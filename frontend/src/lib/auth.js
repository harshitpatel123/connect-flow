export const auth = {
  setToken: (token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  },

  getToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  },

  removeToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  },

  isAuthenticated: () => {
    return !!auth.getToken();
  },
};
