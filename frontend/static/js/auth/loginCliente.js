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

// Manejar el formulario de login
document.getElementById('login-form').addEventListener('submit', function (event) {
  // No prevenir el comportamiento por defecto - dejar que el formulario se envíe normalmente
  // El backend se encargará de la redirección y autenticación

  // Solo mostrar el mensaje de error si las credenciales son incorrectas
  // Esto se manejará desde el backend con un parámetro en la URL
});

// Verificar si hay error de credenciales en la URL
function verificarErrorCredenciales() {
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get('error');

  if (error === 'credenciales') {
    const errorDiv = document.getElementById('login-error');
    errorDiv.classList.remove('hidden');

    // Limpiar el parámetro de la URL sin recargar la página
    const nuevaUrl = window.location.pathname;
    window.history.replaceState({}, document.title, nuevaUrl);
  }
}

// Manejar el formulario de registro
document.getElementById('register-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(event.target);
  const nombre = formData.get('nombre');
  const email = formData.get('email');
  const contrasena = formData.get('contrasena');
  const telefono = formData.get('telefono');

  const errorDiv = document.getElementById('register-error');
  const errorText = errorDiv.querySelector('.error-text');

  errorDiv.classList.add('hidden');
  errorText.textContent = '';

  // Validación básica del teléfono en el frontend
  if (telefono && telefono.replace(/\D/g, '').length < 7) {
    errorText.textContent = 'El número de teléfono debe tener al menos 7 dígitos';
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
      errorText.textContent = data.detail || 'Error al registrarse. Intente nuevamente.';
      errorDiv.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error de red:', error);
    errorText.textContent = 'Error de conexión. Intente nuevamente.';
    errorDiv.classList.remove('hidden');
  }
});

// Limpiar errores cuando el usuario escriba
document.getElementById('login-email').addEventListener('input', () => {
  document.getElementById('login-error').classList.add('hidden');
});

document.getElementById('login-password').addEventListener('input', () => {
  document.getElementById('login-error').classList.add('hidden');
});

window.onload = () => {
  showTab('login-form');
  verificarErrorCredenciales();
};  