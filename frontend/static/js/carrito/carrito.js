// Lista vacia de carrito donde se insertaran los productos
let carrito = [];
// Paginación cliente-side
let carritoPaginaActual = 1;
const carritoItemsPorPagina = 4;
// Envío por defecto: si no se define en la plantilla será COP 8,900
const envio = (typeof window !== 'undefined' && window.envio != null) ? window.envio : 8900;

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
    // Aplicar envío: si el subtotal es menor a 30,000 COP se cobra envío (8900 por defecto)
    const envioVal = (subtotal > 0 && subtotal < 30000) ? envio : 0;
    const total = subtotal + envioVal;

    // Actualizar vistas: subtotal, envío y total
    document.querySelector('.summary-row.total span:last-child').textContent = formatearMoneda(total);
    document.querySelector('.summary-row:first-child span:last-child').textContent = formatearMoneda(subtotal);
    const envioEl = document.querySelector('.shipping');
    if (envioEl) {
        envioEl.textContent = envioVal === 0 ? 'Gratis' : formatearMoneda(envioVal);
        // Añadir clase para controlar estilos: 'free' cuando es gratis, 'paid' cuando tiene costo
        envioEl.classList.toggle('free', envioVal === 0);
        envioEl.classList.toggle('paid', envioVal !== 0);
    }
    return total;
}

function renderizarCarrito() {
    const contenedorItems = document.querySelector('.cart-items');
    contenedorItems.innerHTML = '';

    const template = document.getElementById('cart-item-template');
    if (!template) {
        console.error('No se encontró #cart-item-template en el HTML');
        return;
    }

    // calcular paginado
    const totalItems = carrito.length;
    const totalPaginas = Math.max(1, Math.ceil(totalItems / carritoItemsPorPagina));
    if (carritoPaginaActual > totalPaginas) carritoPaginaActual = totalPaginas;
    const inicio = (carritoPaginaActual - 1) * carritoItemsPorPagina;
    const fin = inicio + carritoItemsPorPagina;
    const paginaItems = carrito.slice(inicio, fin);

    for (let item of paginaItems) {
        const clone = template.content.cloneNode(true);

        const link = clone.querySelector('.item-link');
        const img = clone.querySelector('.item-image');
        const titleLink = clone.querySelector('.item-title-link');
        const priceValue = clone.querySelector('.item-price-value');
        const qtyMinus = clone.querySelector('.quantity-btn.minus');
        const qtyPlus = clone.querySelector('.quantity-btn.plus');
        const qtyDisplay = clone.querySelector('.quantity-display');
        const totalValue = clone.querySelector('.item-total-value');
        const removeBtn = clone.querySelector('.remove-btn');

        // Rellenar valores
        const productoHref = `/producto/${item.id}`;
        if (link) link.setAttribute('href', productoHref);
        if (titleLink) {
            titleLink.setAttribute('href', productoHref);
            titleLink.textContent = item.nombre;
        }
        if (img) { img.src = item.imagen; img.alt = item.nombre; }
        if (priceValue) priceValue.textContent = formatearMoneda(item.precio);
        if (qtyMinus) qtyMinus.dataset.id = String(item.id);
        if (qtyPlus) qtyPlus.dataset.id = String(item.id);
        if (qtyDisplay) { qtyDisplay.dataset.id = String(item.id); qtyDisplay.textContent = String(item.cantidad); }
        if (totalValue) totalValue.textContent = formatearMoneda(item.precio * item.cantidad);
        if (totalValue) totalValue.dataset.id = String(item.id);
        if (removeBtn) removeBtn.dataset.id = String(item.id);

        contenedorItems.appendChild(clone);
    }

    // si no hay items globalmente, mostrar mensaje
    if (!carrito || carrito.length === 0) {
        contenedorItems.innerHTML = '<div class="cart-loading">Tu carrito está vacío.</div>';
    }

    // renderizar controles de paginación
    const pagCont = document.getElementById('cart-pagination');
    if (pagCont) {
        pagCont.innerHTML = '';
        if (totalItems > carritoItemsPorPagina) {
            const prev = document.createElement('button');
            prev.className = 'page-btn';
            prev.textContent = 'Anterior';
            prev.disabled = carritoPaginaActual === 1;
            prev.addEventListener('click', () => { carritoPaginaActual = Math.max(1, carritoPaginaActual - 1); renderizarCarrito(); });
            pagCont.appendChild(prev);

            for (let i = 1; i <= totalPaginas; i++) {
                const b = document.createElement('button');
                b.className = 'page-btn' + (i === carritoPaginaActual ? ' active' : '');
                b.textContent = String(i);
                b.disabled = i === carritoPaginaActual;
                b.addEventListener('click', () => { carritoPaginaActual = i; renderizarCarrito(); });
                pagCont.appendChild(b);
            }

            const next = document.createElement('button');
            next.className = 'page-btn';
            next.textContent = 'Siguiente';
            next.disabled = carritoPaginaActual === totalPaginas;
            next.addEventListener('click', () => { carritoPaginaActual = Math.min(totalPaginas, carritoPaginaActual + 1); renderizarCarrito(); });
            pagCont.appendChild(next);
        }
    }

    asignarEventos();
}

