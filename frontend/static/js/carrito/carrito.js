let carrito = [
    { id: 1, nombre: "Collar de Perlas del Mar", precio: 1250.00, cantidad: 1, imagen: "https://lh3.googleusercontent.com/aida-public/AB6AXuBM20vbb5tsVpr1zeYw1gS5Nb4DGuJnn2fKTVGtqZ9rCUMwkT_j9IKgYhaX-UHLi9u6ALjZVUCA4gNR47cLRei7X_8o0MoQo4K1LUySWnes6_tu4nWGD8I8YbOL4pglcAiozuMgO5SxW7xaDDfGK4R4HeWypvsKI8Y5KjhzGmoTHQIPGc-fVQosYI-YgPhbaENNAKmNy8mlZrtzy8spg1M7RA_k2aCcmGXL84LuF4ggeThAh0u5E14Vkvz3wAjIkKC0_YRVofjHqhnY " },
    { id: 2, nombre: "Aretes de Filigrana de Plata", precio: 850.00, cantidad: 1, imagen: "https://lh3.googleusercontent.com/aida-public/AB6AXuApFCn0cGnypwWODmsi_4eoTeEAMOPjb8Yz8nyDmKQWdk3Kiq-cPdGy_oBVy2bMMnJzSXhbiQettlRQSgJ7wO-UoDJEPKZqVmVYDvCw44rbsn_9uSvYGEFW2qsRbn4TshX9GNnH0JBDRx1wmRX-uh1tHEArFkq5VaA3zf1qXI61mzFMMEIUHwAH6HRLPBc9YRbM-MU_MyhozaDxGr_oUc99Yhr8jZM4jsp0A7bei1fUammlIfUfHbELJ41KvILR6wnfuLvXETRLs1P1 " },
    { id: 3, nombre: "Pulsera Sol de Oro", precio: 900.00, cantidad: 2, imagen: "https://lh3.googleusercontent.com/aida-public/AB6AXuAme2eB6cgTCrO3kSH20yYbyfHmZ-WSZZt8KfswOrNwAdU1X-bCVYJa_ArU8iyirqmzsksdarsHBR9AjXYcAWFi64TtKeJ_yxX8RQdR9e9AWSGC0AmYC0q3ZIgOi7oCln_dJnXZ59wNpXO344UcnlYSVyBFyd5lHQ53YhLaw9j7AtZGRoFkXf_PrcnYdiwV_KymZVEfjYyzlzAp-bQUnFyQvi_e5qYcAT8taHZenm3nza0OzegYcOW-o256JAM9ORjNVQD70i4jvrfk " }
];

function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2 }).format(valor);
}

function calcularTotal() {
    let subtotal = 0;
    for (let item of carrito) {
        subtotal += item.precio * item.cantidad;
    }
    const envio = 0;
    const total = subtotal + envio;

    document.querySelector('.summary-row.total span:last-child').textContent = formatearMoneda(total);
    document.querySelector('.summary-row:first-child span:last-child').textContent = formatearMoneda(subtotal);
    return total;
}

function renderizarCarrito() {
    const contenedorItems = document.querySelector('.cart-items');
    contenedorItems.innerHTML = '';

    for (let item of carrito) {
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `
            <img alt="${item.nombre}" class="item-image" src="${item.imagen}" />
            <div class="item-details">
                <h2 class="item-title">${item.nombre}</h2>
                <p class="item-price">Precio unitario: ${formatearMoneda(item.precio)}</p>
                <div class="quantity-controls">
                    <button class="quantity-btn minus" data-id="${item.id}">-</button>
                    <span class="quantity-display" data-id="${item.id}">${item.cantidad}</span>
                    <button class="quantity-btn plus" data-id="${item.id}">+</button>
                </div>
            </div>
            <div class="item-actions">
                <p class="item-total" data-id="${item.id}">${formatearMoneda(item.precio * item.cantidad)}</p>
                <button class="remove-btn" data-id="${item.id}">
                    <span class="material-symbols-outlined remove-icon">delete</span>
                    Eliminar
                </button>
            </div>
        `;
        contenedorItems.appendChild(itemElement);
    }

    asignarEventos();
}

function asignarEventos() {
    document.querySelectorAll('.quantity-btn.minus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            const item = carrito.find(i => i.id === id);
            if (item && item.cantidad > 1) {
                item.cantidad--;
                actualizarItemEnDOM(id);
                calcularTotal();
            }
        });
    });

    document.querySelectorAll('.quantity-btn.plus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            const item = carrito.find(i => i.id === id);
            if (item) {
                item.cantidad++;
                actualizarItemEnDOM(id);
                calcularTotal();
            }
        });
    });

    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.closest('.remove-btn').dataset.id);
            carrito = carrito.filter(item => item.id !== id);
            renderizarCarrito();
            calcularTotal();
        });
    });
}

function actualizarItemEnDOM(id) {
    const item = carrito.find(i => i.id === id);
    if (item) {
        document.querySelector(`.quantity-display[data-id="${id}"]`).textContent = item.cantidad;
        document.querySelector(`.item-total[data-id="${id}"]`).textContent = formatearMoneda(item.precio * item.cantidad);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    renderizarCarrito();
    calcularTotal();
});