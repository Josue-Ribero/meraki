// principal.js - CON FILTROS COMPLETOS Y PAGINACIÓN
let todosLosProductos = [];
let categoriasDisponibles = [];
let filtrosActivos = {
  categorias: [],
  precioMax: 75000,
  popularidad: 'todos',
  busqueda: '',
  orden: 'relevancia'
};

// Variables de paginación
let paginaActual = 1;
const productosPorPagina = 8;

// FUNCIÓN PARA FORMATEAR PRECIOS CON PUNTOS
function formatearPrecio(precio) {
  if (!precio && precio !== 0) return '0';

  // Convertir a string y eliminar decimales si los hay
  const precioString = Math.floor(Number(precio)).toString();

  // Agregar puntos cada 3 dígitos de derecha a izquierda
  return precioString.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// CARGAR PRODUCTOS Y CATEGORÍAS
async function cargarDatosIniciales() {
  try {
    // Cargar productos
    const responseProductos = await fetch('/productos/');
    if (!responseProductos.ok) throw new Error('Error al cargar productos');
    todosLosProductos = await responseProductos.json();

    // Cargar categorías
    const responseCategorias = await fetch('/categorias/');
    if (responseCategorias.ok) {
      categoriasDisponibles = await responseCategorias.json();
    } else {
      // Si falla, usar categorías por defecto
      categoriasDisponibles = [
        { id: 1, nombre: "Collares" },
        { id: 2, nombre: "Pulseras" },
        { id: 3, nombre: "Anillos" },
        { id: 4, nombre: "Pendientes" },
        { id: 5, nombre: "Conjuntos" }
      ];
    }

    inicializarFiltros();
    aplicarFiltros();
  } catch (error) {
    console.error('Error:', error);
    mostrarError('Error al cargar los datos');
  }
}

// INICIALIZAR FILTROS
function inicializarFiltros() {
  // Cargar categorías en el filtro
  const contenedorCategorias = document.getElementById('categorias-filtro');
  contenedorCategorias.innerHTML = categoriasDisponibles.map(categoria => `
        <label class="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" value="${categoria.id}" class="categoria-checkbox rounded text-color-principal focus:ring-color-principal">
            <span class="text-color-texto-oscuro hover:text-color-principal">${categoria.nombre}</span>
        </label>
    `).join('');

  // Configurar eventos de categorías
  document.querySelectorAll('.categoria-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', function () {
      if (this.checked) {
        filtrosActivos.categorias.push(this.value);
      } else {
        filtrosActivos.categorias = filtrosActivos.categorias.filter(id => id !== this.value);
      }
      paginaActual = 1; // Resetear a primera página al cambiar filtros
      aplicarFiltros();
    });
  });

  // Configurar rango de precio
  const precioRange = document.getElementById('precio-range');
  const precioMinSpan = document.getElementById('precio-min');
  const precioMaxSpan = document.getElementById('precio-max');
  const precioMinInput = document.getElementById('precio-min-input');
  const precioMaxInput = document.getElementById('precio-max-input');

  // Calcular precio máximo real de los productos
  const precios = todosLosProductos.map(p => p.precio);
  const precioMaxReal = Math.max(...precios);
  precioRange.max = precioMaxReal;
  precioRange.value = precioMaxReal;
  filtrosActivos.precioMax = precioMaxReal;

  // Actualizar displays de precio
  function actualizarDisplayPrecio() {
    precioMaxSpan.textContent = `$${formatearPrecio(precioRange.value)}`;
    precioMaxInput.value = precioRange.value;
    filtrosActivos.precioMax = parseInt(precioRange.value);
    paginaActual = 1; // Resetear a primera página al cambiar filtros
    aplicarFiltros();
  }

  precioRange.addEventListener('input', actualizarDisplayPrecio);

  precioMinInput.addEventListener('change', function () {
    const valor = parseInt(this.value) || 0;
    if (valor >= 0 && valor <= precioRange.value) {
      paginaActual = 1; // Resetear a primera página al cambiar filtros
      aplicarFiltros();
    }
  });

  precioMaxInput.addEventListener('change', function () {
    const valor = parseInt(this.value) || precioMaxReal;
    if (valor >= (parseInt(precioMinInput.value) || 0)) {
      precioRange.value = Math.min(valor, precioMaxReal);
      actualizarDisplayPrecio();
    }
  });

  // Configurar filtro de popularidad
  document.getElementById('filtro-popularidad').addEventListener('change', function () {
    filtrosActivos.popularidad = this.value;
    paginaActual = 1; // Resetear a primera página al cambiar filtros
    aplicarFiltros();
  });

  // Configurar ordenamiento
  document.getElementById('ordenar-por').addEventListener('change', function () {
    filtrosActivos.orden = this.value;
    paginaActual = 1; // Resetear a primera página al cambiar filtros
    aplicarFiltros();
  });

  // Configurar búsqueda
  document.getElementById('search-input').addEventListener('input', function () {
    filtrosActivos.busqueda = this.value.toLowerCase();
    paginaActual = 1; // Resetear a primera página al cambiar filtros
    aplicarFiltros();
  });

  // Configurar limpiar filtros
  document.getElementById('limpiar-filtros').addEventListener('click', function () {
    limpiarFiltros();
  });
}

