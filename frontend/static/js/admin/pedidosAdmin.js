document.addEventListener("DOMContentLoaded", () => {
  const perPage = 5;
  let currentPage = 1;
  let allOrders = [];

  const tbody = document.getElementById("tabla-body");
  const statusFilter = document.getElementById("status-filter");
  const dateFilter = document.getElementById("date-filter");
  const clientFilter = document.getElementById("client-filter");
  const productFilter = document.getElementById("product-filter");
  const filterBtn = document.getElementById("filter-button");
  const resultsInfo = document.querySelector(".results-info");
  const paginationEl = document.querySelector(".pagination");

  // Verificar si el elemento tbody existe
  if (!tbody) {
    console.error('No se encontró el elemento tbody con id "tabla-body"');
    return;
  }

  console.log('Inicializando gestión de pedidos...');

  // Función para obtener los pedidos desde la API
  async function fetchPedidos() {
    try {
      console.log('Haciendo petición a /pedidos/');

      const token = localStorage.getItem('token');
      console.log('Token encontrado:', token ? 'Sí' : 'No');

      const response = await fetch('/pedidos/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        }
      });

      console.log('📡 Respuesta recibida. Status:', response.status);

      // Si la respuesta no es exitosa
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error en la respuesta:', response.status, errorText);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const pedidos = await response.json();
      console.log('Pedidos recibidos correctamente. Cantidad:', pedidos.length);
      console.log('Datos de pedidos:', pedidos);

      // Verificar la estructura de los datos del cliente
      pedidos.forEach((pedido, index) => {
        console.log(`Pedido ${index + 1}:`, {
          id: pedido.id,
          cliente: pedido.cliente,
          clienteID: pedido.clienteID,
          tieneCliente: !!pedido.cliente,
          nombreCliente: pedido.cliente ? pedido.cliente.nombre : 'NO TIENE'
        });
      });

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

  // Función para confirmar pago
  async function confirmarPago(pagoID) {
    try {
      console.log('Confirmando pago ID:', pagoID);
      const response = await fetch(`/pagos/${pagoID}/confirmar`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        }
      });

      // Si la respuesta no es exitosa
      if (!response.ok) {
        throw new Error('Error al confirmar pago');
      }

      return await response.json();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al confirmar el pago');
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

      // Si la respuesta no es exitosa
      if (!response.ok) {
        throw new Error('Error al obtener detalles del pedido');
      }

      return await response.json();
    } catch (error) {
      console.error('Error:', error);
      return [];
    }
  }

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
    // Verificar si el cliente está cargado directamente
    if (pedido.cliente && pedido.cliente.nombre) {
      return pedido.cliente.nombre;
    }

    // Si no, intentar obtenerlo de otras propiedades
    if (pedido.cliente_nombre) {
      return pedido.cliente_nombre;
    }

    // Si el clienteID existe pero no el objeto cliente, intentar cargarlo después
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
    const product = (productFilter.value || "").trim().toLowerCase();

    console.log('Aplicando filtros:', { status, date, client, product });

    return allOrders.filter(o => {
      // Filtrar por estado
      if (status !== "Todos") {
        const statusMap = {
          'Pendiente': 'PENDIENTE',
          'Pagado': 'PAGADO',
          'Cancelado': 'CANCELADO'
        };
        if (o.estado !== statusMap[status]) return false;
      }

      // Filtrar por fecha
      if (date && !o.fecha.startsWith(date)) return false;

      // Filtrar por cliente
      if (client) {
        const nombreCliente = obtenerNombreCliente(o).toLowerCase();
        if (!nombreCliente.includes(client)) return false;
      }

      return true;
    });
  }

  // Función para renderizar la tabla
  async function renderTable() {
    console.log('Renderizando tabla...');

    const filtered = applyFilters();
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * perPage;
    const pageItems = filtered.slice(start, start + perPage);

    tbody.innerHTML = "";

    console.log('Datos a mostrar:', {
      totalPedidos: allOrders.length,
      filtrados: filtered.length,
      paginaActual: currentPage,
      itemsEnPagina: pageItems.length
    });

    // Mostrar loading si no hay datos
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
      console.log('Procesando pedido:', o);

      // Obtener detalles del pedido para mostrar información del producto
      const detalles = await fetchDetallesPedido(o.id);
      const primerProducto = detalles.length > 0
        ? (detalles[0].producto?.nombre || 'Producto personalizado')
        : 'Sin productos';

      const tr = document.createElement("tr");
      tr.className = "hover:bg-gray-50";

      // Verificar si el pago está confirmado
      const tienePagoConfirmado = o.pago && o.pago.confirmado;
      const mostrarConfirmar = !tienePagoConfirmado && o.estado === 'PENDIENTE';

      // Obtener nombre del cliente
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
              <button class="action-btn confirmar confirm-btn" data-id="${o.id}" data-pagoid="${o.pago?.id}" title="Confirmar Pago">
                <span class="material-symbols-outlined text-base">check_circle</span>
              </button>
            ` : ''}
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

      // Si el cliente no está cargado pero tenemos clienteID, intentar cargarlo
      if ((!o.cliente || !o.cliente.nombre) && o.clienteID && nombreCliente === 'Cargando...') {
        console.log(`Cargando cliente para pedido ${o.id}...`);
        cargarYActualizarCliente(o.id, o.clienteID, tr);
      }
    }

    // Actualizar información de resultados
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
        // Actualizar el pedido en allOrders
        const pedidoIndex = allOrders.findIndex(p => p.id === pedidoId);
        if (pedidoIndex !== -1) {
          if (!allOrders[pedidoIndex].cliente) {
            allOrders[pedidoIndex].cliente = {};
          }
          allOrders[pedidoIndex].cliente.nombre = cliente.nombre;
        }

        // Actualizar la fila en la tabla
        const celdaCliente = fila.querySelector('td:nth-child(3)');
        if (celdaCliente) {
          celdaCliente.textContent = cliente.nombre;
        }

        console.log(`Cliente cargado para pedido ${pedidoId}: ${cliente.nombre}`);
      }
    } catch (error) {
      console.error(`Error cargando cliente para pedido ${pedidoId}:`, error);
    }
  }

  // Función para renderizar la paginación
  function renderPagination(totalPages) {
    if (!paginationEl) return;
    paginationEl.innerHTML = "";

    // Botón Anterior
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

    // Números de página
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

    // Botón Siguiente
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

  // Event listeners para acciones
  tbody.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const id = btn.dataset.id;
    const pagoId = btn.dataset.pagoid;

    if (!id) return;

    const order = allOrders.find(o => o.id == id);
    if (!order) return;

    // Si se hace clic en el botón de confirmar pago
    if (btn.classList.contains("confirm-btn")) {
      if (confirm('¿Estás seguro de que deseas confirmar el pago de este pedido?')) {
        try {
          btn.disabled = true;
          btn.innerHTML = '<span class="material-symbols-outlined animate-spin text-base">refresh</span>';

          await confirmarPago(pagoId);
          alert('Pago confirmado exitosamente');

          // Recargar los pedidos para actualizar el estado
          await loadPedidos();
        } catch (error) {
          alert('Error al confirmar el pago');
          btn.disabled = false;
          btn.innerHTML = '<span class="material-symbols-outlined text-base">check_circle</span>';
        }
      }
    } else if (btn.classList.contains("print-btn")) {
      await printOrder(order);
    } else if (btn.classList.contains("mail-btn")) {
      mailOrder(order);
    }
  });

  // Event listeners para filtros
  filterBtn.addEventListener("click", () => {
    currentPage = 1;
    renderTable();
  });

  [statusFilter, dateFilter, clientFilter, productFilter].forEach(el => {
    if (el) {
      el.addEventListener("change", () => {
        currentPage = 1;
        renderTable();
      });
    }
  });

  // Función para cargar pedidos
  async function loadPedidos() {
    try {
      console.log('Iniciando carga de pedidos...');
      allOrders = await fetchPedidos();
      console.log('Pedidos cargados en loadPedidos:', allOrders);
      renderTable();
    } catch (error) {
      console.error('Error cargando pedidos:', error);
    }
  }

  // Funciones auxiliares para imprimir y enviar por correo
  async function printOrder(order) {
    const detalles = await fetchDetallesPedido(order.id);
    const productos = detalles.map(d =>
      d.producto?.nombre || 'Producto personalizado'
    ).join(', ');

    const nombreCliente = obtenerNombreCliente(order);

    const html = `
      <html>
        <head>
          <title>Pedido #${order.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
            .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .section { margin-bottom: 15px; }
            .label { font-weight: bold; color: #555; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Pedido #${order.id}</h1>
            <p class="label">Fecha: ${formatDateLong(order.fecha)}</p>
          </div>
          
          <div class="section">
            <h2>Información del Cliente</h2>
            <p><span class="label">Nombre:</span> ${escapeHtml(nombreCliente)}</p>
          </div>

          <div class="section">
            <h2>Detalles del Pedido</h2>
            <p><span class="label">Productos:</span> ${escapeHtml(productos)}</p>
            <p><span class="label">Total:</span> ${formatCurrency(order.total)}</p>
            <p><span class="label">Estado:</span> ${translateStatus(order.estado)}</p>
          </div>

          <div class="section">
            <p><em>Impreso el ${new Date().toLocaleDateString('es-ES')}</em></p>
          </div>
        </body>
      </html>`;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Por favor, permite ventanas emergentes para imprimir');
      return;
    }

    printWindow.document.write(html);
    printWindow.document.close();

    // Esperar a que cargue el contenido antes de imprimir
    printWindow.onload = function () {
      printWindow.print();
      // Cerrar la ventana después de imprimir
      setTimeout(() => {
        printWindow.close();
      }, 500);
    };
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

  // Función para escapar HTML
  function escapeHtml(str) {
    if (typeof str !== "string") return str;
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Inicializar la carga de pedidos
  console.log('Inicializando aplicación...');
  loadPedidos();
});