// Función para mostrar el formulario de login o registro
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

// Función para mostrar error en un formulario
function mostrarError(formId, mensaje) {
  const errorDiv = document.getElementById(formId);
  const errorText = errorDiv.querySelector('.error-text');

  errorText.textContent = mensaje;
  errorDiv.classList.remove('hidden');

  // Agregar animación de shake
  errorDiv.classList.add('shake');
  setTimeout(() => {
    errorDiv.classList.remove('shake');
  }, 500);

  // Resaltar campos con error
  if (formId === 'login-error') {
    document.getElementById('login-email').classList.add('error');
    document.getElementById('login-password').classList.add('error');
  }
}

// Función para limpiar errores
function limpiarErrores() {
  // Limpiar errores de login
  document.getElementById('login-error').classList.add('hidden');
  document.getElementById('login-email').classList.remove('error');
  document.getElementById('login-password').classList.remove('error');

  // Limpiar errores de registro
  document.getElementById('register-error').classList.add('hidden');
}

// Función para manejar el envío del formulario de login
document.getElementById('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(event.target);
  const email = formData.get('email');
  const contrasena = formData.get('contrasena');

  // Limpiar errores previos
  limpiarErrores();

  // Validaciones básicas
  if (!email || !contrasena) {
    mostrarError('login-error', 'Por favor completa todos los campos');
    return;
  }

  // Deshabilitar el botón temporalmente
  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Iniciando sesión...';
  submitBtn.disabled = true;

  try {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `email=${encodeURIComponent(email)}&contrasena=${encodeURIComponent(contrasena)}`,
    });

    // Si la respuesta es 200, redirigir al usuario a la página principal
    if (response.ok) {
      window.location.href = '/';
    } else {
      // Si la respuesta es 401/400, mostrar el error
      const data = await response.json();

      let mensajeError = 'Error al iniciar sesión. Intente nuevamente.';

      if (response.status === 401) {
        mensajeError = 'Usuario o contraseña incorrectos';
      } else if (data.detail) {
        mensajeError = data.detail;
      }

      mostrarError('login-error', mensajeError);
    }
  } catch (error) {
    mostrarError('login-error', 'El correo o contrasena son incorrectos.');
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
});

// Función para registrar un cliente
document.getElementById('register-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(event.target);
  const nombre = formData.get('nombre');
  const email = formData.get('email');
  const contrasena = formData.get('contrasena');
  const telefono = formData.get('telefono');

  // Limpiar errores previos
  limpiarErrores();

  // Validación básica del teléfono en el frontend
  if (telefono && telefono.replace(/\D/g, '').length < 7) {
    mostrarError('register-error', 'El número de teléfono debe tener al menos 7 dígitos');
    return;
  }

  // Deshabilitar el botón temporalmente
  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Creando cuenta...';
  submitBtn.disabled = true;

  // Intentar registrar al cliente
  try {
    const response = await fetch('/clientes/registrar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `nombre=${encodeURIComponent(nombre)}&email=${encodeURIComponent(email)}&contrasena=${encodeURIComponent(contrasena)}&telefono=${encodeURIComponent(telefono)}`,
    });

    // Si la respuesta es 200, redirigir al usuario a la página principal
    if (response.ok) {
      window.location.href = '/';
    } else {
      // Si la respuesta es 400, mostrar el error
      const data = await response.json();
      const mensajeError = data.detail || 'Error al registrarse. Intente nuevamente.';
      mostrarError('register-error', mensajeError);
    }
  } catch (error) {
    // Si hay un error de red, mostrar el error
    console.error('Error de red:', error);
    mostrarError('register-error', 'Error de conexión. Intente nuevamente.');
  } finally {
    // Rehabilitar el botón
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
});

// Limpiar errores cuando el usuario empiece a escribir
document.getElementById('login-email').addEventListener('input', () => {
  document.getElementById('login-email').classList.remove('error');
});

document.getElementById('login-password').addEventListener('input', () => {
  document.getElementById('login-password').classList.remove('error');
});

// Verificar si hay parámetros de error en la URL (por si se redirige desde el backend)
function verificarParametrosError() {
  const urlParams = new URLSearchParams(window.location.search);
  const error = urlParams.get('error');

  if (error === 'credenciales') {
    mostrarError('login-error', 'Usuario o contraseña incorrectos');
    // Cambiar a la pestaña de login
    showTab('login-form');
  }
}

window.onload = () => {
  showTab('login-form');
  verificarParametrosError();
};