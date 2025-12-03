// Listas de productos, categorias y filtros
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

// Funcion para formatear precios con puntos
function formatearPrecio(precio) {
  if (!precio && precio !== 0) return '0';
  const precioString = Math.floor(Number(precio)).toString();
  return precioString.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Cargar productos y categorias
async function cargarDatosIniciales() {
  try {

    // Respuestas de productos y categorias
    const respuestaProductos = await fetch('/productos/');
    if (!respuestaProductos.ok) throw new Error('Error al cargar productos');
    todosLosProductos = await respuestaProductos.json();

    const respuestaCategorias = await fetch('/categorias/');
    if (respuestaCategorias.ok) {
      categoriasDisponibles = await respuestaCategorias.json();
    } else {
      // Categorias por defecto si falla la carga de las reales
      categoriasDisponibles = [
        { id: 1, nombre: "Collares" },
        { id: 2, nombre: "Pulseras" },
        { id: 3, nombre: "Anillos" },
        { id: 4, nombre: "Pendientes" },
        { id: 5, nombre: "Conjuntos" }
      ];
    }

    // Inicializar filtros
    inicializarFiltros();
    aplicarFiltros();
  } catch (error) {
    mostrarError('Error al cargar los datos. Por favor, intenta recargar la página.');
  }
}

// Obtener y gestionar wishlist
function obtenerWishlist() {
  try {
    const raw = localStorage.getItem('wishlist');
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}

// Verificar si un producto esta en la wishlist
function estaEnWishlist(id) {
  const lista = obtenerWishlist();
  return lista.map(String).includes(String(id));
}

// Agregar un producto a la wishlist
function agregarAWishlist(id) {
  const lista = obtenerWishlist();
  if (!lista.map(String).includes(String(id))) {
    lista.push(String(id));
    localStorage.setItem('wishlist', JSON.stringify(lista));
  }
}

// Eliminar un producto de la wishlist
function eliminarDeWishlist(id) {
  let lista = obtenerWishlist();
  lista = lista.filter(i => String(i) !== String(id));
  localStorage.setItem('wishlist', JSON.stringify(lista));
}

// Alternar entre agregar y eliminar de la wishlist
function alternarWishlist(id) {
  if (estaEnWishlist(id)) eliminarDeWishlist(id); else agregarAWishlist(id);
}

// Inicializar filtros de busqueda u orden
function inicializarFiltros() {
  // Renderizar categorías dinámicamente usando template
  const contenedorCategorias = document.getElementById('categorias-filtro');
  contenedorCategorias.innerHTML = '';
  const templateCategoria = document.getElementById('template-categoria-filtro');

  // Categorías disponibles
  categoriasDisponibles.forEach(categoria => {
    const clon = templateCategoria.content.cloneNode(true);
    const input = clon.querySelector('input');
    input.value = categoria.id;

    const span = clon.querySelector('.nombre-categoria');
    span.textContent = categoria.nombre;

    // Evento de cambio para los filtros
    input.addEventListener('change', function () {
      if (this.checked) {
        filtrosActivos.categorias.push(this.value);
      } else {
        filtrosActivos.categorias = filtrosActivos.categorias.filter(id => id !== this.value);
      }
      paginaActual = 1; // Pagina por defecto
      aplicarFiltros();
    });

    contenedorCategorias.appendChild(clon);
  });

  // Configurar rango de precios
  const precioRange = document.getElementById('precio-range');
  const precioMinSpan = document.getElementById('precio-min');
  const precioMaxSpan = document.getElementById('precio-max');
  const precioMinInput = document.getElementById('precio-min-input');
  const precioMaxInput = document.getElementById('precio-max-input');

  // Si hay productos disponibles, se configura el rango de precios
  if (todosLosProductos.length > 0) {
    const precios = todosLosProductos.map(p => p.precio);
    const precioMaxReal = Math.max(...precios);
    precioRange.max = precioMaxReal;
    precioRange.value = precioMaxReal;
    filtrosActivos.precioMax = precioMaxReal;
  }

  // Actualizar display del precio
  function actualizarDisplayPrecio() {
    precioMaxSpan.textContent = `$${formatearPrecio(precioRange.value)}`;
    precioMaxInput.value = precioRange.value;
    filtrosActivos.precioMax = parseInt(precioRange.value);
    paginaActual = 1;
    aplicarFiltros();
  }

  // Evento de cambio para el rango de precios
  precioRange.addEventListener('input', actualizarDisplayPrecio);

  // Evento de cambio para el input minimo
  precioMinInput.addEventListener('change', function () {
    const valor = parseInt(this.value) || 0;
    if (valor >= 0 && valor <= precioRange.value) {
      paginaActual = 1;
      aplicarFiltros();
    }
  });

  // Evento de cambio para el input maximo
  precioMaxInput.addEventListener('change', function () {
    const valor = parseInt(this.value) || parseInt(precioRange.max);
    if (valor >= (parseInt(precioMinInput.value) || 0)) {
      precioRange.value = Math.min(valor, parseInt(precioRange.max));
      actualizarDisplayPrecio();
    }
  });

  // Listeners para filtros de popularidad y orden
  document.getElementById('filtro-popularidad').addEventListener('change', function () {
    filtrosActivos.popularidad = this.value;
    paginaActual = 1;
    aplicarFiltros();
  });

  document.getElementById('ordenar-por').addEventListener('change', function () {
    filtrosActivos.orden = this.value;
    paginaActual = 1;
    aplicarFiltros();
  });

  document.getElementById('search-input').addEventListener('input', function () {
    filtrosActivos.busqueda = this.value.toLowerCase();
    paginaActual = 1;
    aplicarFiltros();
  });

  document.getElementById('limpiar-filtros').addEventListener('click', function () {
    limpiarFiltros();
  });
}

// Aplicar filtros
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

  // Ordenamiento
  if (filtrosActivos.popularidad === 'novedades') {
    productosFiltrados.sort((a, b) => b.id - a.id);
  } else if (filtrosActivos.popularidad === 'populares') {
    productosFiltrados.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  if (filtrosActivos.orden === 'precio-asc') {
    productosFiltrados.sort((a, b) => a.precio - b.precio);
  } else if (filtrosActivos.orden === 'precio-desc') {
    productosFiltrados.sort((a, b) => b.precio - a.precio);
  } else if (filtrosActivos.orden === 'novedades') {
    productosFiltrados.sort((a, b) => b.id - a.id);
  }

  mostrarProductosPaginados(productosFiltrados);
}

// Mostrar productos paginados
function mostrarProductosPaginados(productosFiltrados) {
  const totalProductos = productosFiltrados.length;
  const totalPaginas = Math.ceil(totalProductos / productosPorPagina);

  if (paginaActual > totalPaginas && totalPaginas > 0) {
    paginaActual = totalPaginas;
  } else if (totalPaginas === 0) {
    paginaActual = 1;
  }

  // Inicio y fin de la pagina actual
  const inicio = (paginaActual - 1) * productosPorPagina;
  const fin = inicio + productosPorPagina;
  const productosPagina = productosFiltrados.slice(inicio, fin);

  mostrarProductos(productosPagina, totalProductos);
  mostrarPaginacion(totalPaginas, totalProductos);
}

// Mostrar productos
function mostrarProductos(productos, totalProductos) {
  const contenedor = document.getElementById('productos-container');
  const contador = document.getElementById('contador-productos');
  const template = document.getElementById('template-producto-card');
  const templateNoProductos = document.getElementById('template-no-productos');

  // Inicio y fin de la pagina actual
  const inicio = (paginaActual - 1) * productosPorPagina + 1;
  const fin = Math.min(paginaActual * productosPorPagina, totalProductos);

  // Contador de productos
  if (totalProductos === 0) {
    contador.textContent = 'No se encontraron productos';
  } else {
    contador.textContent = `Mostrando ${inicio}-${fin} de ${totalProductos} productos`;
  }

  // Insercion de productos en el contenedor
  contenedor.innerHTML = '';

  // Si no hay productos, mostrar template por defecto
  if (!productos || productos.length === 0) {
    const clon = templateNoProductos.content.cloneNode(true);
    const btnLimpiar = clon.querySelector('.btn-limpiar-filtros');
    if (btnLimpiar) btnLimpiar.addEventListener('click', limpiarFiltros);
    contenedor.appendChild(clon);
    return;
  }

  // Por cada producto, crear un template
  productos.forEach(producto => {
    const categoria = categoriasDisponibles.find(c => c.id === producto.categoriaID);
    const nombreCategoria = categoria ? categoria.nombre : 'Joyas únicas';

    const clon = template.content.cloneNode(true);

    const imagen = clon.querySelector('.imagen-producto');
    imagen.src = producto.imagenURL || '/static/img/placeholder.jpg';
    imagen.alt = producto.nombre;

    const enlace = clon.querySelector('.enlace-producto');
    enlace.href = `/producto/${producto.id}`;

    clon.querySelector('.nombre-producto').textContent = producto.nombre;
    clon.querySelector('.categoria-producto').textContent = nombreCategoria;
    clon.querySelector('.precio-producto').textContent = `$${formatearPrecio(producto.precio)}`;

    const btnCarrito = clon.querySelector('.btn-agregar-carrito');
    btnCarrito.setAttribute('data-producto-id', producto.id);

    const iconCarrito = clon.querySelector('.icon-carrito');

    // Si el producto no tiene stock, deshabilitar el boton
    if (producto.stock === 0) {
      btnCarrito.disabled = true;
      iconCarrito.textContent = 'remove_shopping_cart';
      clon.querySelector('.sin-stock').classList.remove('hidden');
    } else {
      iconCarrito.textContent = 'add_shopping_cart';
    }

    const btnWishlist = clon.querySelector('.btn-wishlist');
    btnWishlist.setAttribute('data-producto-id', producto.id);
    const enWishlist = estaEnWishlist(producto.id);
    if (enWishlist) btnWishlist.classList.add('active');

    const iconWishlist = clon.querySelector('.icon-wishlist');
    iconWishlist.textContent = enWishlist ? 'favorite' : 'favorite_border';

    contenedor.appendChild(clon);
  });

}

// Funcion de mostrar paginacion
function mostrarPaginacion(totalPaginas, totalProductos) {
  const contenedor = document.getElementById('paginacion-container');
  contenedor.innerHTML = '';

  if (totalPaginas <= 1) {
    return;
  }

  // Templates de paginacion
  const templateBtn = document.getElementById('template-paginacion-btn');
  const templateEllipsis = document.getElementById('template-paginacion-ellipsis');

  // Boton Anterior
  const btnAnterior = templateBtn.content.cloneNode(true).querySelector('button');
  btnAnterior.textContent = 'Anterior';
  if (paginaActual === 1) {
    btnAnterior.disabled = true;
  } else {
    btnAnterior.addEventListener('click', () => cambiarPagina(paginaActual - 1));
  }
  contenedor.appendChild(btnAnterior);

  // Cantidad de paginas a mostrar
  const paginasAMostrar = generarNumerosPagina(paginaActual, totalPaginas);

  // Por cada pagina, crear un boton
  paginasAMostrar.forEach(numero => {
    if (numero === '...') {
      const ellipsis = templateEllipsis.content.cloneNode(true);
      contenedor.appendChild(ellipsis);
    } else {
      const btn = templateBtn.content.cloneNode(true).querySelector('button');
      btn.textContent = numero;
      if (numero === paginaActual) {
        btn.classList.add('paginacion-btn-active');
      }
      btn.addEventListener('click', () => cambiarPagina(numero));
      contenedor.appendChild(btn);
    }
  });

  // Boton Siguiente
  const btnSiguiente = templateBtn.content.cloneNode(true).querySelector('button');
  btnSiguiente.textContent = 'Siguiente';
  if (paginaActual === totalPaginas) {
    btnSiguiente.disabled = true;
  } else {
    btnSiguiente.addEventListener('click', () => cambiarPagina(paginaActual + 1));
  }
  contenedor.appendChild(btnSiguiente);
}

// Generar numeros de paginas
function generarNumerosPagina(paginaActual, totalPaginas) {
  const paginas = []; // Lista de paginas
  const paginasALaVista = 5; // Cantidad de paginas a mostrar

  // Si la cantidad de paginas es menor o igual a la cantidad de paginas a mostrar, mostrar todas las paginas
  if (totalPaginas <= paginasALaVista) {
    for (let i = 1; i <= totalPaginas; i++) {
      paginas.push(i);
    }
  } else {
    if (paginaActual <= 3) {
      for (let i = 1; i <= 4; i++) {
        paginas.push(i);
      }
      paginas.push('...');
      paginas.push(totalPaginas);
    } else if (paginaActual >= totalPaginas - 2) {
      paginas.push(1);
      paginas.push('...');
      for (let i = totalPaginas - 3; i <= totalPaginas; i++) {
        paginas.push(i);
      }
    } else {
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

// Funcion de cambiar pagina
function cambiarPagina(nuevaPagina) {
  paginaActual = nuevaPagina;
  aplicarFiltros();
  window.scrollTo({
    top: document.getElementById('productos-container').offsetTop - 100,
    behavior: 'smooth'
  });
}

// Funcion de limpiar filtros
function limpiarFiltros() {
  document.querySelectorAll('.categoria-checkbox').forEach(checkbox => {
    checkbox.checked = false;
  });

  const precioMaxReal = todosLosProductos.length > 0 ? Math.max(...todosLosProductos.map(p => p.precio)) : 75000;
  const precioRange = document.getElementById('precio-range');
  precioRange.value = precioMaxReal;

  document.getElementById('precio-min-input').value = '';
  document.getElementById('precio-max-input').value = '';
  document.getElementById('precio-max').textContent = `$${formatearPrecio(precioMaxReal)}`;

  document.getElementById('filtro-popularidad').value = 'todos';
  document.getElementById('ordenar-por').value = 'relevancia';
  document.getElementById('search-input').value = '';

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

// Funcion de mostrar error
function mostrarError(mensaje) {
  const contenedor = document.getElementById('productos-container');
  const templateError = document.getElementById('template-error-productos');
  contenedor.innerHTML = '';

  // Clonar template
  const clon = templateError.content.cloneNode(true);
  clon.querySelector('.mensaje-error').textContent = mensaje;
  clon.querySelector('.btn-reintentar').addEventListener('click', cargarDatosIniciales);

  contenedor.appendChild(clon);
}

// Funcion de agregar al carrito
function agregarAlCarrito(productoId) {
  // Boton de agregar al carrito
  const boton = document.querySelector(`[data-producto-id="${productoId}"]`);
  if (!boton) return;

  // Icono del boton
  const icono = boton.querySelector('.material-symbols-outlined');
  const textoIconoOriginal = icono ? icono.textContent : 'add_shopping_cart';

  // Deshabilitar boton
  boton.disabled = true;
  if (icono) icono.textContent = 'hourglass_top';
  boton.classList.add('opacity-70');

  (async () => {
    try {
      const form = new FormData();
      form.append('productoID', productoId);
      form.append('cantidad', '1');

      const respuesta = await fetch('/carrito/agregar-producto', {
        method: 'POST',
        body: form,
        credentials: 'same-origin'
      });

      // Si la respuesta es exitosa, agregar el producto al carrito
      if (respuesta.status === 201 || respuesta.ok) {
        if (icono) icono.textContent = 'check';
        boton.classList.add('bg-green-500');
        return;
      }

      // Si la respuesta es 401 o 403, redirigir a la pagina de ingresar
      if (respuesta.status === 401 || respuesta.status === 403) {
        window.location.href = '/ingresar';
        return;
      }

      // Si la respuesta es 400, mostrar el error
      const errorBody = await respuesta.json().catch(() => ({}));
      alert(errorBody.detail || 'No se pudo agregar el producto al carrito');
    } catch (error) {
      alert('Error de red al agregar al carrito');
    } finally {
      try {
        boton.disabled = false;
        setTimeout(() => {
          if (icono) icono.textContent = textoIconoOriginal;
          boton.classList.remove('bg-green-500');
          boton.classList.remove('opacity-70');
        }, 800);
      } catch (e) { /* noop */ } // No hacer nada
    }
  })();
}

// Event delegation para botones de wishlist
document.addEventListener('click', async function (e) {
  const btnWishlist = e.target.closest('.btn-wishlist');
  if (btnWishlist) {
    e.preventDefault();
    const productoId = btnWishlist.getAttribute('data-producto-id');
    const icon = btnWishlist.querySelector('.material-symbols-outlined');
    const actualmenteActivo = btnWishlist.classList.contains('active');

    try {
      // Si el producto no esta en la wishlist, agregarlo
      if (!actualmenteActivo) {
        const form = new FormData();
        form.append('productoID', productoId);
        const respuesta = await fetch('/wishlist/agregar-producto', { method: 'POST', body: form, credentials: 'same-origin' });

        // Si la respuesta es exitosa, agregar el producto a la wishlist
        if (respuesta.status === 201) {
          agregarAWishlist(productoId);
          btnWishlist.classList.add('active');
          if (icon) icon.textContent = 'favorite';
          return;
        }

        // Si la respuesta es 401 o 403, redirigir a la pagina de ingresar
        if (respuesta.status === 401 || respuesta.status === 403) { window.location.href = '/ingresar'; return; }
        alternarWishlist(productoId);
        btnWishlist.classList.add('active');
        if (icon) icon.textContent = 'favorite';
      } else {
        // Si el producto esta en la wishlist, eliminarlo
        const respuesta = await fetch(`/wishlist/${productoId}`, { method: 'DELETE', credentials: 'same-origin' });
        if (respuesta.status === 204) {
          eliminarDeWishlist(productoId);
          btnWishlist.classList.remove('active');
          if (icon) icon.textContent = 'favorite_border';
          return;
        }

        // Si la respuesta es 401 o 403, redirigir a la pagina de ingresar
        if (respuesta.status === 401 || respuesta.status === 403) { window.location.href = '/ingresar'; return; }

        // Alternar la wishlist
        alternarWishlist(productoId);
        btnWishlist.classList.remove('active');
        if (icon) icon.textContent = 'favorite_border';
      }
    } catch (err) {
      // Error al alternar la wishlist
      alternarWishlist(productoId);
      // Alternar la wishlist
      const enWishlist = estaEnWishlist(productoId);
      btnWishlist.classList.toggle('active', enWishlist);
      if (icon) icon.textContent = enWishlist ? 'favorite' : 'favorite_border';
    }
  }
});

// Event delegation para botones de carrito
document.addEventListener('click', function (e) {
  // Boton de agregar al carrito
  const btn = e.target.closest && e.target.closest('.btn-agregar-carrito');
  if (!btn) return;
  e.preventDefault();
  const productoId = btn.getAttribute('data-producto-id');
  agregarAlCarrito(productoId);
});

// Inicialización
document.addEventListener('DOMContentLoaded', function () {
  cargarDatosIniciales();
});