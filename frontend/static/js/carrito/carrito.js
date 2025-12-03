// Lista vacia de carrito donde se insertaran los productos
let carrito = [];
// Paginación cliente-side
let paginaActual = 1;
const itemsPorPagina = 4;
// Envío por defecto de 8,900 COP si el pedido no pasa de 30,000 COP
const costoEnvio = (typeof window !== 'undefined' && window.envio != null) ? window.envio : 8900;

// Funcion para formatear la moneda a COP
function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(valor);
}

// Funcion para calcular el total de los productos
function calcularTotal() {
    let subtotal = 0;
    for (let item of carrito) {
        subtotal += item.precio * item.cantidad;
    }
    // Aplicar envío (si el subtotal es menor a 30,000 COP se cobra envío de 8900)
    const valorEnvio = (subtotal > 0 && subtotal < 30000) ? costoEnvio : 0;
    const total = subtotal + valorEnvio;

    // Actualizar vistas de subtotal, envío y total
    document.querySelector('.summary-row.total span:last-child').textContent = formatearMoneda(total);
    document.querySelector('.summary-row:first-child span:last-child').textContent = formatearMoneda(subtotal);
    const elementoEnvio = document.querySelector('.shipping');
    if (elementoEnvio) {
        elementoEnvio.textContent = valorEnvio === 0 ? 'Gratis' : formatearMoneda(valorEnvio);
        // Añadir clase para controlar estilos (free para gratis, paid para con costo)
        elementoEnvio.classList.toggle('free', valorEnvio === 0);
        elementoEnvio.classList.toggle('paid', valorEnvio !== 0);
    }
    return total;
}

// Funcion para renderizar el carrito
function renderizarCarrito() {
    const contenedorItems = document.querySelector('.cart-items');
    contenedorItems.innerHTML = '';

    // Obtener template
    const template = document.getElementById('template-carrito-item');
    if (!template) {
        return;
    }

    // Calcular paginado
    const totalItems = carrito.length;
    const totalPaginas = Math.max(1, Math.ceil(totalItems / itemsPorPagina));
    if (paginaActual > totalPaginas) paginaActual = totalPaginas;
    const inicio = (paginaActual - 1) * itemsPorPagina;
    const fin = inicio + itemsPorPagina;
    const itemsPagina = carrito.slice(inicio, fin);

    // Renderizar items en el carrito
    for (let item of itemsPagina) {
        const clon = template.content.cloneNode(true);

        const enlace = clon.querySelector('.item-link');
        const imagen = clon.querySelector('.item-image');
        const enlaceTitulo = clon.querySelector('.item-title-link');
        const valorPrecio = clon.querySelector('.item-price-value');
        const btnMenos = clon.querySelector('.quantity-btn.minus');
        const btnMas = clon.querySelector('.quantity-btn.plus');
        const displayCantidad = clon.querySelector('.quantity-display');
        const valorTotal = clon.querySelector('.item-total-value');
        const btnEliminar = clon.querySelector('.remove-btn');

        // Rellenar valores
        const productoHref = `/producto/${item.id}`;
        if (enlace) enlace.setAttribute('href', productoHref);
        if (enlaceTitulo) {
            enlaceTitulo.setAttribute('href', productoHref);
            enlaceTitulo.textContent = item.nombre;
        }
        if (imagen) { imagen.src = item.imagen; imagen.alt = item.nombre; }
        if (valorPrecio) valorPrecio.textContent = formatearMoneda(item.precio);
        if (btnMenos) btnMenos.dataset.id = String(item.id);
        if (btnMas) btnMas.dataset.id = String(item.id);
        if (displayCantidad) { displayCantidad.dataset.id = String(item.id); displayCantidad.textContent = String(item.cantidad); }
        if (valorTotal) valorTotal.textContent = formatearMoneda(item.precio * item.cantidad);
        if (valorTotal) valorTotal.dataset.id = String(item.id);
        if (btnEliminar) btnEliminar.dataset.id = String(item.id);

        contenedorItems.appendChild(clon);
    }

    // si no hay items globalmente, mostrar mensaje
    if (!carrito || carrito.length === 0) {
        contenedorItems.innerHTML = '<div class="cart-loading">Tu carrito está vacío.</div>';
    }

    // renderizar controles de paginación
    const contenedorPaginacion = document.getElementById('cart-pagination');
    // Si no hay paginación, no renderizar
    if (contenedorPaginacion) {
        contenedorPaginacion.innerHTML = '';
        // Si hay más de un item, renderizar paginación
        if (totalItems > itemsPorPagina) {
            const anterior = document.createElement('button');
            anterior.className = 'page-btn';
            anterior.textContent = 'Anterior';
            anterior.disabled = paginaActual === 1;
            anterior.addEventListener('click', () => { paginaActual = Math.max(1, paginaActual - 1); renderizarCarrito(); });
            contenedorPaginacion.appendChild(anterior);

            // Renderizar botones de paginación
            for (let i = 1; i <= totalPaginas; i++) {
                const b = document.createElement('button');
                b.className = 'page-btn' + (i === paginaActual ? ' active' : '');
                b.textContent = String(i);
                b.disabled = i === paginaActual;
                b.addEventListener('click', () => { paginaActual = i; renderizarCarrito(); });
                contenedorPaginacion.appendChild(b);
            }

            // Renderizar botón siguiente
            const siguiente = document.createElement('button');
            siguiente.className = 'page-btn';
            siguiente.textContent = 'Siguiente';
            siguiente.disabled = paginaActual === totalPaginas;
            siguiente.addEventListener('click', () => { paginaActual = Math.min(totalPaginas, paginaActual + 1); renderizarCarrito(); });
            contenedorPaginacion.appendChild(siguiente);
        }
    }

    asignarEventos();
}

