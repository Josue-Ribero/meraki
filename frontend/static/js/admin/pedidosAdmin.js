document.addEventListener("DOMContentLoaded", () => {
  const pedidosPorPagina = 5;
  let paginaActual = 1;
  let todosLosPedidos = [];
  let cacheDetalles = new Map();
  let estaInicializado = false;

  const cuerpoTabla = document.getElementById("tabla-body");
  const filtroEstado = document.getElementById("status-filter");
  const filtroFecha = document.getElementById("date-filter");
  const filtroCliente = document.getElementById("client-filter");
  const filtroIdPedido = document.getElementById("order-id-filter");
  const botonFiltrar = document.getElementById("filter-button");
  const infoResultados = document.querySelector(".results-info");
  const elementoPaginacion = document.querySelector(".pagination");

  if (!cuerpoTabla) {
    console.error('No se encontró el elemento tbody con id "tabla-body"');
    return;
  }

  // Función para obtener los pedidos desde la API
  async function obtenerPedidos() {
    try {
      const token = localStorage.getItem('token');
      const respuesta = await fetch('/pedidos/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        }
      });

      if (!respuesta.ok) {
        const textoError = await respuesta.text();
        throw new Error(`Error ${respuesta.status}: ${textoError}`);
      }

      const pedidos = await respuesta.json();
      return pedidos;
    } catch (error) {
      console.error('Error obteniendo pedidos:', error);
      alert('Error al cargar los pedidos: ' + error.message);
      return [];
    }
  }

  // Función para obtener información del cliente por ID
  async function obtenerCliente(clienteID) {
    try {
      const respuesta = await fetch(`/clientes/${clienteID}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (respuesta.ok) {
        return await respuesta.json();
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo cliente:', error);
      return null;
    }
  }

  // Confirmar pedido
  async function confirmarPedido(pedidoID) {
    try {
      const token = localStorage.getItem('token');

      const respuesta = await fetch(`/pedidos/${pedidoID}/confirmar`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token || ''}`,
          'Content-Type': 'application/json'
        }
      });

      if (!respuesta.ok) {
        const textoError = await respuesta.text();
        throw new Error(`Error ${respuesta.status}: ${textoError}`);
      }

      const resultado = await respuesta.json();
      return resultado;
    } catch (error) {
      alert('Error al confirmar el pedido: ' + error.message);
      throw error;
    }
  }

  // Función para obtener detalles del pedido CON CACHE
  async function obtenerDetallesPedido(pedidoID) {
    // Verificar cache primero
    if (cacheDetalles.has(pedidoID)) {
      return cacheDetalles.get(pedidoID);
    }

    try {
      const respuesta = await fetch(`/detallePedido/pedido/${pedidoID}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (!respuesta.ok) {
        throw new Error('Error al obtener detalles del pedido');
      }

      const detalles = await respuesta.json();

      // Guardar en cache
      cacheDetalles.set(pedidoID, detalles);
      return detalles;
    } catch (error) {
      console.error('Error:', error);
      return [];
    }
  }

  // Función para formatear fecha en formato largo
  function formatearFechaLarga(iso) {
    if (!iso) return "";
    const fecha = new Date(iso);
    return fecha.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }

  // Función para formatear moneda
  function formatearMoneda(monto) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(monto);
  }

  // Función para obtener clases CSS según el estado
  function obtenerClasesBadge(estado) {
    switch (estado) {
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
  function traducirEstado(estado) {
    const mapaEstados = {
      'PENDIENTE': 'Pendiente',
      'PAGADO': 'Pagado',
      'CANCELADO': 'Cancelado'
    };
    return mapaEstados[estado] || estado;
  }

  // Función para obtener el nombre del cliente
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
  function aplicarFiltros() {
    const estado = filtroEstado.value || "Todos";
    const fecha = filtroFecha.value || "";
    const cliente = (filtroCliente.value || "").trim().toLowerCase();
    const idPedido = (filtroIdPedido.value || "").trim();

    return todosLosPedidos.filter(pedido => {
      if (estado !== "Todos") {
        const mapaEstados = {
          'Pendiente': 'PENDIENTE',
          'Pagado': 'PAGADO',
          'Cancelado': 'CANCELADO'
        };
        if (pedido.estado !== mapaEstados[estado]) return false;
      }

      if (fecha && !pedido.fecha.startsWith(fecha)) return false;

      if (cliente) {
        const nombreCliente = obtenerNombreCliente(pedido).toLowerCase();
        if (!nombreCliente.includes(cliente)) return false;
      }

      if (idPedido) {
        const idPedidoStr = pedido.id.toString();
        if (!idPedidoStr.includes(idPedido)) return false;
      }

      return true;
    });
  }

  // Función para renderizar la tabla
  async function renderizarTabla() {
    const pedidosFiltrados = aplicarFiltros();
    const total = pedidosFiltrados.length;
    const totalPaginas = Math.max(1, Math.ceil(total / pedidosPorPagina));
    if (paginaActual > totalPaginas) paginaActual = totalPaginas;

    const inicio = (paginaActual - 1) * pedidosPorPagina;
    const elementosPagina = pedidosFiltrados.slice(inicio, inicio + pedidosPorPagina);

    cuerpoTabla.innerHTML = "";

    if (elementosPagina.length === 0) {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">
          ${todosLosPedidos.length === 0 ? 'Cargando pedidos...' : 'No se encontraron pedidos con los filtros aplicados'}
        </td>
      `;
      cuerpoTabla.appendChild(fila);
    }

    // Cargar todos los detalles primero (en paralelo)
    const promesasDetalles = elementosPagina.map(pedido => obtenerDetallesPedido(pedido.id));
    await Promise.all(promesasDetalles);

    for (const pedido of elementosPagina) {
      // Obtener detalles del pedido desde cache
      const detalles = cacheDetalles.get(pedido.id) || [];
      const primerProducto = detalles.length > 0
        ? (detalles[0].producto?.nombre || 'Producto personalizado')
        : 'Sin productos';

      const fila = document.createElement("tr");
      fila.className = "hover:bg-gray-50";

      const mostrarConfirmar = pedido.estado === 'PENDIENTE';
      const nombreCliente = obtenerNombreCliente(pedido);

      fila.innerHTML = `
        <td class="px-2 py-4 text-sm font-medium text-[var(--c-363636)] text-center">#${pedido.id}</td>
        <td class="px-2 py-4 text-sm text-center">${formatearFechaLarga(pedido.fecha)}</td>
        <td class="px-2 py-4 text-sm text-center">${escaparHTML(nombreCliente)}</td>
        <td class="px-2 py-4 text-sm text-center">${formatearMoneda(pedido.total)}</td>
        <td class="px-2 py-4 text-center">
          <span class="${obtenerClasesBadge(pedido.estado)}">${traducirEstado(pedido.estado)}</span>
        </td>
        <td class="px-2 py-4 text-center">
          <div class="acciones-container">
            ${mostrarConfirmar ? `
              <button class="action-btn confirmar confirm-btn" data-id="${pedido.id}" title="Confirmar Pedido">
                <span class="material-symbols-outlined text-base">check_circle</span>
              </button>
            ` : ''}
            <button class="action-btn imprimir print-btn" data-id="${pedido.id}" title="Imprimir">
              <span class="material-symbols-outlined text-base">print</span>
            </button>
            <button class="action-btn correo mail-btn" data-id="${pedido.id}" title="Enviar por correo">
              <span class="material-symbols-outlined text-base">mail</span>
            </button>
          </div>
        </td>
      `;
      cuerpoTabla.appendChild(fila);

      if ((!pedido.cliente || !pedido.cliente.nombre) && pedido.clienteID && nombreCliente === 'Cargando...') {
        cargarYActualizarCliente(pedido.id, pedido.clienteID, fila);
      }
    }

    if (infoResultados) {
      infoResultados.textContent = `Mostrando ${elementosPagina.length} de ${pedidosFiltrados.length} pedidos`;
    }
    renderizarPaginacion(totalPaginas);
  }

  // Función para cargar y actualizar el cliente si no está presente
  async function cargarYActualizarCliente(pedidoId, clienteId, fila) {
    try {
      const cliente = await obtenerCliente(clienteId);
      if (cliente && cliente.nombre) {
        const indicePedido = todosLosPedidos.findIndex(p => p.id === pedidoId);
        if (indicePedido !== -1) {
          if (!todosLosPedidos[indicePedido].cliente) {
            todosLosPedidos[indicePedido].cliente = {};
          }
          todosLosPedidos[indicePedido].cliente.nombre = cliente.nombre;
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
  function renderizarPaginacion(totalPaginas) {
    if (!elementoPaginacion) return;
    elementoPaginacion.innerHTML = "";

    const botonAnterior = document.createElement("button");
    botonAnterior.textContent = "Anterior";
    botonAnterior.className = "page-btn";
    botonAnterior.disabled = paginaActual === 1;
    botonAnterior.addEventListener("click", () => {
      if (paginaActual > 1) {
        paginaActual--;
        renderizarTabla();
      }
    });
    elementoPaginacion.appendChild(botonAnterior);

    for (let i = 1; i <= totalPaginas; i++) {
      const botonPagina = document.createElement("button");
      botonPagina.textContent = i;
      botonPagina.className = "page-btn" + (i === paginaActual ? " active" : "");
      botonPagina.addEventListener("click", () => {
        paginaActual = i;
        renderizarTabla();
      });
      elementoPaginacion.appendChild(botonPagina);
    }

    const botonSiguiente = document.createElement("button");
    botonSiguiente.textContent = "Siguiente";
    botonSiguiente.className = "page-btn";
    botonSiguiente.disabled = paginaActual === totalPaginas;
    botonSiguiente.addEventListener("click", () => {
      if (paginaActual < totalPaginas) {
        paginaActual++;
        renderizarTabla();
      }
    });
    elementoPaginacion.appendChild(botonSiguiente);
  }

  // Event listeners para acciones - CON DEBOUNCE
  let tiempoEsperaClick;
  cuerpoTabla.addEventListener("click", async (evento) => {
    // Debounce para prevenir múltiples clics rápidos
    if (tiempoEsperaClick) clearTimeout(tiempoEsperaClick);

    tiempoEsperaClick = setTimeout(async () => {
      const boton = evento.target.closest("button");
      if (!boton) return;

      const id = boton.dataset.id;
      if (!id) return;

      const pedido = todosLosPedidos.find(p => p.id == id);
      if (!pedido) return;

      if (boton.classList.contains("confirm-btn")) {
        if (confirm('¿Estás seguro de que deseas confirmar este pedido? Esta acción cambiará el estado a "PAGADO".')) {
          try {
            boton.disabled = true;
            boton.innerHTML = '<span class="material-symbols-outlined animate-spin text-base">refresh</span>';

            await confirmarPedido(id);
            alert('Pedido confirmado exitosamente');

            // Limpiar cache y recargar
            cacheDetalles.clear();
            await cargarPedidos();
          } catch (error) {
            alert('Error al confirmar el pedido: ' + error.message);
            boton.disabled = false;
            boton.innerHTML = '<span class="material-symbols-outlined text-base">check_circle</span>';
          }
        }
      } else if (boton.classList.contains("print-btn")) {
        await imprimirPedido(pedido);
      } else if (boton.classList.contains("mail-btn")) {
        enviarCorreoPedido(pedido);
      }
    }, 100);
  });

  // Event listeners para filtros - CON DEBOUNCE
  let tiempoEsperaFiltro;
  function renderizarTablaConRetraso() {
    if (tiempoEsperaFiltro) clearTimeout(tiempoEsperaFiltro);
    tiempoEsperaFiltro = setTimeout(() => {
      paginaActual = 1;
      renderizarTabla();
    }, 300);
  }

  botonFiltrar.addEventListener("click", renderizarTablaConRetraso);

  [filtroEstado, filtroFecha, filtroCliente, filtroIdPedido].forEach(elemento => {
    if (elemento) {
      elemento.addEventListener("change", renderizarTablaConRetraso);
      elemento.addEventListener("input", renderizarTablaConRetraso);
    }
  });

  // Función para cargar pedidos
  async function cargarPedidos() {
    try {
      todosLosPedidos = await obtenerPedidos();

      // Marcar como inicializado después de la primera carga exitosa
      if (!estaInicializado) {
        estaInicializado = true;
      }

      // Renderizar la tabla
      renderizarTabla();
    } catch (error) {
      console.error('Error cargando pedidos:', error);
    }
  }

  // Función para imprimir el pedido
  async function imprimirPedido(pedido) {
    const detalles = await obtenerDetallesPedido(pedido.id);
    const productos = detalles.map(detalle =>
      detalle.producto?.nombre || 'Producto personalizado'
    ).join(', ');

    const nombreCliente = obtenerNombreCliente(pedido);

    const html = `
      <html>
        <head>
          <title>Pedido #${pedido.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
            .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .section { margin-bottom: 15px; }
            .label { font-weight: bold; color: #555; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Pedido #${pedido.id}</h1>
            <p class="label">Fecha: ${formatearFechaLarga(pedido.fecha)}</p>
          </div>
          
          <div class="section">
            <h2>Información del Cliente</h2>
            <p><span class="label">Nombre:</span> ${escaparHTML(nombreCliente)}</p>
          </div>

          <div class="section">
            <h2>Detalles del Pedido</h2>
            <p><span class="label">Productos:</span> ${escaparHTML(productos)}</p>
            <p><span class="label">Total:</span> ${formatearMoneda(pedido.total)}</p>
            <p><span class="label">Estado:</span> ${traducirEstado(pedido.estado)}</p>
          </div>

          <div class="section">
            <p><em>Impreso el ${new Date().toLocaleDateString('es-ES')}</em></p>
          </div>
        </body>
      </html>`;

    const ventanaImpresion = window.open('', '_blank', 'width=800,height=600');
    if (!ventanaImpresion) {
      alert('Por favor, permite ventanas emergentes para imprimir');
      return;
    }

    ventanaImpresion.document.write(html);
    ventanaImpresion.document.close();

    ventanaImpresion.onload = function () {
      ventanaImpresion.print();
      setTimeout(() => {
        ventanaImpresion.close();
      }, 500);
    };
  }

  // Función para enviar correo
  function enviarCorreoPedido(pedido) {
    const nombreCliente = obtenerNombreCliente(pedido);
    const asunto = encodeURIComponent(`Detalles del Pedido #${pedido.id}`);
    const cuerpo = encodeURIComponent(
      `Hola,\n\n` +
      `Aquí están los detalles de tu pedido:\n\n` +
      `Pedido: #${pedido.id}\n` +
      `Fecha: ${formatearFechaLarga(pedido.fecha)}\n` +
      `Cliente: ${nombreCliente}\n` +
      `Total: ${formatearMoneda(pedido.total)}\n` +
      `Estado: ${traducirEstado(pedido.estado)}\n\n` +
      `Gracias por tu compra.\n\n` +
      `Saludos,\nEquipo de Meraki`
    );

    window.location.href = `mailto:?subject=${asunto}&body=${cuerpo}`;
  }

  // Función para escapar HTML
  function escaparHTML(texto) {
    if (typeof texto !== "string") return texto;
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
  }

  // Inicializar la carga de pedidos
  cargarPedidos();
});