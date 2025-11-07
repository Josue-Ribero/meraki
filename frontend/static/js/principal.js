// Agrega estas funciones al principal.js existente
async function cargarProductos() {
  try {
    const response = await fetch('/productos/');

    if (!response.ok) {
      throw new Error('Error al cargar productos');
    }

    const productos = await response.json();
    mostrarProductos(productos);
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('productos-container').innerHTML = `
      <div class="text-center py-8 col-span-full">
        <p class="text-color-texto-oscuro">Error al cargar los productos</p>
      </div>
    `;
  }
}

function mostrarProductos(productos) {
  const container = document.getElementById('productos-container');

  if (!productos || productos.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 col-span-full">
        <p class="text-color-texto-oscuro">No hay productos disponibles</p>
      </div>
    `;
    return;
  }

  container.innerHTML = productos.map(producto => `
    <div class="group relative flex flex-col overflow-hidden rounded-xl shadow-md hover:shadow-2xl transition-shadow duration-300 bg-white border border-color-borde-input/50">
      <div class="aspect-square w-full overflow-hidden">
        <img 
          alt="${producto.nombre}" 
          class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300" 
          src="${producto.imagenURL || '../static/img/placeholder.jpg'}" 
          onerror="this.src='../static/img/placeholder.jpg'"
        />
      </div>
      <div class="p-4 flex flex-col flex-grow">
        <a href="/producto/${producto.id}">
          <h3 class="text-base font-semibold text-color-texto-oscuro">${producto.nombre}</h3>
          <p class="text-sm text-gray-500">${obtenerCategoriaMaterial(producto)}</p>
          <div class="flex items-center justify-between mt-4">
            <p class="text-xl font-bold text-color-secundario">$${(producto.precio / 100).toFixed(2)}</p>
            <button 
              class="p-2.5 rounded-full bg-color-principal text-color-blanco hover:bg-color-principal-oscuro transition-colors btn-agregar-carrito"
              data-producto-id="${producto.id}"
              ${producto.stock === 0 ? 'disabled' : ''}
            >
              <span class="material-symbols-outlined text-xl">
                ${producto.stock === 0 ? 'remove_shopping_cart' : 'add_shopping_cart'}
              </span>
            </button>
          </div>
          ${producto.stock === 0 ? '<p class="text-red-500 text-sm mt-2">Sin stock</p>' : ''}
        </a>
      </div>
    </div>
  `).join('');

  // Agregar event listeners a los botones de carrito
  agregarEventListenersCarrito();
}

function obtenerCategoriaMaterial(producto) {
  // Esta función puede mejorarse cuando tengas las categorías implementadas
  if (producto.descripcion) {
    return producto.descripcion.substring(0, 50) + '...';
  }
  return 'Joyas únicas';
}

function agregarEventListenersCarrito() {
  const botonesCarrito = document.querySelectorAll('.btn-agregar-carrito');

  botonesCarrito.forEach(boton => {
    boton.addEventListener('click', function (e) {
      e.preventDefault();
      const productoId = this.getAttribute('data-producto-id');
      agregarAlCarrito(productoId);
    });
  });
}

function agregarAlCarrito(productoId) {
  // Aquí implementarás la lógica para agregar al carrito
  console.log('Agregando producto al carrito:', productoId);

  // Ejemplo básico - incrementar contador
  const carritoContador = document.getElementById('carrito-contador');
  let numeroItemsCarrito = parseInt(carritoContador.textContent) || 0;
  numeroItemsCarrito++;
  carritoContador.textContent = numeroItemsCarrito > 0 ? numeroItemsCarrito : '';
  carritoContador.classList.toggle('hidden', numeroItemsCarrito === 0);

  // Mostrar feedback visual
  const boton = document.querySelector(`[data-producto-id="${productoId}"]`);
  const iconoOriginal = boton.innerHTML;
  boton.innerHTML = '<span class="material-symbols-outlined text-xl">check</span>';
  boton.classList.add('bg-green-500');

  setTimeout(() => {
    boton.innerHTML = iconoOriginal;
    boton.classList.remove('bg-green-500');
  }, 1000);
}

// Modifica el event listener existente para incluir la carga de productos
document.addEventListener('DOMContentLoaded', function () {
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

  // Cargar productos cuando la página esté lista
  cargarProductos();

  console.log('Página principal cargada y lista.');
});