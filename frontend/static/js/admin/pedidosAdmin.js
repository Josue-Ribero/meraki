document.addEventListener("DOMContentLoaded", () => {
  const perPage = 5;
  let currentPage = 1;
  let allOrders = [];

  const tbody = document.getElementById("tabla-body");
  const statusFilter = document.getElementById("status-filter");
  const dateFilter = document.getElementById("date-filter");
  const clientFilter = document.getElementById("client-filter");
  const orderIdFilter = document.getElementById("order-id-filter");
  const filterBtn = document.getElementById("filter-button");
  const resultsInfo = document.querySelector(".results-info");
  const paginationEl = document.querySelector(".pagination");

  // Verificar si el elemento tbody existe
  if (!tbody) {
    console.error('No se encontró el elemento tbody con id "tabla-body"');
    return;
  }

  console.log('Inicializando gestión de pedidos...');

  // ========== FUNCIONES PRINCIPALES ==========

  // Función para obtener los pedidos desde la API
  async function fetchPedidos() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/pedidos/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const pedidos = await response.json();
      return pedidos;
    } catch (error) {
      console.error('Error fetching pedidos:', error);
      alert('Error al cargar los pedidos: ' + error.message);
      return [];
    }
  }

  // Función para obtener información del cliente por ID (como respaldo)
  async function fetchCliente(clienteID) {
    try {
      const response = await fetch(`/clientes/${clienteID}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo cliente:', error);
      return null;
    }
  }

  // Función para confirmar pedido
  async function confirmarPedido(pedidoID) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/pedidos/${pedidoID}/confirmar`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token || ''}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error confirmando pedido:', error);
      alert('Error al confirmar el pedido: ' + error.message);
      throw error;
    }
  }

  // Función para obtener detalles del pedido
  async function fetchDetallesPedido(pedidoID) {
    try {
      const response = await fetch(`/detallePedido/pedido/${pedidoID}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al obtener detalles del pedido');
      }

      return await response.json();
    } catch (error) {
      console.error('Error:', error);
      return [];
    }
  }

  // ========== FUNCIONES PARA EL MODAL DE DETALLES ==========

  // Función para obtener información completa del pedido
  async function obtenerInformacionCompletaPedido(pedidoID) {
    try {
      const token = localStorage.getItem('token');

      // Obtener pedido
      const respuestaPedido = await fetch(`/pedidos/${pedidoID}`, {
        headers: {
          'Authorization': `Bearer ${token || ''}`
        }
      });

      if (!respuestaPedido.ok) {
        throw new Error('Error al obtener información del pedido');
      }

      const pedido = await respuestaPedido.json();

      // Obtener detalles del pedido
      const detalles = await fetchDetallesPedido(pedidoID);

      // Obtener información del cliente si está disponible
      let clienteInfo = {};
      if (pedido.clienteID) {
        try {
          const respuestaCliente = await fetch(`/clientes/${pedido.clienteID}`, {
            headers: {
              'Authorization': `Bearer ${token || ''}`
            }
          });

          if (respuestaCliente.ok) {
            clienteInfo = await respuestaCliente.json();
          }
        } catch (error) {
          console.error('Error obteniendo información del cliente:', error);
        }
      }

      return {
        pedido,
        detalles,
        cliente: clienteInfo
      };
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }

  // Función para mostrar el modal de detalles
  async function mostrarDetallesPedido(pedidoID) {
    try {
      const modal = document.getElementById('detallesModal');
      const contenido = document.getElementById('detallesModalContent');
      const titulo = document.getElementById('detalles-modal-title');

      // Mostrar loading
      contenido.innerHTML = `
        <div class="text-center py-8">
          <span class="material-symbols-outlined animate-spin text-3xl text-[var(--aa8744)] mb-2">refresh</span>
          <p class="text-gray-600">Cargando detalles del pedido...</p>
        </div>
      `;

      modal.setAttribute('aria-hidden', 'false');
      titulo.textContent = `Detalles del Pedido #${pedidoID}`;

      // Obtener información completa
      const { pedido, detalles, cliente } = await obtenerInformacionCompletaPedido(pedidoID);

      // Renderizar usando template
      renderizarDetallesPedido(pedido, detalles, cliente, contenido);

    } catch (error) {
      console.error('Error al mostrar detalles:', error);
      const contenido = document.getElementById('detallesModalContent');
      contenido.innerHTML = `
        <div class="text-center py-8 text-red-600">
          <span class="material-symbols-outlined text-3xl mb-2">error</span>
          <p>Error al cargar los detalles del pedido</p>
          <p class="text-sm text-gray-600 mt-2">${error.message}</p>
        </div>
      `;
    }
  }

  // Función para renderizar los detalles del pedido usando templates
  function renderizarDetallesPedido(pedido, detalles, cliente, contenedor) {
    const template = document.getElementById('pedido-detalles-template');
    if (!template) return;

    const clone = template.content.cloneNode(true);

    // Llenar información básica
    clone.querySelector('.pedido-id').textContent = `#${pedido.id}`;
    clone.querySelector('.pedido-fecha').textContent = formatDateLong(pedido.fecha);

    const estadoEl = clone.querySelector('.pedido-estado');
    estadoEl.textContent = translateStatus(pedido.estado);

    // Usar clases CSS existentes
    let estadoClase = '';
    switch (pedido.estado) {
      case 'PENDIENTE': estadoClase = 'estado-pendiente'; break;
      case 'PAGADO': estadoClase = 'estado-pagado'; break;
      case 'CANCELADO': estadoClase = 'estado-cancelado'; break;
    }
    estadoEl.className = `estado-pedido ${estadoClase}`;

    clone.querySelector('.pedido-total').textContent = formatCurrency(pedido.total);

    // Llenar información cliente
    clone.querySelector('.cliente-nombre').textContent = cliente.nombre || obtenerNombreCliente(pedido);
    clone.querySelector('.cliente-email').textContent = cliente.email || 'No disponible';
    clone.querySelector('.cliente-telefono').textContent = cliente.telefono || 'No disponible';

    // Llenar productos
    const productosContainer = clone.querySelector('.productos-container');
    const itemTemplate = document.getElementById('producto-fila-template');

    if (detalles.length === 0) {
      productosContainer.innerHTML = '<p class="text-gray-500 text-center py-4">No hay productos en este pedido</p>';
    } else if (itemTemplate) {
      // Crear tabla para los productos
      const table = document.createElement('table');
      table.className = 'detalles-table';
      table.innerHTML = `
        <thead>
          <tr>
            <th>Producto</th>
            <th class="text-center">Cantidad</th>
            <th class="text-right">Precio Unitario</th>
            <th class="text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody></tbody>
        <tfoot>
          <tr>
            <td colspan="3" class="text-right font-semibold py-3 border-t border-[var(--d1bc97)]">Total del Pedido:</td>
            <td class="text-right font-semibold text-lg py-3 border-t border-[var(--d1bc97)]">${formatCurrency(pedido.total)}</td>
          </tr>
        </tfoot>
      `;

      const tbody = table.querySelector('tbody');

      detalles.forEach(detalle => {
        const itemClone = itemTemplate.content.cloneNode(true);
        const nombreProducto = detalle.producto?.nombre || detalle.disenoPersonalizado?.nombre || 'Producto personalizado';

        // USAR DIRECTAMENTE LA URL DE SUPABASE
        const imagenURL = detalle.producto?.imagenURL || detalle.disenoPersonalizado?.imagenURL || '/static/images/default-product.jpg';

        const imgEl = itemClone.querySelector('.producto-imagen');
        imgEl.src = imagenURL;
        imgEl.alt = nombreProducto;
        imgEl.onerror = function () { this.src = '/static/images/default-product.jpg'; };

        itemClone.querySelector('.producto-nombre').textContent = nombreProducto;

        if (detalle.esPersonalizado) {
          itemClone.querySelector('.producto-badge').classList.remove('hidden');
        }

        itemClone.querySelector('.producto-cantidad').textContent = detalle.cantidad;
        itemClone.querySelector('.producto-precio').textContent = formatCurrency(detalle.precioUnidad);
        itemClone.querySelector('.producto-subtotal').textContent = formatCurrency(detalle.subtotal);

        // El template es un div, pero necesitamos tr para la tabla. 
        // Extraemos el contenido del div y lo metemos en un tr
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>
            <div class="producto-info">
              <img src="${imagenURL}" alt="${nombreProducto}" class="producto-miniatura" onerror="this.src='/static/images/default-product.jpg'">
              <div class="producto-texto">
                <div class="producto-nombre">${nombreProducto}</div>
                ${detalle.esPersonalizado ? '<span class="producto-badge">Personalizado</span>' : ''}
              </div>
            </div>
          </td>
          <td class="text-center">${detalle.cantidad}</td>
          <td class="text-right">${formatCurrency(detalle.precioUnidad)}</td>
          <td class="text-right font-semibold">${formatCurrency(detalle.subtotal)}</td>
        `;

        tbody.appendChild(tr);
      });

      productosContainer.appendChild(table);
    }

    contenedor.innerHTML = '';
    contenedor.appendChild(clone);
  }

  // Función para cerrar el modal
  function cerrarDetallesModal() {
    const modal = document.getElementById('detallesModal');
    modal.setAttribute('aria-hidden', 'true');
  }

  // ========== FUNCIONES DE UTILIDAD ==========

  // Función para formatear fecha en formato largo
  function formatDateLong(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }

  // Función para formatear moneda
  function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  }

  // Función para obtener clases CSS según el estado
  function badgeClassesFor(status) {
    switch (status) {
      case "PENDIENTE":
        return "inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800";
      case "PAGADO":
        return "inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800";
      case "CANCELADO":
        return "inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800";
      default:
        return "inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800";
    }
  }

  // Función para traducir estados
  function translateStatus(status) {
    const statusMap = {
      'PENDIENTE': 'Pendiente',
      'PAGADO': 'Pagado',
      'CANCELADO': 'Cancelado'
    };
    return statusMap[status] || status;
  }

  // Función mejorada para obtener el nombre del cliente
  function obtenerNombreCliente(pedido) {
    if (pedido.cliente && pedido.cliente.nombre) {
      return pedido.cliente.nombre;
    }
    if (pedido.cliente_nombre) {
      return pedido.cliente_nombre;
    }
    if (pedido.clienteID) {
      return 'Cargando...';
    }
    return 'Cliente no disponible';
  }

  // Función para aplicar filtros
  function applyFilters() {
    const status = statusFilter.value || "Todos";
    const date = dateFilter.value || "";
    const client = (clientFilter.value || "").trim().toLowerCase();
    const orderId = (orderIdFilter.value || "").trim();

    return allOrders.filter(o => {
      if (status !== "Todos") {
        const statusMap = { 'Pendiente': 'PENDIENTE', 'Pagado': 'PAGADO', 'Cancelado': 'CANCELADO' };
        if (o.estado !== statusMap[status]) return false;
      }
      if (date && !o.fecha.startsWith(date)) return false;
      if (client) {
        const nombreCliente = obtenerNombreCliente(o).toLowerCase();
        if (!nombreCliente.includes(client)) return false;
      }
      if (orderId) {
        const pedidoIdStr = o.id.toString();
        if (!pedidoIdStr.includes(orderId)) return false;
      }
      return true;
    });
  }

  // Función para escapar HTML
  function escapeHtml(str) {
    if (typeof str !== "string") return str;
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ========== FUNCIONES DE IMPRESIÓN ==========

  // Función para imprimir pedido usando templates
  async function printOrder(order) {
    try {
      // Obtener información completa del pedido
      const { pedido, detalles, cliente } = await obtenerInformacionCompletaPedido(order.id);

      const template = document.getElementById('impresion-template');
      if (!template) return;

      const clone = template.content.cloneNode(true);

      // Llenar datos básicos
      clone.querySelectorAll('.pedido-id').forEach(el => el.textContent = `#${pedido.id}`);
      clone.querySelectorAll('.pedido-fecha').forEach(el => el.textContent = formatDateLong(pedido.fecha));
      clone.querySelectorAll('.pedido-estado').forEach(el => el.textContent = translateStatus(pedido.estado));
      clone.querySelectorAll('.pedido-total').forEach(el => el.textContent = formatCurrency(pedido.total));

      // Llenar datos cliente
      clone.querySelector('.cliente-nombre').textContent = cliente.nombre || obtenerNombreCliente(pedido);
      clone.querySelector('.cliente-email').textContent = cliente.email || 'No disponible';
      clone.querySelector('.cliente-telefono').textContent = cliente.telefono || 'No disponible';

      // Llenar fecha de generación
      clone.querySelector('.fecha-generacion').textContent = new Date().toLocaleDateString('es-ES', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      // Llenar productos
      const tbody = clone.querySelector('.productos-tbody');
      const itemTemplate = document.getElementById('impresion-producto-fila-template');

      if (detalles.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px;">No hay productos en este pedido</td></tr>';
      } else if (itemTemplate) {
        detalles.forEach(detalle => {
          const itemClone = itemTemplate.content.cloneNode(true);
          const nombreProducto = detalle.producto?.nombre || detalle.disenoPersonalizado?.nombre || 'Producto personalizado';
          const imagenURL = detalle.producto?.imagenURL || detalle.disenoPersonalizado?.imagenURL || '/static/images/default-product.jpg';

          const imgEl = itemClone.querySelector('.producto-imagen');
          imgEl.src = imagenURL;
          imgEl.alt = nombreProducto;

          itemClone.querySelector('.producto-nombre').textContent = nombreProducto;

          if (detalle.esPersonalizado) {
            itemClone.querySelector('.producto-badge').classList.remove('hidden');
          }

          itemClone.querySelector('.producto-cantidad').textContent = detalle.cantidad;
          itemClone.querySelector('.producto-precio').textContent = formatCurrency(detalle.precioUnidad);
          itemClone.querySelector('.producto-subtotal').textContent = formatCurrency(detalle.subtotal);

          tbody.appendChild(itemClone);
        });
      }

      // Crear ventana de impresión
      const printWindow = window.open('', '_blank', 'width=1000,height=700');
      if (!printWindow) {
        alert('Por favor, permite ventanas emergentes para imprimir');
        return;
      }

      // Escribir HTML en la nueva ventana
      printWindow.document.write('<html><head><title>Detalles Pedido #' + pedido.id + '</title>');
      // Incluir CSS
      printWindow.document.write('<link rel="stylesheet" href="../../static/css/admin/pedidosAdmin.css">');
      printWindow.document.write('</head><body>');

      // Convertir el fragmento clonado a string HTML
      const div = document.createElement('div');
      div.appendChild(clone);
      printWindow.document.write(div.innerHTML);

      printWindow.document.write('</body></html>');
      printWindow.document.close();

      // Esperar a que cargue el contenido y CSS antes de imprimir
      printWindow.onload = function () {
        setTimeout(() => {
          printWindow.print();
          // Cerrar la ventana después de imprimir (opcional)
          // setTimeout(() => { printWindow.close(); }, 500);
        }, 500);
      };

    } catch (error) {
      console.error('Error al imprimir el pedido:', error);
      alert('Error al imprimir el pedido: ' + error.message);
    }
  }

  // ========== FUNCIONES DE RENDERIZADO ==========

  // Función para renderizar la tabla
  async function renderTable() {
    const filtered = applyFilters();
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * perPage;
    const pageItems = filtered.slice(start, start + perPage);

    tbody.innerHTML = "";

    if (pageItems.length === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">
          ${allOrders.length === 0 ? 'Cargando pedidos...' : 'No se encontraron pedidos con los filtros aplicados'}
        </td>
      `;
      tbody.appendChild(tr);
    }

    for (const o of pageItems) {
      const tr = document.createElement("tr");
      tr.className = "hover:bg-gray-50";

      const mostrarConfirmar = o.estado === 'PENDIENTE';
      const nombreCliente = obtenerNombreCliente(o);

      tr.innerHTML = `
        <td class="px-2 py-4 text-sm font-medium text-[var(--c-363636)] text-center">#${o.id}</td>
        <td class="px-2 py-4 text-sm text-center">${formatDateLong(o.fecha)}</td>
        <td class="px-2 py-4 text-sm text-center">${escapeHtml(nombreCliente)}</td>
        <td class="px-2 py-4 text-sm text-center">${formatCurrency(o.total)}</td>
        <td class="px-2 py-4 text-center">
          <span class="${badgeClassesFor(o.estado)}">${translateStatus(o.estado)}</span>
        </td>
        <td class="px-2 py-4 text-center">
          <div class="acciones-container">
            ${mostrarConfirmar ? `
              <button class="action-btn confirmar confirm-btn" data-id="${o.id}" title="Confirmar Pedido">
                <span class="material-symbols-outlined text-base">check_circle</span>
              </button>
            ` : ''}
            <button class="action-btn detalles detalles-btn" data-id="${o.id}" title="Ver Detalles">
              <span class="material-symbols-outlined text-base">visibility</span>
            </button>
            <button class="action-btn imprimir print-btn" data-id="${o.id}" title="Imprimir">
              <span class="material-symbols-outlined text-base">print</span>
            </button>
            <button class="action-btn correo mail-btn" data-id="${o.id}" title="Enviar por correo">
              <span class="material-symbols-outlined text-base">mail</span>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);

      if ((!o.cliente || !o.cliente.nombre) && o.clienteID && nombreCliente === 'Cargando...') {
        cargarYActualizarCliente(o.id, o.clienteID, tr);
      }
    }

    if (resultsInfo) {
      resultsInfo.textContent = `Mostrando ${pageItems.length} de ${filtered.length} pedidos`;
    }
    renderPagination(totalPages);
  }

  // Función para cargar y actualizar el cliente si no está presente
  async function cargarYActualizarCliente(pedidoId, clienteId, fila) {
    try {
      const cliente = await fetchCliente(clienteId);
      if (cliente && cliente.nombre) {
        const pedidoIndex = allOrders.findIndex(p => p.id === pedidoId);
        if (pedidoIndex !== -1) {
          if (!allOrders[pedidoIndex].cliente) {
            allOrders[pedidoIndex].cliente = {};
          }
          allOrders[pedidoIndex].cliente.nombre = cliente.nombre;
        }
        const celdaCliente = fila.querySelector('td:nth-child(3)');
        if (celdaCliente) {
          celdaCliente.textContent = cliente.nombre;
        }
      }
    } catch (error) {
      console.error(`Error cargando cliente para pedido ${pedidoId}:`, error);
    }
  }

  // Función para renderizar la paginación
  function renderPagination(totalPages) {
    if (!paginationEl) return;
    paginationEl.innerHTML = "";

    const prev = document.createElement("button");
    prev.textContent = "Anterior";
    prev.className = "page-btn";
    prev.disabled = currentPage === 1;
    prev.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        renderTable();
      }
    });
    paginationEl.appendChild(prev);

    for (let i = 1; i <= totalPages; i++) {
      const pageBtn = document.createElement("button");
      pageBtn.textContent = i;
      pageBtn.className = "page-btn" + (i === currentPage ? " active" : "");
      pageBtn.addEventListener("click", () => {
        currentPage = i;
        renderTable();
      });
      paginationEl.appendChild(pageBtn);
    }

    const next = document.createElement("button");
    next.textContent = "Siguiente";
    next.className = "page-btn";
    next.disabled = currentPage === totalPages;
    next.addEventListener("click", () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderTable();
      }
    });
    paginationEl.appendChild(next);
  }

  // Función para enviar pedido por correo
  function mailOrder(order) {
    const nombreCliente = obtenerNombreCliente(order);
    const subject = encodeURIComponent(`Detalles del Pedido #${order.id}`);
    const body = encodeURIComponent(
      `Hola,\n\n` +
      `Aquí están los detalles de tu pedido:\n\n` +
      `Pedido: #${order.id}\n` +
      `Fecha: ${formatDateLong(order.fecha)}\n` +
      `Cliente: ${nombreCliente}\n` +
      `Total: ${formatCurrency(order.total)}\n` +
      `Estado: ${translateStatus(order.estado)}\n\n` +
      `Gracias por tu compra.\n\n` +
      `Saludos,\nEquipo de Meraki`
    );

    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  // Función para cargar pedidos
  async function loadPedidos() {
    try {
      allOrders = await fetchPedidos();
      renderTable();
    } catch (error) {
      console.error('Error cargando pedidos:', error);
    }
  }

  // ========== EVENT LISTENERS ==========

  tbody.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const id = btn.dataset.id;
    if (!id) return;

    const order = allOrders.find(o => o.id == id);
    if (!order) return;

    if (btn.classList.contains("confirm-btn")) {
      if (confirm('¿Estás seguro de que deseas confirmar este pedido? Esta acción cambiará el estado a "PAGADO".')) {
        try {
          btn.disabled = true;
          btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-base">refresh</span>';
          await confirmarPedido(id);
          alert('Pedido confirmado exitosamente');
          await loadPedidos();
        } catch (error) {
          alert('Error al confirmar el pedido: ' + error.message);
          btn.disabled = false;
          btn.innerHTML = '<span class="material-symbols-outlined text-base">check_circle</span>';
        }
      }
    }
    else if (btn.classList.contains("detalles-btn")) {
      mostrarDetallesPedido(id);
    }
    else if (btn.classList.contains("print-btn")) {
      await printOrder(order);
    }
    else if (btn.classList.contains("mail-btn")) {
      mailOrder(order);
    }
  });

  filterBtn.addEventListener("click", () => {
    currentPage = 1;
    renderTable();
  });

  [statusFilter, dateFilter, clientFilter, orderIdFilter].forEach(el => {
    if (el) {
      el.addEventListener("change", () => {
        currentPage = 1;
        renderTable();
      });
      el.addEventListener("input", () => {
        currentPage = 1;
        renderTable();
      });
    }
  });

  // ========== INICIALIZACIÓN ==========

  const modal = document.getElementById('detallesModal');
  const btnCerrar1 = document.getElementById('cerrarDetallesModal');
  const btnCerrar2 = document.getElementById('cerrarDetallesModal2');

  if (btnCerrar1) btnCerrar1.addEventListener('click', cerrarDetallesModal);
  if (btnCerrar2) btnCerrar2.addEventListener('click', cerrarDetallesModal);

  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) cerrarDetallesModal();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal && modal.getAttribute('aria-hidden') === 'false') {
      cerrarDetallesModal();
    }
  });

  loadPedidos();
});