// Funcion para asignar eventos del carrito
function asignarEventos() {
    // Cantidad de productos
    document.querySelectorAll('.quantity-btn.minus').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            const item = carrito.find(i => i.id === id);
            // Si el item existe y su cantidad es mayor a 1, restar 1
            if (item && item.cantidad > 1) {
                const nueva = item.cantidad - 1;
                try {
                    // Realizar la peticion al backend para actualizar la cantidad
                    const resp = await fetch(`/carrito/actualizar-cantidad/${id}`, {
                        method: 'PATCH',
                        credentials: 'same-origin',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: new URLSearchParams({ cantidad: nueva })
                    });
                    // Si el usuario no esta autenticado, redirigir a la pagina de login
                    if (resp.status === 401 || resp.status === 403) { window.location.href = '/ingresar'; return; }
                    // Si el usuario no tiene permisos, redirigir a la pagina de inicio
                    if (!resp.ok) throw new Error('HTTP ' + resp.status);

                    // Actualizar el item en el DOM
                    const d = await resp.json();
                    item.cantidad = d.cantidad;
                    item.subtotal = d.subtotal || (item.precio * item.cantidad);
                    actualizarItemEnDOM(id);
                    calcularTotal();
                } catch (err) { alert('No se pudo actualizar la cantidad'); }
            }
        });
    });

    // Cantidad de productos
    document.querySelectorAll('.quantity-btn.plus').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            const item = carrito.find(i => i.id === id);
            if (item) {
                const nueva = item.cantidad + 1;
                try {
                    // Llamado del endpoint para actualizar la cantidad
                    const resp = await fetch(`/carrito/actualizar-cantidad/${id}`, {
                        method: 'PATCH',
                        credentials: 'same-origin',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: new URLSearchParams({ cantidad: nueva })
                    });
                    // Si el usuario no esta autenticado, redirigir a la pagina de login
                    if (resp.status === 401 || resp.status === 403) { window.location.href = '/ingresar'; return; }
                    // Si el usuario no tiene permisos, redirigir a la pagina de inicio
                    if (!resp.ok) throw new Error('HTTP ' + resp.status);

                    // Actualizar el item en el DOM
                    const d = await resp.json();
                    item.cantidad = d.cantidad;
                    item.subtotal = d.subtotal || (item.precio * item.cantidad);
                    actualizarItemEnDOM(id);
                    calcularTotal();
                } catch (err) { alert('No se pudo actualizar la cantidad'); }
            }
        });
    });

    // Eliminar un producto del carrito
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            try {

                // Llamado del endpoint para eliminar el producto
                const resp = await fetch(`/carrito/${id}`, { method: 'DELETE', credentials: 'same-origin' });
                // Si el usuario no esta autenticado, redirigir a la pagina de login
                if (resp.status === 401 || resp.status === 403) { window.location.href = '/ingresar'; return; }
                // Si el usuario no tiene permisos, redirigir a la pagina de inicio
                if (!resp.ok) throw new Error('HTTP ' + resp.status);

                // Actualizar el carrito
                carrito = carrito.filter(item => item.id !== id);
                // ajustar pagina actual si quedó fuera de rango
                const totalPaginas = Math.max(1, Math.ceil(carrito.length / itemsPorPagina));
                if (paginaActual > totalPaginas) paginaActual = totalPaginas;
                renderizarCarrito();
                calcularTotal();
            } catch (err) { alert('No se pudo eliminar el producto'); }
        });
    });
}

