document.querySelectorAll('.btn-eliminar').forEach(boton => {
  boton.addEventListener('click', () => {
    const tarjeta = boton.closest('.tarjeta');
    tarjeta.style.transition = 'opacity 0.3s';
    tarjeta.style.opacity = '0';
    setTimeout(() => tarjeta.remove(), 300);
  });
});