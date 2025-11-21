// - Obtener el ID desde la URL, solicitar la API y actualizar el DOM
const cantidadEl = document.getElementById('cantidad');
const btnDisminuir = document.getElementById('btn-disminuir');
const btnAumentar = document.getElementById('btn-aumentar');
let cantidadValor = 1;

// Controles de cantidad de producto
btnDisminuir.addEventListener('click', () => {
  if (cantidadValor > 1) { cantidadValor--; cantidadEl.textContent = cantidadValor; }
});
btnAumentar.addEventListener('click', () => {
  cantidadValor++; cantidadEl.textContent = cantidadValor;
});

// Añadir al carrito
document.getElementById('agregar-carrito').addEventListener('click', () => {
  location.reload();
});


// Cargar el producto
async function cargarProducto() {
  const urlParams = new URLSearchParams(window.location.search);
  let productoID = urlParams.get('id');
  if (!productoID) {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const last = pathParts[pathParts.length - 1];
    if (last && /^\d+$/.test(last)) productoID = last;
  }

  if (!productoID) {
    console.warn('No se encontró productoID en la URL. Añade ?id=123 o usa /.../123');
    return;
  }

  try {
    const resp = await fetch(`/productos/${productoID}`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const producto = await resp.json();

    // Rellenar campos básicos
    document.getElementById('titulo').textContent = producto.nombre || '';
    document.getElementById('descripcion').textContent = producto.descripcion || '';
    document.getElementById('sku').textContent = producto.sku || '';
    document.getElementById('stock').textContent = (producto.stock != null) ? producto.stock : '';
    document.getElementById('es-personalizable').textContent = producto.esPersonalizado ? 'Sí' : 'No';

    // Precio (formato COP)
    const precioEl = document.getElementById('precio');
    if (producto.precio != null) {
      precioEl.textContent = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(producto.precio);
    }

    // imagen (placeholder y precarga)
    const main = document.getElementById('imagen-principal');
    const thumbs = document.querySelector('.miniaturas');
    const logoSrc = '../../static/img/UI/logo.png';

    if (producto.imagenURL) {
      // Mostrar placeholder (logo) hasta que la imagen real termine de cargar
      main.classList.remove('imagen-real');
      main.src = logoSrc;
      main.alt = producto.nombre || 'Producto';

      const imgLoader = new Image();
      imgLoader.onload = () => {
        // Al cargar correctamente, cambiar la src y marcar como imagen real
        main.src = producto.imagenURL;
        main.classList.add('imagen-real');
      };
      imgLoader.onerror = () => {
        // Si falla, mantener placeholder y registrar el error
        console.warn('No se pudo cargar la imagen del producto:', producto.imagenURL);
        main.alt = producto.nombre || 'Producto';
        main.classList.remove('imagen-real');
      };
      imgLoader.src = producto.imagenURL;

      if (thumbs) thumbs.innerHTML = '';
    } else {
      if (thumbs) thumbs.innerHTML = '';
      // No hay imagen: usar el logo y asegurar que no esté marcada como imagen real
      main.src = logoSrc;
      main.alt = 'Sin imagen';
      main.classList.remove('imagen-real');
    }

    // opciones (color y tamaño si vienen en CSV)
    if (producto.opcionesColor) {
      const colors = producto.opcionesColor.split(',').map(s => s.trim()).filter(Boolean);
      const colorSelect = document.getElementById('color');
      colorSelect.innerHTML = '<option>Selecciona el color</option>' + colors.map(c => `<option>${c}</option>`).join('');
    }
    if (producto.opcionesTamano) {
      const sizes = producto.opcionesTamano.split(',').map(s => s.trim()).filter(Boolean);
      const sizeSelect = document.getElementById('tamano');
      sizeSelect.innerHTML = '<option>Selecciona el tamaño</option>' + sizes.map(s => `<option>${s}</option>`).join('');
    }

  } catch (error) {
    console.error('Error cargando producto:', error);
    document.getElementById('titulo').textContent = 'Producto no disponible';
    document.getElementById('descripcion').textContent = 'No fue posible cargar la información del producto.';
  }
}

document.addEventListener('DOMContentLoaded', cargarProducto);