function showTab(tabId) {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const loginTab = document.getElementById('login-tab');
  const registerTab = document.getElementById('register-tab');

  loginForm.classList.add('hidden');
  registerForm.classList.add('hidden');

  document.getElementById(tabId).classList.remove('hidden');

  loginTab.classList.remove('tab-active');
  loginTab.classList.add('tab-inactive');
  registerTab.classList.remove('tab-active');
  registerTab.classList.add('tab-inactive');

  if (tabId === 'login-form') {
    loginTab.classList.add('tab-active');
    loginTab.classList.remove('tab-inactive');
  } else {
    registerTab.classList.add('tab-active');
    registerTab.classList.remove('tab-inactive');
  }
}

document.getElementById('register-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(event.target);
  const nombre = formData.get('nombre');
  const email = formData.get('email');
  const contrasena = formData.get('contrasena');
  const telefono = formData.get('telefono'); // Nuevo campo

  const errorDiv = document.getElementById('register-error');
  errorDiv.classList.add('hidden');
  errorDiv.textContent = '';

  // Validación básica del teléfono en el frontend
  if (telefono && telefono.replace(/\D/g, '').length < 7) {
    errorDiv.textContent = 'El número de teléfono debe tener al menos 7 dígitos';
    errorDiv.classList.remove('hidden');
    return;
  }

  try {
    const response = await fetch('/clientes/registrar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `nombre=${encodeURIComponent(nombre)}&email=${encodeURIComponent(email)}&contrasena=${encodeURIComponent(contrasena)}&telefono=${encodeURIComponent(telefono)}`,
    });

    if (response.ok) {
      window.location.href = '/';
    } else {
      const data = await response.json();
      errorDiv.textContent = data.detail || 'Error al registrarse. Intente nuevamente.';
      errorDiv.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error de red:', error);
    errorDiv.textContent = 'Error de conexión. Intente nuevamente.';
    errorDiv.classList.remove('hidden');
  }
});

window.onload = () => showTab('login-form');