// Actualizar un item del carrito
function actualizarItemEnDOM(id) {
    const item = carrito.find(i => i.id === id);
    // Si el item existe, actualizar el DOM
    if (item) {
        const displayCantidad = document.querySelector(`.quantity-display[data-id="${id}"]`);
        if (displayCantidad) displayCantidad.textContent = item.cantidad;
        const valorTotal = document.querySelector(`.item-total-value[data-id="${id}"]`);
        if (valorTotal) valorTotal.textContent = formatearMoneda(item.precio * item.cantidad);
    }
}

// Cargar el carrito
async function cargarCarrito() {
    try {
        const resp = await fetch('/carrito/mi-carrito', { credentials: 'same-origin' });
        // Si el usuario no esta autenticado, redirigir a la pagina de login
        if (resp.status === 401 || resp.status === 403) {
            window.location.href = '/ingresar';
            return;
        }
        // Si no hay carrito (404) tratamos como carrito vacío
        if (resp.status === 404) {
            carrito = [];
            document.querySelector('.cart-items').innerHTML = '<div class="cart-loading">Tu carrito está vacío.</div>';
            calcularTotal();
            return;
        }

        // Si el usuario no tiene permisos, redirigir a la pagina de inicio
        if (!resp.ok) throw new Error('HTTP ' + resp.status);

        const datos = await resp.json();
        // datos es un array de DetalleCarrito. Intentar mapear al formato usado por la UI
        carrito = datos.map(d => {
            const prod = d.producto || {};
            return {
                id: d.productoID,
                detalleID: d.id,
                nombre: prod.nombre || d.nombre || prod.titulo || 'Producto',
                precio: d.precioUnidad || prod.precio || 0,
                cantidad: d.cantidad || 1,
                imagen: prod.imagenURL || (prod.imagen && prod.imagen.url) || '/static/img/UI/logo.png',
                subtotal: d.subtotal || ((d.precioUnidad || prod.precio || 0) * (d.cantidad || 1))
            };
        });

        // Si la respuesta del carrito no tiene la info completa del producto, intentar obtenerla desde la API de productos para mostrar nombre/imagen reales.
        const necesitaFetch = carrito.filter(i => !i.nombre || i.nombre === 'Producto' || i.imagen === '/static/img/UI/logo.png');
        if (necesitaFetch.length) {
            // Llamado del endpoint para obtener la info del producto
            await Promise.all(necesitaFetch.map(async (it) => {
                try {
                    // Si el producto no tiene precio, usar el precio del carrito
                    const respProd = await fetch(`/productos/${it.id}`);
                    // Si el producto no existe, usar el nombre del carrito
                    if (!respProd.ok) return;
                    const p = await respProd.json();
                    if (!p) return;
                    // Actualizar campos si vienen disponibles
                    it.nombre = p.nombre || it.nombre;
                    it.imagen = p.imagenURL || it.imagen;
                    it.precio = (it.precio && it.precio > 0) ? it.precio : (p.precio || it.precio);
                    it.subtotal = (it.precio * it.cantidad) || it.subtotal;
                } catch (err) {
                    console.warn('No se pudo obtener producto', it.id, err);
                }
            }));
        }

        // Si el carrito está vacío, mostrar mensaje
        if (!carrito || carrito.length === 0) {
            document.querySelector('.cart-items').innerHTML = '<div class="cart-loading">Tu carrito está vacío.</div>';
            // Si el carrito tiene items, renderizar
        } else {
            renderizarCarrito();
        }
        // Calcular el total del carrito
        calcularTotal();
    } catch (err) {
        document.querySelector('.cart-items').innerHTML = '<p>No se pudo cargar el carrito.</p>';
    }
}

// Cargar el carrito al cargar la pagina
document.addEventListener('DOMContentLoaded', () => {
    cargarCarrito();
});