document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.querySelector('input[placeholder="Buscar collares, anillos..."]');
  const searchDropdown = document.querySelector('.absolute.top-full.mt-2.w-full');

  if (searchInput && searchDropdown) {
    searchInput.addEventListener('focus', () => {
      searchDropdown.classList.remove('hidden');
    });

    searchInput.addEventListener('blur', () => {
      setTimeout(() => {
        searchDropdown.classList.add('hidden');
      }, 200);
    });
  }

  const carritoBtn = document.getElementById('carrito-btn');
  const carritoContador = document.getElementById('carrito-contador');
  let numeroItemsCarrito = 0;

  function actualizarContadorCarrito(nuevoNumero) {
    numeroItemsCarrito = nuevoNumero;
    carritoContador.textContent = numeroItemsCarrito > 0 ? numeroItemsCarrito : '';
    carritoContador.classList.toggle('hidden', numeroItemsCarrito === 0);
  }

  carritoBtn.addEventListener('click', () => {
    numeroItemsCarrito++;
    actualizarContadorCarrito(numeroItemsCarrito);
    console.log('Carrito clicado. Número de items:', numeroItemsCarrito);
  });

  actualizarContadorCarrito(numeroItemsCarrito);

  console.log('Página principal cargada y lista.');
});