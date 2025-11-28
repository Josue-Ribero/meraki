// Obtener el ID desde la URL, solicitar la API y actualizar el DOM
const cantidadEl = document.getElementById('cantidad');
const btnDisminuir = document.getElementById('btn-disminuir');
const btnAumentar = document.getElementById('btn-aumentar');
const btnCarrito = document.getElementById('agregar-carrito');
const mensajeSinStock = document.getElementById('mensaje-sin-stock');
let cantidadValor = 1;
let stockDisponible = 0;
let productoActualID = null;

// Función para actualizar el estado de los controles según el stock
function actualizarEstadoStock() {
  const tieneStock = stockDisponible > 0;

  // Habilitar/deshabilitar botones según el stock
  btnAumentar.disabled = !tieneStock || cantidadValor >= stockDisponible;
  btnDisminuir.disabled = !tieneStock || cantidadValor <= 1;
  btnCarrito.disabled = !tieneStock;

  // Mostrar/ocultar mensaje de sin stock
  if (!tieneStock) {
    mensajeSinStock.classList.remove('hidden');
  } else {
    mensajeSinStock.classList.add('hidden');
  }

  // Actualizar el texto del stock
  const stockElement = document.getElementById('stock');
  if (stockElement) {
    if (!tieneStock) {
      stockElement.textContent = 'Sin stock';
      stockElement.style.color = 'var(--color-error)';
    } else {
      stockElement.textContent = stockDisponible;
      stockElement.style.color = '';
    }
  }
}

// Controles de cantidad de producto
btnDisminuir.addEventListener('click', () => {
  if (cantidadValor > 1 && stockDisponible > 0) {
    cantidadValor--;
    cantidadEl.textContent = cantidadValor;
    actualizarEstadoStock();
  }
});

btnAumentar.addEventListener('click', () => {
  if (cantidadValor < stockDisponible && stockDisponible > 0) {
    cantidadValor++;
    cantidadEl.textContent = cantidadValor;
    actualizarEstadoStock();
  }
});

// Añadir al carrito
btnCarrito.addEventListener('click', async (e) => {
  e.preventDefault();

  // Verificar que haya stock antes de proceder
  if (stockDisponible <= 0) {
    alert('No hay stock disponible de este producto');
    return;
  }

  const cantidad = cantidadValor || 1;
  const formulario = new FormData();
  formulario.append('productoID', productoActualID);
  formulario.append('cantidad', cantidad);

  // Añadir al carrito
  try {
    const respuesta = await fetch('/carrito/agregar-producto', {
      method: 'POST',
      body: formulario,
      credentials: 'same-origin'
    });

    if (respuesta.status === 201 || respuesta.ok) {
      // Redirigir al carrito o mostrar mensaje
      window.location.href = '/carrito';
      return;
    }

    if (respuesta.status === 401 || respuesta.status === 403) {
      // Si no está autenticado, redirigir al login
      window.location.href = '/ingresar';
      return;
    }

    // Error en caso de no poder agregar un producto al carrito
    const errorCuerpo = await respuesta.json().catch(() => ({}));
    alert(errorCuerpo.detail || 'No se pudo agregar el producto al carrito');
  } catch (error) {
    console.error('Error al agregar al carrito', error);
    alert('Error de red al agregar al carrito');
  }
});

