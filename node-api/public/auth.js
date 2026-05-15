(function (global) {
  const TOKEN_KEY = 'interseguro_access_token';
  const USER_KEY = 'interseguro_username';

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function getUsername() {
    return localStorage.getItem(USER_KEY);
  }

  function setSession(accessToken, username) {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(USER_KEY, username || '');
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function isTokenExpired(token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (!payload.exp) return false;
      return payload.exp * 1000 <= Date.now();
    } catch {
      return true;
    }
  }

  function isAuthenticated() {
    const token = getToken();
    if (!token) return false;
    if (isTokenExpired(token)) {
      clearSession();
      return false;
    }
    return true;
  }

  function getAuthHeaders() {
    const token = getToken();
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }

  function loginPath(redirectTo) {
    const params = new URLSearchParams();
    if (redirectTo) params.set('redirect', redirectTo);
    const query = params.toString();
    return query ? `/login.html?${query}` : '/login.html';
  }

  function requireAuth() {
    if (!isAuthenticated()) {
      const redirectTo = `${window.location.pathname}${window.location.search}`;
      window.location.replace(loginPath(redirectTo));
      return false;
    }
    return true;
  }

  function logout() {
    clearSession();
    window.location.replace('/login.html');
  }

  function handleUnauthorized() {
    clearSession();
    const redirectTo = `${window.location.pathname}${window.location.search}`;
    window.location.replace(loginPath(redirectTo));
  }

  global.InterseguroAuth = {
    getToken,
    getUsername,
    setSession,
    clearSession,
    isAuthenticated,
    getAuthHeaders,
    requireAuth,
    logout,
    handleUnauthorized,
    loginPath,
  };
})(window);
