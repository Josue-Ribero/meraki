function showTab(tabId) {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const loginTab = document.getElementById('login-tab');
  const registerTab = document.getElementById('register-tab');

  // Ocultar ambos formularios
  loginForm.classList.add('hidden');
  registerForm.classList.add('hidden');

  // Mostrar el formulario seleccionado
  document.getElementById(tabId).classList.remove('hidden');

  // Reiniciar estilos de pestañas
  loginTab.classList.remove('tab-active');
  loginTab.classList.add('tab-inactive');
  registerTab.classList.remove('tab-active');
  registerTab.classList.add('tab-inactive');

  // Activar la pestaña seleccionada
  if (tabId === 'login-form') {
    loginTab.classList.add('tab-active');
    loginTab.classList.remove('tab-inactive');
  } else {
    registerTab.classList.add('tab-active');
    registerTab.classList.remove('tab-inactive');
  }
}

// Manejar el envío del formulario de registro
document.getElementById('register-form').addEventListener('submit', async (event) => {
  event.preventDefault(); // Evita el envío tradicional del formulario

  const formData = new FormData(event.target);
  const nombre = formData.get('nombre');
  const email = formData.get('email');
  const password = formData.get('password');

  try {
    const response = await fetch('/usuario/registro', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded', // Opcional, pero bueno especificarlo
      },
      body: `nombre=${encodeURIComponent(nombre)}&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
    });

    if (response.ok) {
      // Si la respuesta es exitosa (status 201), redirige a principal.html
      window.location.href = '/principal'; // Ajusta la URL si principal.html está en otra ruta
    } else {
      // Manejar errores (opcional)
      console.error('Error en el registro:', response.status);
      // Puedes mostrar un mensaje de error al usuario aquí
    }
  } catch (error) {
    console.error('Error de red:', error);
    // Manejar errores de red
  }
});

// Mostrar el login al cargar
window.onload = () => showTab('login-form');