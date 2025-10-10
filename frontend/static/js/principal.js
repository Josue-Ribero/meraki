document.addEventListener('DOMContentLoaded', function() {
  // Ejemplo: Mostrar/Ocultar dropdown de búsqueda
  const searchInput = document.querySelector('input[placeholder="Buscar collares, anillos..."]');
  const searchDropdown = document.querySelector('.absolute.top-full.mt-2.w-full');

  if (searchInput && searchDropdown) {
    searchInput.addEventListener('focus', () => {
      searchDropdown.classList.remove('hidden');
    });

    searchInput.addEventListener('blur', () => {
      // Pequeño delay para permitir clic en los resultados
      setTimeout(() => {
        searchDropdown.classList.add('hidden');
      }, 200);
    });
  }

  // Simular actualización del contador del carrito
  // Aquí iría la lógica para obtener el número real de items del carrito del backend
  // Por ahora, un ejemplo simple:
  const carritoBtn = document.getElementById('carrito-btn');
  const carritoContador = document.getElementById('carrito-contador');
  let numeroItemsCarrito = 0; // Variable simulada

  // Función para actualizar el contador visual
  function actualizarContadorCarrito(nuevoNumero) {
    numeroItemsCarrito = nuevoNumero;
    carritoContador.textContent = numeroItemsCarrito > 0 ? numeroItemsCarrito : '';
    carritoContador.classList.toggle('hidden', numeroItemsCarrito === 0);
  }

  // Ejemplo: Incrementar el contador al hacer clic en el botón del carrito
  carritoBtn.addEventListener('click', () => {
    numeroItemsCarrito++;
    actualizarContadorCarrito(numeroItemsCarrito);
    console.log('Carrito clicado. Número de items:', numeroItemsCarrito);
  });

  // Inicializar contador (simulado)
  actualizarContadorCarrito(numeroItemsCarrito);

  console.log('Página principal cargada y lista.');
});