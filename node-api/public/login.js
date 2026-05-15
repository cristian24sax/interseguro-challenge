(function () {
  const form = document.getElementById('login-form');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const loginError = document.getElementById('login-error');
  const btnLogin = document.getElementById('btn-login');

  if (InterseguroAuth.isAuthenticated()) {
    redirectAfterLogin();
    return;
  }

  form.addEventListener('submit', onSubmit);

  async function onSubmit(event) {
    event.preventDefault();
    hideError();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    if (!username || !password) {
      showError('Ingresa usuario y contraseña.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      let body;
      try {
        body = await response.json();
      } catch {
        throw new Error('Respuesta inválida del servidor');
      }

      if (!response.ok || !body.success) {
        throw new Error(body.message || 'No se pudo iniciar sesión');
      }

      const jwtToken = body.data.token || body.data.accessToken;
      InterseguroAuth.setSession(jwtToken, body.data.username || username);
      redirectAfterLogin();
    } catch (err) {
      showError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  function redirectAfterLogin() {
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    const safeRedirect =
      redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/';
    window.location.replace(safeRedirect);
  }

  function setLoading(loading) {
    btnLogin.disabled = loading;
    usernameInput.disabled = loading;
    passwordInput.disabled = loading;
    btnLogin.textContent = loading ? 'Entrando…' : 'Entrar';
  }

  function showError(message) {
    loginError.textContent = message;
    loginError.hidden = false;
  }

  function hideError() {
    loginError.hidden = true;
    loginError.textContent = '';
  }
})();