function asignarEventos() {
    // cantidad - llamar al backend para actualizar
    document.querySelectorAll('.quantity-btn.minus').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            const item = carrito.find(i => i.id === id);
            if (item && item.cantidad > 1) {
                const nueva = item.cantidad - 1;
                try {
                    const resp = await fetch(`/carrito/actualizar-cantidad/${id}`, {
                        method: 'PATCH',
                        credentials: 'same-origin',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: new URLSearchParams({ cantidad: nueva })
                    });
                    if (resp.status === 401 || resp.status === 403) { window.location.href = '/ingresar'; return; }
                    if (!resp.ok) throw new Error('HTTP ' + resp.status);
                    const d = await resp.json();
                    item.cantidad = d.cantidad;
                    item.subtotal = d.subtotal || (item.precio * item.cantidad);
                    actualizarItemEnDOM(id);
                    calcularTotal();
                } catch (err) { console.error(err); alert('No se pudo actualizar la cantidad'); }
            }
        });
    });

    document.querySelectorAll('.quantity-btn.plus').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            const item = carrito.find(i => i.id === id);
            if (item) {
                const nueva = item.cantidad + 1;
                try {
                    const resp = await fetch(`/carrito/actualizar-cantidad/${id}`, {
                        method: 'PATCH',
                        credentials: 'same-origin',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: new URLSearchParams({ cantidad: nueva })
                    });
                    if (resp.status === 401 || resp.status === 403) { window.location.href = '/ingresar'; return; }
                    if (!resp.ok) throw new Error('HTTP ' + resp.status);
                    const d = await resp.json();
                    item.cantidad = d.cantidad;
                    item.subtotal = d.subtotal || (item.precio * item.cantidad);
                    actualizarItemEnDOM(id);
                    calcularTotal();
                } catch (err) { console.error(err); alert('No se pudo actualizar la cantidad'); }
            }
        });
    });

    // eliminar - llamar al backend
    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            try {
                const resp = await fetch(`/carrito/${id}`, { method: 'DELETE', credentials: 'same-origin' });
                if (resp.status === 401 || resp.status === 403) { window.location.href = '/ingresar'; return; }
                if (!resp.ok) throw new Error('HTTP ' + resp.status);
                carrito = carrito.filter(item => item.id !== id);
                // ajustar pagina actual si quedó fuera de rango
                const totalPaginas = Math.max(1, Math.ceil(carrito.length / carritoItemsPorPagina));
                if (carritoPaginaActual > totalPaginas) carritoPaginaActual = totalPaginas;
                renderizarCarrito();
                calcularTotal();
            } catch (err) { console.error(err); alert('No se pudo eliminar el producto'); }
        });
    });
}

function actualizarItemEnDOM(id) {
    const item = carrito.find(i => i.id === id);
    if (item) {
        const qtyEl = document.querySelector(`.quantity-display[data-id="${id}"]`);
        if (qtyEl) qtyEl.textContent = item.cantidad;
        const totalEl = document.querySelector(`.item-total-value[data-id="${id}"]`);
        if (totalEl) totalEl.textContent = formatearMoneda(item.precio * item.cantidad);
    }
}

async function cargarCarrito() {
    try {
        const resp = await fetch('/carrito/mi-carrito', { credentials: 'same-origin' });
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

            // Si la respuesta del carrito no incluye la info completa del producto,
            // intentar obtenerla desde la API de productos para mostrar nombre/imagen reales.
            const needsFetch = carrito.filter(i => !i.nombre || i.nombre === 'Producto' || i.imagen === '/static/img/UI/logo.png');
            if (needsFetch.length) {
                await Promise.all(needsFetch.map(async (it) => {
                    try {
                        const respProd = await fetch(`/productos/${it.id}`);
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

            if (!carrito || carrito.length === 0) {
                document.querySelector('.cart-items').innerHTML = '<div class="cart-loading">Tu carrito está vacío.</div>';
            } else {
                renderizarCarrito();
            }
            calcularTotal();
    } catch (err) {
        console.error('Error cargando carrito', err);
        document.querySelector('.cart-items').innerHTML = '<p>No se pudo cargar el carrito.</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    cargarCarrito();
});