// APLICAR FILTROS
function aplicarFiltros() {
  let productosFiltrados = [...todosLosProductos];

  // Filtro por búsqueda
  if (filtrosActivos.busqueda) {
    productosFiltrados = productosFiltrados.filter(producto =>
      producto.nombre.toLowerCase().includes(filtrosActivos.busqueda) ||
      (producto.descripcion && producto.descripcion.toLowerCase().includes(filtrosActivos.busqueda))
    );
  }

  // Filtro por categorías
  if (filtrosActivos.categorias.length > 0) {
    productosFiltrados = productosFiltrados.filter(producto =>
      filtrosActivos.categorias.includes(producto.categoriaID.toString())
    );
  }

  // Filtro por precio
  const precioMin = parseInt(document.getElementById('precio-min-input').value) || 0;
  const precioMax = filtrosActivos.precioMax;

  productosFiltrados = productosFiltrados.filter(producto =>
    producto.precio >= precioMin && producto.precio <= precioMax
  );

  // Filtro por popularidad (esto es un ejemplo, necesitarías datos reales de popularidad)
  if (filtrosActivos.popularidad === 'novedades') {
    // Ordenar por ID descendente (asumiendo que IDs más altos son más nuevos)
    productosFiltrados.sort((a, b) => b.id - a.id);
  } else if (filtrosActivos.popularidad === 'populares') {
    // Aquí necesitarías un campo de "veces vendido" o "rating"
    // Por ahora, ordenamos por nombre como ejemplo
    productosFiltrados.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  // Ordenamiento adicional
  if (filtrosActivos.orden === 'precio-asc') {
    productosFiltrados.sort((a, b) => a.precio - b.precio);
  } else if (filtrosActivos.orden === 'precio-desc') {
    productosFiltrados.sort((a, b) => b.precio - a.precio);
  } else if (filtrosActivos.orden === 'novedades') {
    productosFiltrados.sort((a, b) => b.id - a.id);
  }

  mostrarProductosPaginados(productosFiltrados);
}

// MOSTRAR PRODUCTOS CON PAGINACIÓN
function mostrarProductosPaginados(productosFiltrados) {
  const totalProductos = productosFiltrados.length;
  const totalPaginas = Math.ceil(totalProductos / productosPorPagina);

  // Ajustar página actual si es necesario
  if (paginaActual > totalPaginas && totalPaginas > 0) {
    paginaActual = totalPaginas;
  } else if (totalPaginas === 0) {
    paginaActual = 1;
  }

  // Calcular productos para la página actual
  const inicio = (paginaActual - 1) * productosPorPagina;
  const fin = inicio + productosPorPagina;
  const productosPagina = productosFiltrados.slice(inicio, fin);

  mostrarProductos(productosPagina, totalProductos);
  mostrarPaginacion(totalPaginas, totalProductos);
}

// MOSTRAR PRODUCTOS EN LA PÁGINA ACTUAL
function mostrarProductos(productos, totalProductos) {
  const container = document.getElementById('productos-container');
  const contador = document.getElementById('contador-productos');

  // Actualizar contador
  const inicio = (paginaActual - 1) * productosPorPagina + 1;
  const fin = Math.min(paginaActual * productosPorPagina, totalProductos);

  if (totalProductos === 0) {
    contador.textContent = 'No se encontraron productos';
  } else {
    contador.textContent = `Mostrando ${inicio}-${fin} de ${totalProductos} productos`;
  }

  if (!productos || productos.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 col-span-full">
        <p class="text-color-texto-oscuro">No se encontraron productos con los filtros aplicados</p>
        <button onclick="limpiarFiltros()" class="mt-4 px-4 py-2 bg-color-principal text-white rounded hover:bg-color-principal-oscuro transition-colors">
          Limpiar filtros
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = productos.map(producto => {
    const categoria = categoriasDisponibles.find(c => c.id === producto.categoriaID);
    const nombreCategoria = categoria ? categoria.nombre : 'Joyas únicas';

    return `
      <div class="group relative flex flex-col overflow-hidden rounded-xl shadow-md hover:shadow-2xl transition-shadow duration-300 bg-white border border-color-borde-input/50">
        <div class="aspect-square w-full overflow-hidden">
          <img 
            alt="${producto.nombre}" 
            class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300" 
            src="${producto.imagenURL || '/static/img/placeholder.jpg'}" 
            onerror="this.src='/static/img/placeholder.jpg'"
          />
        </div>
        <div class="p-4 flex flex-col flex-grow">
          <a href="/producto/${producto.id}">
            <h3 class="text-base font-semibold text-color-texto-oscuro">${producto.nombre}</h3>
            <p class="text-sm text-gray-500">${nombreCategoria}</p>
            <div class="flex items-center justify-between mt-4">
              <p class="text-xl font-bold text-color-secundario">$${formatearPrecio(producto.precio)}</p>
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
    `;
  }).join('');

  // Agregar event listeners a los botones de carrito
  agregarEventListenersCarrito();
}

// MOSTRAR CONTROLES DE PAGINACIÓN
function mostrarPaginacion(totalPaginas, totalProductos) {
  const container = document.getElementById('paginacion-container');

  if (totalPaginas <= 1) {
    container.innerHTML = '';
    return;
  }

  let paginacionHTML = '';

  // Botón Anterior
  paginacionHTML += `
    <button class="paginacion-btn" ${paginaActual === 1 ? 'disabled' : ''} 
            onclick="cambiarPagina(${paginaActual - 1})">
      Anterior
    </button>
  `;

  // Números de página
  const paginasAMostrar = generarNumerosPagina(paginaActual, totalPaginas);

  paginasAMostrar.forEach(numero => {
    if (numero === '...') {
      paginacionHTML += `<span class="paginacion-ellipsis">...</span>`;
    } else {
      paginacionHTML += `
        <button class="paginacion-btn ${numero === paginaActual ? 'paginacion-btn-active' : ''}" 
                onclick="cambiarPagina(${numero})">
          ${numero}
        </button>
      `;
    }
  });

  // Botón Siguiente
  paginacionHTML += `
    <button class="paginacion-btn" ${paginaActual === totalPaginas ? 'disabled' : ''} 
            onclick="cambiarPagina(${paginaActual + 1})">
      Siguiente
    </button>
  `;

  container.innerHTML = paginacionHTML;
}

// GENERAR NÚMEROS DE PÁGINA CON ELIPSIS
function generarNumerosPagina(paginaActual, totalPaginas) {
  const paginas = [];
  const paginasALaVista = 5; // Número máximo de páginas a mostrar

  if (totalPaginas <= paginasALaVista) {
    // Mostrar todas las páginas
    for (let i = 1; i <= totalPaginas; i++) {
      paginas.push(i);
    }
  } else {
    // Lógica para mostrar páginas con elipsis
    if (paginaActual <= 3) {
      // Primeras páginas
      for (let i = 1; i <= 4; i++) {
        paginas.push(i);
      }
      paginas.push('...');
      paginas.push(totalPaginas);
    } else if (paginaActual >= totalPaginas - 2) {
      // Últimas páginas
      paginas.push(1);
      paginas.push('...');
      for (let i = totalPaginas - 3; i <= totalPaginas; i++) {
        paginas.push(i);
      }
    } else {
      // Páginas intermedias
      paginas.push(1);
      paginas.push('...');
      for (let i = paginaActual - 1; i <= paginaActual + 1; i++) {
        paginas.push(i);
      }
      paginas.push('...');
      paginas.push(totalPaginas);
    }
  }

  return paginas;
}

// CAMBIAR PÁGINA
function cambiarPagina(nuevaPagina) {
  paginaActual = nuevaPagina;
  aplicarFiltros();

  // Scroll suave hacia arriba
  window.scrollTo({
    top: document.getElementById('productos-container').offsetTop - 100,
    behavior: 'smooth'
  });
}

// LIMPIAR FILTROS
function limpiarFiltros() {
  // Resetear checkboxes de categorías
  document.querySelectorAll('.categoria-checkbox').forEach(checkbox => {
    checkbox.checked = false;
  });

  // Resetear precio
  const precioMaxReal = Math.max(...todosLosProductos.map(p => p.precio));
  const precioRange = document.getElementById('precio-range');
  precioRange.value = precioMaxReal;

  document.getElementById('precio-min-input').value = '';
  document.getElementById('precio-max-input').value = '';
  document.getElementById('precio-max').textContent = `$${formatearPrecio(precioMaxReal)}`;

  // Resetear otros filtros
  document.getElementById('filtro-popularidad').value = 'todos';
  document.getElementById('ordenar-por').value = 'relevancia';
  document.getElementById('search-input').value = '';

  // Resetear estado de filtros y paginación
  filtrosActivos = {
    categorias: [],
    precioMax: precioMaxReal,
    popularidad: 'todos',
    busqueda: '',
    orden: 'relevancia'
  };

  paginaActual = 1;

  aplicarFiltros();
}

// MOSTRAR ERROR
function mostrarError(mensaje) {
  const container = document.getElementById('productos-container');
  container.innerHTML = `
    <div class="text-center py-8 col-span-full">
      <p class="text-color-texto-oscuro">${mensaje}</p>
      <button onclick="cargarDatosIniciales()" class="mt-4 px-4 py-2 bg-color-principal text-white rounded hover:bg-color-principal-oscuro transition-colors">
        Reintentar
      </button>
    </div>
  `;
}

// AGREGAR EVENT LISTENERS AL CARRITO
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

// AGREGAR AL CARRITO
function agregarAlCarrito(productoId) {
  console.log('Agregando producto al carrito:', productoId);

  // Aquí implementarás la lógica real para agregar al carrito
  // Por ahora, solo feedback visual
  const boton = document.querySelector(`[data-producto-id="${productoId}"]`);
  const iconoOriginal = boton.innerHTML;
  boton.innerHTML = '<span class="material-symbols-outlined text-xl">check</span>';
  boton.classList.add('bg-green-500');

  setTimeout(() => {
    boton.innerHTML = iconoOriginal;
    boton.classList.remove('bg-green-500');
  }, 1000);
}

// INICIALIZAR TODO CUANDO SE CARGA LA PÁGINA
document.addEventListener('DOMContentLoaded', function () {
  cargarDatosIniciales();
  console.log('Página principal cargada y lista.');
});