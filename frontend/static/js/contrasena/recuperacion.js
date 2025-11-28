// Funcion para el envio del token
const emailForm = document.getElementById('email-form');
const emailSection = document.getElementById('email-section');
const tokenSection = document.getElementById('token-section');
let currentToken = '';

// Evento para el envio del token
emailForm.addEventListener('submit', e => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  if (email) {
    currentToken = Math.floor(100000 + Math.random() * 900000).toString();
    alert(`Token enviado a ${email}: ${currentToken}`);
    emailSection.classList.add('hidden');
    tokenSection.classList.remove('hidden');
    tokenInput.value = '';
    updateTokenDisplay();
    timeLeft = 300;
    startTimer();
  }
});

// Funcion para el envio del token
const tokenInput = document.getElementById('token-input');
const tokenDisplaySpans = document.querySelectorAll('#token-display span');
const keypadButtons = document.querySelectorAll('.key-btn');
const backspace = document.getElementById('backspace');
const submitToken = document.getElementById('submit-token');
const timerDisplay = document.getElementById('timer-display');
const resendTokenButton = document.getElementById('resend-token-button');

let timeLeft = 300;
let timerInterval;

// Funcion para actualizar el display del token
function updateTokenDisplay() {
  const token = tokenInput.value;
  tokenDisplaySpans.forEach((span, index) => { span.textContent = token[index] || ''; });
}

// Evento para el envio del token
keypadButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    if (tokenInput.value.length < 6) {
      tokenInput.value += btn.dataset.value;
      updateTokenDisplay();
    }
  });
});

// Evento para el envio del token
backspace.addEventListener('click', () => {
  tokenInput.value = tokenInput.value.slice(0, -1);
  updateTokenDisplay();
});

// Evento para el envio del token
submitToken.addEventListener('click', () => {
  if (tokenInput.value.length === 6) {
    if (tokenInput.value === currentToken) {
      alert('Token correcto. ¡Acceso permitido!');
    } else {
      alert('Token incorrecto.');
    }
    tokenInput.value = '';
    updateTokenDisplay();
    timeLeft = 300;
  } else alert('Ingresa un token de 6 dígitos');
});

tokenInput.addEventListener('input', () => {
  tokenInput.value = tokenInput.value.replace(/[^0-9]/g, '').slice(0, 6);
  updateTokenDisplay();
});

// Funcion para formatear el tiempo
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Funcion para iniciar el timer
function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = formatTime(timeLeft);
    if (timeLeft <= 120 && resendTokenButton.classList.contains('hidden')) {
      resendTokenButton.classList.remove('hidden');
    }
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerDisplay.textContent = '00:00';
    }
  }, 1000);
}

// Evento para el envio del token
resendTokenButton.addEventListener('click', () => {
  if (currentToken) {
    currentToken = Math.floor(100000 + Math.random() * 900000).toString();
    alert(`Token reenviado: ${currentToken}`);
    tokenInput.value = '';
    updateTokenDisplay();
    timeLeft = 300;
    startTimer();
    resendTokenButton.classList.add('hidden');
  }
});

updateTokenDisplay();