// Cargar el producto
async function cargarProducto() {
  const parametrosUrl = new URLSearchParams(window.location.search);
  let productoID = parametrosUrl.get('id');
  if (!productoID) {
    const partesRuta = window.location.pathname.split('/').filter(Boolean);
    const ultimo = partesRuta[partesRuta.length - 1];
    if (ultimo && /^\d+$/.test(ultimo)) productoID = ultimo;
  }

  // Validar productoID
  if (!productoID) {
    console.warn('No se encontró productoID en la URL. Añade ?id=123 o usa /.../123');
    return;
  }

  // Cargar el producto
  try {
    const respuesta = await fetch(`/productos/${productoID}`);
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
    const producto = await respuesta.json();

    // Rellenar campos básicos
    document.getElementById('titulo').textContent = producto.nombre || '';
    document.getElementById('descripcion').textContent = producto.descripcion || '';
    document.getElementById('sku').textContent = producto.sku || '';

    // Guardar stock disponible
    stockDisponible = producto.stock != null ? producto.stock : 0;
    document.getElementById('es-personalizable').textContent = producto.esPersonalizado ? 'Sí' : 'No';

    // Precio (formato COP)
    const precioEl = document.getElementById('precio');
    if (producto.precio != null) {
      precioEl.textContent = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(producto.precio);
    }

    // imagen (placeholder y precarga)
    const principal = document.getElementById('imagen-principal');
    const miniaturas = document.querySelector('.miniaturas');
    const logoSrc = '../../static/img/UI/logo.png';

    if (producto.imagenURL) {
      // Mostrar placeholder (logo) hasta que la imagen real termine de cargar
      principal.classList.remove('imagen-real');
      principal.src = logoSrc;
      principal.alt = producto.nombre || 'Producto';

      const cargadorImg = new Image();
      cargadorImg.onload = () => {
        // Al cargar correctamente, cambiar la src y marcar como imagen real
        principal.src = producto.imagenURL;
        principal.classList.add('imagen-real');
      };
      cargadorImg.onerror = () => {
        // Si falla, mantener placeholder y registrar el error
        console.warn('No se pudo cargar la imagen del producto:', producto.imagenURL);
        principal.alt = producto.nombre || 'Producto';
        principal.classList.remove('imagen-real');
      };
      cargadorImg.src = producto.imagenURL;

      if (miniaturas) miniaturas.innerHTML = '';
    } else {
      if (miniaturas) miniaturas.innerHTML = '';
      // Si no hay imagen, usar el logo y asegurar que no esté marcada como imagen real
      principal.src = logoSrc;
      principal.alt = 'Sin imagen';
      principal.classList.remove('imagen-real');
    }

    // Opciones (color y tamaño si vienen en CSV)
    if (producto.opcionesColor) {
      const colores = producto.opcionesColor.split(',').map(s => s.trim()).filter(Boolean);
      const selectorColor = document.getElementById('color');

      // Limpiar y añadir opción por defecto
      selectorColor.innerHTML = '';
      const opcionDefecto = document.createElement('option');
      opcionDefecto.textContent = 'Selecciona el color';
      selectorColor.appendChild(opcionDefecto);

      colores.forEach(color => {
        const opcion = document.createElement('option');
        opcion.textContent = color;
        selectorColor.appendChild(opcion);
      });
    }
    if (producto.opcionesTamano) {
      const tamanos = producto.opcionesTamano.split(',').map(s => s.trim()).filter(Boolean);
      const selectorTamano = document.getElementById('tamano');

      // Limpiar y añadir opción por defecto
      selectorTamano.innerHTML = '';
      const opcionDefecto = document.createElement('option');
      opcionDefecto.textContent = 'Selecciona el tamaño';
      selectorTamano.appendChild(opcionDefecto);

      tamanos.forEach(tamano => {
        const opcion = document.createElement('option');
        opcion.textContent = tamano;
        selectorTamano.appendChild(opcion);
      });
    }

    // Guardar el ID actual para enviar al carrito
    productoActualID = producto.id || productoID;

    // Actualizar el estado de los controles según el stock
    actualizarEstadoStock();

  } catch (error) {
    console.error('Error cargando producto:', error);
    document.getElementById('titulo').textContent = 'Producto no disponible';
    document.getElementById('descripcion').textContent = 'No fue posible cargar la información del producto.';

    // Deshabilitar controles en caso de error
    btnAumentar.disabled = true;
    btnDisminuir.disabled = true;
    btnCarrito.disabled = true;
  }
}

document.addEventListener('DOMContentLoaded', cargarProducto);