document.addEventListener('DOMContentLoaded', async () => {
  const galeria = document.getElementById('galeria');
  const paginacionContainer = document.getElementById('paginacion-container');

  // Variables globales de productos y paginacion
  let productosGlobal = [];
  let paginaActual = 1;
  const itemsPorPagina = 4;

  // Funcion para renderizar estado vacio
  function renderizarVacio() {
    galeria.innerHTML = '';
    paginacionContainer.innerHTML = '';
    const template = document.getElementById('template-wishlist-vacio');
    if (template) {
      galeria.appendChild(template.content.cloneNode(true));
    }
  }

  // Funcion para renderizar estado de carga
  function renderizarCargando() {
    galeria.innerHTML = '';
    paginacionContainer.innerHTML = '';
    const template = document.getElementById('template-wishlist-loading');
    if (template) {
      galeria.appendChild(template.content.cloneNode(true));
    }
  }

  try {
    // Mostrar estado de carga inicial
    renderizarCargando();
    const respuesta = await fetch('/wishlist/mi-wishlist', { credentials: 'same-origin' });

    // Si no esta autenticado, redirigir
    if (respuesta.status === 401 || respuesta.status === 403) {
      window.location.href = '/ingresar';
      return;
    }

    // Si no se encuentra la wishlist
    if (respuesta.status === 404) {
      renderizarVacio();
      return;
    }

    // Fallback a localStorage si falla el servidor
    if (!respuesta.ok) {
      const local = localStorage.getItem('wishlist');
      if (!local) { renderizarVacio(); return; }
      const ids = JSON.parse(local);
      if (!Array.isArray(ids) || ids.length === 0) { renderizarVacio(); return; }
      await cargarProductosDesdeIds(ids);
      return;
    }

    // Procesar items del servidor
    const items = await respuesta.json();
    if (!items || items.length === 0) {
      renderizarVacio();
      return;
    }

    const ids = items.map(i => i.productoID);
    await cargarProductosDesdeIds(ids);
  } catch (error) {
    renderizarVacio();
  }

  // Cargar detalles de productos desde sus IDs
  async function cargarProductosDesdeIds(ids) {
    // Obtener categorias para mostrar nombres
    const respuestaCategorias = await fetch('/categorias/');
    let mapaCategorias = {};
    if (respuestaCategorias.ok) {
      const categorias = await respuestaCategorias.json();
      categorias.forEach(c => { mapaCategorias[c.id] = c.nombre; });
    }

    // Fetch paralelo de productos
    const peticiones = ids.map(id => fetch(`/productos/${id}`));
    const respuestas = await Promise.all(peticiones);
    productosGlobal = [];
    for (let i = 0; i < respuestas.length; i++) {
      const r = respuestas[i];
      if (r.ok) {
        const p = await r.json();
        // Añadir nombre de categoría al objeto producto para facilitar renderizado
        p.nombreCategoria = mapaCategorias[p.categoriaID] || '';
        productosGlobal.push(p);
      }
    }

    if (productosGlobal.length === 0) { renderizarVacio(); return; }

    renderizarPagina(1);
  }

  // Renderizar una pagina especifica
  function renderizarPagina(pagina) {
    paginaActual = pagina;
    const totalItems = productosGlobal.length;
    const totalPaginas = Math.ceil(totalItems / itemsPorPagina);

    // Validar limites de pagina
    if (paginaActual > totalPaginas) paginaActual = totalPaginas;
    if (paginaActual < 1) paginaActual = 1;

    // Calcular slice de productos
    const inicio = (paginaActual - 1) * itemsPorPagina;
    const fin = inicio + itemsPorPagina;
    const itemsPagina = productosGlobal.slice(inicio, fin);

    renderizarItems(itemsPagina);
    renderizarControlesPaginacion(totalPaginas);
  }

  // Renderizar las tarjetas de productos
  function renderizarItems(productos) {
    galeria.innerHTML = '';
    const template = document.getElementById('template-wishlist-item');

    // Helper para formatear precio
    function formatearPrecio(precio) {
      if (precio === null || precio === undefined) return '0';
      const precioString = Math.floor(Number(precio)).toString();
      return precioString.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    productos.forEach(p => {
      const clon = template.content.cloneNode(true);

      const imagen = clon.querySelector('.imagen-producto');
      imagen.src = p.imagenURL || '/static/img/placeholder.jpg';
      imagen.alt = p.nombre;

      const enlace = clon.querySelector('.enlace-producto');
      enlace.href = `/producto/${p.id}`;

      clon.querySelector('.nombre-producto').textContent = p.nombre;
      clon.querySelector('.categoria-producto').textContent = p.nombreCategoria;
      clon.querySelector('.precio-producto').textContent = `$${formatearPrecio(p.precio)}`;

      const btnMover = clon.querySelector('.btn-mover-carrito');
      btnMover.setAttribute('data-id', p.id);

      const btnEliminar = clon.querySelector('.btn-eliminar');
      btnEliminar.setAttribute('data-id', p.id);

      galeria.appendChild(clon);
    });

    asignarEventos();
  }

  // Renderizar controles de paginacion
  function renderizarControlesPaginacion(totalPaginas) {
    paginacionContainer.innerHTML = '';
    if (totalPaginas <= 1) return;

    const templateBtn = document.getElementById('template-paginacion-btn');
    const templateEllipsis = document.getElementById('template-paginacion-ellipsis');

    // Botón Anterior
    const btnAnterior = templateBtn.content.cloneNode(true).querySelector('button');
    btnAnterior.textContent = 'Anterior';
    if (paginaActual === 1) {
      btnAnterior.disabled = true;
      btnAnterior.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
      btnAnterior.addEventListener('click', () => renderizarPagina(paginaActual - 1));
    }
    paginacionContainer.appendChild(btnAnterior);

    // Números de página
    const paginas = generarNumerosPagina(paginaActual, totalPaginas);
    paginas.forEach(numero => {
      if (numero === '...') {
        paginacionContainer.appendChild(templateEllipsis.content.cloneNode(true));
      } else {
        const btn = templateBtn.content.cloneNode(true).querySelector('button');
        btn.textContent = numero;
        if (numero === paginaActual) {
          btn.classList.add('bg-color-principal', 'text-white', 'border-color-principal');
          btn.classList.remove('hover:bg-gray-100', 'text-color-texto-oscuro');
        } else {
          btn.addEventListener('click', () => renderizarPagina(numero));
        }
        paginacionContainer.appendChild(btn);
      }
    });

    // Botón Siguiente
    const btnSiguiente = templateBtn.content.cloneNode(true).querySelector('button');
    btnSiguiente.textContent = 'Siguiente';
    if (paginaActual === totalPaginas) {
      btnSiguiente.disabled = true;
      btnSiguiente.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
      btnSiguiente.addEventListener('click', () => renderizarPagina(paginaActual + 1));
    }
    paginacionContainer.appendChild(btnSiguiente);
  }

  // Generar array de numeros de pagina con ellipsis
  function generarNumerosPagina(actual, total) {
    const paginas = [];
    const delta = 2; // Páginas a mostrar a izquierda y derecha de la actual

    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= actual - delta && i <= actual + delta)) {
        paginas.push(i);
      } else if (paginas[paginas.length - 1] !== '...') {
        paginas.push('...');
      }
    }
    return paginas;
  }

  // Asignar eventos a botones de accion
  function asignarEventos() {
    // Evento eliminar
    document.querySelectorAll('.btn-eliminar').forEach(boton => {
      boton.addEventListener('click', async (e) => {
        const id = boton.getAttribute('data-id');
        try {
          const respuesta = await fetch(`/wishlist/${id}`, { method: 'DELETE', credentials: 'same-origin' });
          if (respuesta.status === 204) {
            eliminarProductoGlobal(id);
            return;
          }
          if (respuesta.status === 401 || respuesta.status === 403) { window.location.href = '/ingresar'; return; }
          const error = await respuesta.json().catch(() => ({}));
          alert(error.detail || 'No se pudo eliminar de la wishlist');
        } catch (error) {
          eliminarProductoGlobal(id);
        }
      });
    });

    // Evento mover al carrito
    document.querySelectorAll('.btn-mover-carrito').forEach(boton => {
      boton.addEventListener('click', async (e) => {
        const id = boton.getAttribute('data-id');
        const icon = boton.querySelector('.material-symbols-outlined');
        const textoIconoOriginal = icon ? icon.textContent : 'add_shopping_cart';

        boton.disabled = true;
        if (icon) icon.textContent = 'hourglass_top';

        try {
          const respuesta = await fetch(`/wishlist/mover-al-carrito/${id}`, { method: 'POST', credentials: 'same-origin' });

          if (respuesta.ok) {
            eliminarProductoGlobal(id);
            return;
          }

          if (respuesta.status === 401 || respuesta.status === 403) { window.location.href = '/ingresar'; return; }

          const error = await respuesta.json().catch(() => ({}));
          alert(error.detail || 'No se pudo mover al carrito');
        } catch (error) {
          alert('Error de red. Intenta nuevamente.');
        } finally {
          try {
            if (document.body.contains(boton)) {
              boton.disabled = false;
              if (icon) icon.textContent = textoIconoOriginal;
            }
          } catch (e) { }
        }
      });
    });
  }

  // Eliminar producto del estado global y actualizar UI
  function eliminarProductoGlobal(id) {
    // Eliminar del array global
    productosGlobal = productosGlobal.filter(p => String(p.id) !== String(id));

    // Actualizar localStorage
    const local = obtenerWishlistLocal();
    if (local) {
      const filtrado = local.filter(i => String(i) !== String(id));
      localStorage.setItem('wishlist', JSON.stringify(filtrado));
    }

    // Notificar a otros componentes
    window.dispatchEvent(new CustomEvent('wishlistChanged', { detail: { productId: id, action: 'removed' } }));

    // Re-renderizar página actual
    if (productosGlobal.length === 0) {
      renderizarVacio();
    } else {
      // Si la página actual queda vacía (ej: borramos el único item de la pág 2), ir a la anterior
      const totalPaginas = Math.ceil(productosGlobal.length / itemsPorPagina);
      if (paginaActual > totalPaginas) paginaActual = totalPaginas;
      renderizarPagina(paginaActual);
    }
  }

  // Helper para obtener wishlist de localStorage
  function obtenerWishlistLocal() {
    try { return JSON.parse(localStorage.getItem('wishlist') || '[]'); } catch (e) { return []; }
  }
});