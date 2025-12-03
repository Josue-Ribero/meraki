// Inicialización cuando el DOM está completamente cargado
document.addEventListener("DOMContentLoaded", () => {
  // Constantes de configuración
  const PEDIDOS_POR_PAGINA = 5;
  let paginaActual = 1;
  let todosLosPedidos = [];

  // Elementos del DOM
  const cuerpoTabla = document.getElementById("cuerpo-tabla");
  const filtroEstado = document.getElementById("filtro-estado");
  const filtroFecha = document.getElementById("filtro-fecha");
  const filtroCliente = document.getElementById("filtro-cliente");
  const filtroIdPedido = document.getElementById("filtro-id-pedido");
  const botonFiltrar = document.getElementById("boton-filtrar");
  const infoResultados = document.querySelector(".info-resultados");
  const elementoPaginacion = document.querySelector(".paginacion");

  // Verificar que los elementos esenciales existan
  if (!cuerpoTabla) {
    return;
  }

  // Obtiene todos los pedidos desde la API del servidor
  async function obtenerPedidos() {
    try {
      const respuesta = await fetch('/pedidos/', {
        method: 'GET',
        credentials: 'include'
      });

      if (!respuesta.ok) {
        const textoError = await respuesta.text();
        throw new Error(`Error ${respuesta.status}: ${textoError}`);
      }

      const pedidos = await respuesta.json();

      // Ordenar pedidos por fecha más reciente primero
      return pedidos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    } catch (error) {
      alert('Error al cargar los pedidos: ' + error.message);
      return [];
    }
  }

  // Obtiene información de un cliente específico por ID
  async function obtenerCliente(clienteID) {
    try {
      const respuesta = await fetch(`/clientes/${clienteID}`, {
        credentials: 'include'
      });

      if (respuesta.ok) {
        return await respuesta.json();
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // Confirma un pedido cambiando su estado a Pagado
  async function confirmarPedido(pedidoID) {
    try {
      const respuesta = await fetch(`/pedidos/${pedidoID}/confirmar`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!respuesta.ok) {
        const textoError = await respuesta.text();
        throw new Error(`Error ${respuesta.status}: ${textoError}`);
      }

      return await respuesta.json();
    } catch (error) {
      alert('Error al confirmar el pedido: ' + error.message);
      throw error;
    }
  }

  // Obtiene información completa de un pedido específico
  async function obtenerInformacionCompletaPedido(pedidoID) {
    try {
      // Obtener pedido con detalles desde el endpoint de administrador
      const respuestaPedido = await fetch(`/pedidos/admin/${pedidoID}`, {
        credentials: 'include'
      });

      if (!respuestaPedido.ok) {
        throw new Error('Error al obtener información del pedido');
      }

      const pedido = await respuestaPedido.json();

      // Obtener información del cliente si está disponible
      let informacionCliente = {};
      if (pedido.clienteID) {
        try {
          const respuestaCliente = await fetch(`/clientes/${pedido.clienteID}`, {
            credentials: 'include'
          });

          if (respuestaCliente.ok) {
            informacionCliente = await respuestaCliente.json();
          }
        } catch (error) {
          return null;
        }
      }

      return {
        pedido,
        detalles: pedido.detalles || [],
        cliente: informacionCliente
      };
    } catch (error) {
      throw error;
    }
  }

  // Muestra el modal con los detalles completos de un pedido
  async function mostrarDetallesPedido(pedidoID) {
    try {
      const modal = document.getElementById('modalDetalles');
      const contenido = document.getElementById('contenidoModalDetalles');
      const titulo = document.getElementById('titulo-modal-detalles');

      // Mostrar estado de carga
      contenido.innerHTML = `
        <div class="text-center py-8">
          <span class="material-symbols-outlined animate-spin text-3xl text-[var(--aa8744)] mb-2">refresh</span>
          <p class="text-gray-600">Cargando detalles del pedido...</p>
        </div>
      `;

      modal.setAttribute('aria-hidden', 'false');
      titulo.textContent = `Detalles del Pedido #${pedidoID}`;

      // Obtener información completa del pedido
      const { pedido, detalles, cliente } = await obtenerInformacionCompletaPedido(pedidoID);

      // Renderizar los detalles en el modal
      renderizarDetallesPedido(pedido, detalles, cliente, contenido);

    } catch (error) {
      const contenido = document.getElementById('contenidoModalDetalles');
      contenido.innerHTML = `
        <div class="text-center py-8 text-red-600">
          <span class="material-symbols-outlined text-3xl mb-2">error</span>
          <p>Error al cargar los detalles del pedido</p>
          <p class="text-sm text-gray-600 mt-2">${error.message}</p>
        </div>
      `;
    }
  }

  // Renderiza los detalles del pedido en el modal usando templates
  function renderizarDetallesPedido(pedido, detalles, cliente, contenedor) {
    const template = document.getElementById('template-detalles-pedido');
    if (!template) {
      return;
    }

    const clone = template.content.cloneNode(true);

    // Llenar información básica del pedido
    clone.querySelector('.id-pedido').textContent = `#${pedido.id}`;
    clone.querySelector('.fecha-pedido').textContent = formatearFechaLarga(pedido.fecha);

    const elementoEstado = clone.querySelector('.estado-pedido');
    elementoEstado.textContent = traducirEstado(pedido.estado);

    // Aplicar clase CSS según el estado
    let claseEstado = '';
    const estadoNormalizado = pedido.estado?.replace(/\s/g, '_') || 'PENDIENTE';

    switch (estadoNormalizado.toUpperCase()) {
      case 'PENDIENTE': claseEstado = 'estado-pendiente'; break;
      case 'PAGADO': claseEstado = 'estado-pagado'; break;
      case 'CANCELADO': claseEstado = 'estado-cancelado'; break;
      case 'POR_PAGAR': claseEstado = 'estado-por-pagar'; break;
      default: claseEstado = 'estado-pendiente'; break;
    }
    elementoEstado.className = `estado-pedido ${claseEstado}`;

    clone.querySelector('.total-pedido').textContent = formatearMoneda(pedido.total || 0);

    // Llenar información del cliente
    const nombreCliente = cliente?.nombre || pedido.cliente?.nombre || 'Cliente no disponible';
    const emailCliente = cliente?.email || pedido.cliente?.email || 'No disponible';
    const telefonoCliente = cliente?.telefono || pedido.cliente?.telefono || 'No disponible';

    clone.querySelector('.nombre-cliente').textContent = nombreCliente;
    clone.querySelector('.email-cliente').textContent = emailCliente;
    clone.querySelector('.telefono-cliente').textContent = telefonoCliente;

    // Llenar información de productos
    const contenedorProductos = clone.querySelector('.contenedor-productos');

    if (!detalles || detalles.length === 0) {
      contenedorProductos.innerHTML = '<p class="text-gray-500 text-center py-4">No hay productos en este pedido</p>';
    } else {
      // Crear tabla para mostrar los productos
      const tabla = document.createElement('table');
      tabla.className = 'tabla-detalles w-full';
      tabla.innerHTML = `
        <thead>
          <tr>
            <th style="text-align: left; padding: 12px 16px;">Producto</th>
            <th style="text-align: center; padding: 12px 16px;">Cantidad</th>
            <th style="text-align: right; padding: 12px 16px;">Precio Unitario</th>
            <th style="text-align: right; padding: 12px 16px;">Subtotal</th>
          </tr>
        </thead>
        <tbody></tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="text-align: right; padding: 15px 16px; border-top: 1px solid var(--d1bc97); font-weight: 600;">Total del Pedido:</td>
            <td style="text-align: right; padding: 15px 16px; border-top: 1px solid var(--d1bc97); font-weight: 600; font-size: 1.1em;">${formatearMoneda(pedido.total || 0)}</td>
          </tr>
        </tfoot>
      `;

      const cuerpoTabla = tabla.querySelector('tbody');

      detalles.forEach(detalle => {
        const nombreProducto = detalle.producto?.nombre ||
          detalle.disenoPersonalizado?.nombre ||
          'Producto personalizado';
        const urlImagen = detalle.producto?.imagenURL ||
          detalle.disenoPersonalizado?.imagenURL ||
          '/static/images/default-product.jpg';

        const fila = document.createElement('tr');
        fila.innerHTML = `
          <td style="padding: 12px 16px; border-bottom: 1px solid var(--d1bc97);">
            <div class="info-producto flex items-center gap-3">
              <img src="${urlImagen}" alt="${nombreProducto}" 
                   class="miniatura-producto w-16 h-16 object-cover rounded-md border border-gray-200"
                   onerror="this.src='/static/images/default-product.jpg'">
              <div class="texto-producto">
                <div class="nombre-producto font-medium text-gray-800">${nombreProducto}</div>
                ${detalle.esPersonalizado ? '<span class="badge-personalizado text-xs text-[var(--aa8744)] bg-[rgba(170,135,68,0.1)] px-2 py-0.5 rounded-full mt-1 inline-block">Personalizado</span>' : ''}
              </div>
            </div>
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid var(--d1bc97); text-align: center; vertical-align: top;">
            ${detalle.cantidad || 0}
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid var(--d1bc97); text-align: right; vertical-align: top;">
            ${formatearMoneda(detalle.precioUnidad || 0)}
          </td>
          <td style="padding: 12px 16px; border-bottom: 1px solid var(--d1bc97); text-align: right; vertical-align: top; font-weight: 600;">
            ${formatearMoneda(detalle.subtotal || 0)}
          </td>
        `;

        cuerpoTabla.appendChild(fila);
      });

      contenedorProductos.appendChild(tabla);
    }

    contenedor.innerHTML = '';
    contenedor.appendChild(clone);
  }

  // Cierra el modal de detalles
  function cerrarModalDetalles() {
    const modal = document.getElementById('modalDetalles');
    modal.setAttribute('aria-hidden', 'true');
  }

  // Genera e imprime un documento con los detalles del pedido
  async function imprimirPedido(pedidoID) {
    try {
      // Obtener información completa del pedido
      const { pedido, detalles, cliente } = await obtenerInformacionCompletaPedido(pedidoID);

      // Crear ventana de impresión
      const ventanaImpresion = window.open('', '_blank', 'width=800,height=600');
      if (!ventanaImpresion) {
        alert('Por favor, permite ventanas emergentes para imprimir');
        return;
      }

      // Construir contenido HTML
      const contenidoHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Pedido #${pedido.id} - Meraki</title>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
              line-height: 1.4;
            }
            .encabezado {
              text-align: center;
              border-bottom: 3px solid #aa8744;
              padding-bottom: 15px;
              margin-bottom: 25px;
            }
            .encabezado h1 {
              margin: 0;
              color: #363636;
              font-size: 24px;
            }
            .grid-info {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 15px;
              margin-bottom: 20px;
            }
            .item-info {
              background: #f9f9f9;
              padding: 12px;
              border-radius: 6px;
              border-left: 3px solid #aa8744;
            }
            .info-cliente {
              background: #f0f7ff;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .tabla-productos {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              font-size: 14px;
            }
            .tabla-productos th,
            .tabla-productos td {
              border: 1px solid #ddd;
              padding: 12px 8px;
              text-align: left;
            }
            .tabla-productos th {
              background-color: #fdfbf3;
              color: #9c642d;
              font-weight: bold;
              text-transform: uppercase;
              font-size: 12px;
            }
            .tabla-productos .text-center {
              text-align: center;
            }
            .tabla-productos .text-right {
              text-align: right;
            }
            .fila-total {
              font-weight: bold;
              font-size: 1.2em;
              background-color: #f8f8f8;
            }
            .pie-pagina {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              color: #666;
              font-size: 12px;
            }
            .badge-personalizado {
              background: rgba(170, 135, 68, 0.1);
              color: #aa8744;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 10px;
              margin-left: 8px;
            }
            .miniatura-imprimir {
              width: 40px;
              height: 40px;
              object-fit: cover;
              border-radius: 4px;
              border: 1px solid #ddd;
              margin-right: 10px;
            }
            .info-producto-imprimir {
              display: flex;
              align-items: center;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="encabezado">
            <h1>Meraki - Pedido #${pedido.id}</h1>
            <p>Fecha: ${formatearFechaLarga(pedido.fecha)} | Estado: ${traducirEstado(pedido.estado)}</p>
          </div>

          <div class="grid-info">
            <div class="item-info">
              <strong>Número de Pedido:</strong><br>#${pedido.id}
            </div>
            <div class="item-info">
              <strong>Fecha:</strong><br>${formatearFechaLarga(pedido.fecha)}
            </div>
            <div class="item-info">
              <strong>Estado:</strong><br>${traducirEstado(pedido.estado)}
            </div>
            <div class="item-info">
              <strong>Total:</strong><br>${formatearMoneda(pedido.total || 0)}
            </div>
          </div>

          <div class="info-cliente">
            <h3 style="margin-top: 0; color: #9c642d;">Información del Cliente</h3>
            <p><strong>Nombre:</strong> ${cliente?.nombre || pedido.cliente?.nombre || 'Cliente no disponible'}</p>
            <p><strong>Email:</strong> ${cliente?.email || pedido.cliente?.email || 'No disponible'}</p>
            <p><strong>Teléfono:</strong> ${cliente?.telefono || pedido.cliente?.telefono || 'No disponible'}</p>
          </div>

          <h3 style="margin-top: 0; color: #9c642d;">Productos del Pedido</h3>
          <table class="tabla-productos">
            <thead>
              <tr>
                <th style="width: 45%;">Producto</th>
                <th style="width: 15%; text-align: center;">Cantidad</th>
                <th style="width: 20%; text-align: right;">Precio Unitario</th>
                <th style="width: 20%; text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${detalles.map(detalle => {
        const nombreProducto = detalle.producto?.nombre ||
          detalle.disenoPersonalizado?.nombre ||
          'Producto personalizado';
        const urlImagen = detalle.producto?.imagenURL ||
          detalle.disenoPersonalizado?.imagenURL ||
          '/static/images/default-product.jpg';
        const esPersonalizado = detalle.esPersonalizado;

        return `
                  <tr>
                    <td>
                      <div class="info-producto-imprimir">
                        <img src="${urlImagen}" alt="${nombreProducto}" 
                             class="miniatura-imprimir"
                             onerror="this.src='/static/images/default-product.jpg'">
                        <div>
                          ${nombreProducto}
                          ${esPersonalizado ? '<span class="badge-personalizado">Personalizado</span>' : ''}
                        </div>
                      </div>
                    </td>
                    <td style="text-align: center;">${detalle.cantidad || 0}</td>
                    <td style="text-align: right;">${formatearMoneda(detalle.precioUnidad || 0)}</td>
                    <td style="text-align: right; font-weight: bold;">${formatearMoneda(detalle.subtotal || 0)}</td>
                  </tr>
                `;
      }).join('')}
            </tbody>
            <tfoot>
              <tr class="fila-total">
                <td colspan="3" style="text-align: right; padding: 15px 8px;"><strong>Total del Pedido:</strong></td>
                <td style="text-align: right; padding: 15px 8px;"><strong>${formatearMoneda(pedido.total || 0)}</strong></td>
              </tr>
            </tfoot>
          </table>

          <div class="pie-pagina">
            <p><em>Documento generado el ${new Date().toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</em></p>
            <p>Meraki - Joyería Artesanal</p>
          </div>
        </body>
        </html>
      `;

      // Escribir el contenido en la ventana
      ventanaImpresion.document.write(contenidoHTML);
      ventanaImpresion.document.close();

      // Esperar a que cargue el contenido y luego imprimir
      ventanaImpresion.onload = function () {
        setTimeout(() => {
          ventanaImpresion.print();
          // No cerrar automáticamente para que el usuario pueda ver el preview
        }, 500);
      };

    } catch (error) {
      alert('Error al imprimir el pedido: ' + error.message);
    }
  }

  // Funciones de utilidad

  // Formatea una fecha ISO a formato largo en español
  function formatearFechaLarga(fechaISO) {
    if (!fechaISO) return "Fecha no disponible";
    try {
      const fecha = new Date(fechaISO);
      return fecha.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    } catch (error) {
      return "Fecha inválida";
    }
  }

  // Formatea una cantidad como moneda en pesos colombianos
  function formatearMoneda(cantidad) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(cantidad || 0);
  }

  // Devuelve las clases CSS apropiadas para el badge de estado
  function obtenerClasesBadge(estado) {
    const estadoNormalizado = estado?.replace(/\s/g, '_') || 'PENDIENTE';

    switch (estadoNormalizado.toUpperCase()) {
      case "PENDIENTE":
        return "badge-estado bg-pendiente";
      case "POR_PAGAR":
        return "badge-estado bg-por-pagar";
      case "PAGADO":
        return "badge-estado bg-pagado";
      case "CANCELADO":
        return "badge-estado bg-cancelado";
      default:
        return "badge-estado bg-pendiente";
    }
  }

  // Traduce los estados del pedido al español
  function traducirEstado(estado) {
    if (!estado) return "Desconocido";

    const estadoNormalizado = estado.replace(/\s/g, '_').toUpperCase();

    const mapaEstados = {
      'PAGADO': 'Pagado',
      'PENDIENTE': 'Pendiente',
      'POR_PAGAR': 'Por pagar',
      'CANCELADO': 'Cancelado'
    };

    return mapaEstados[estadoNormalizado] || estado;
  }

  // Obtiene el nombre del cliente desde diferentes fuentes de datos
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

  // Aplica los filtros seleccionados a la lista de pedidos y mantiene el orden por fecha
  function aplicarFiltros() {
    const estado = filtroEstado.value || "Todos";
    const fecha = filtroFecha.value || "";
    const cliente = (filtroCliente.value || "").trim().toLowerCase();
    const idPedido = (filtroIdPedido.value || "").trim();

    const pedidosFiltrados = todosLosPedidos.filter(pedido => {
      // Filtrar por estado
      if (estado !== "Todos") {
        const mapaEstados = {
          'Pagado': 'PAGADO',
          'Pendiente': 'PENDIENTE',
          'Por pagar': 'POR_PAGAR',
          'Cancelado': 'CANCELADO'
        };

        const estadoFiltro = mapaEstados[estado];
        const estadoPedidoNormalizado = (pedido.estado || '').replace(/\s/g, '_').toUpperCase();
        const estadoFiltroNormalizado = (estadoFiltro || '').replace(/\s/g, '_').toUpperCase();

        if (estadoPedidoNormalizado !== estadoFiltroNormalizado) return false;
      }

      // Filtrar por fecha
      if (fecha && pedido.fecha && !pedido.fecha.startsWith(fecha)) return false;

      // Filtrar por cliente
      if (cliente) {
        const nombreCliente = obtenerNombreCliente(pedido).toLowerCase();
        if (!nombreCliente.includes(cliente)) return false;
      }

      // Filtrar por ID de pedido
      if (idPedido) {
        const idPedidoStr = pedido.id.toString();
        if (!idPedidoStr.includes(idPedido)) return false;
      }

      return true;
    });

    // Asegurar que los pedidos filtrados mantengan el orden por fecha (más reciente primero)
    return pedidosFiltrados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }

  // Escapa caracteres HTML para prevenir XSS
  function escaparHTML(texto) {
    if (typeof texto !== "string") return texto;
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
  }

  // Renderiza la tabla de pedidos con paginación
  async function renderizarTabla() {
    const pedidosFiltrados = aplicarFiltros();
    const totalPedidos = pedidosFiltrados.length;
    const totalPaginas = Math.max(1, Math.ceil(totalPedidos / PEDIDOS_POR_PAGINA));
    if (paginaActual > totalPaginas) paginaActual = totalPaginas;

    const inicio = (paginaActual - 1) * PEDIDOS_POR_PAGINA;
    const pedidosPagina = pedidosFiltrados.slice(inicio, inicio + PEDIDOS_POR_PAGINA);

    cuerpoTabla.innerHTML = "";

    if (pedidosPagina.length === 0) {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">
          ${todosLosPedidos.length === 0 ? 'Cargando pedidos...' : 'No se encontraron pedidos con los filtros aplicados'}
        </td>
      `;
      cuerpoTabla.appendChild(fila);
    }

    for (const pedido of pedidosPagina) {
      const fila = document.createElement("tr");
      fila.className = "hover:bg-gray-50";

      const mostrarConfirmar = pedido.estado === 'PENDIENTE' || pedido.estado === 'POR_PAGAR';
      const nombreCliente = obtenerNombreCliente(pedido);

      fila.innerHTML = `
        <td class="px-2 py-4 text-sm font-medium text-[var(--c-363636)] text-center">#${pedido.id}</td>
        <td class="px-2 py-4 text-sm text-center">${formatearFechaLarga(pedido.fecha)}</td>
        <td class="px-2 py-4 text-sm text-center cliente-nombre">${escaparHTML(nombreCliente)}</td>
        <td class="px-2 py-4 text-sm text-center">${formatearMoneda(pedido.total)}</td>
        <td class="px-2 py-4 text-center">
          <span class="${obtenerClasesBadge(pedido.estado)}">${traducirEstado(pedido.estado)}</span>
        </td>
        <td class="px-2 py-4 text-center">
          <div class="contenedor-acciones">
            ${mostrarConfirmar ? `
              <button class="boton-accion confirmar boton-confirmar" data-id="${pedido.id}" title="Confirmar Pedido">
                <span class="material-symbols-outlined text-base">check_circle</span>
              </button>
            ` : ''}
            <button class="boton-accion detalles boton-detalles" data-id="${pedido.id}" title="Ver Detalles">
              <span class="material-symbols-outlined text-base">visibility</span>
            </button>
            <button class="boton-accion imprimir boton-imprimir" data-id="${pedido.id}" title="Imprimir">
              <span class="material-symbols-outlined text-base">print</span>
            </button>
          </div>
        </td>
      `;
      cuerpoTabla.appendChild(fila);

      // Cargar información del cliente si no está disponible
      if ((!pedido.cliente || !pedido.cliente.nombre) && pedido.clienteID && nombreCliente === 'Cargando...') {
        cargarYActualizarCliente(pedido.id, pedido.clienteID, fila);
      }
    }

    if (infoResultados) {
      const inicio = (paginaActual - 1) * PEDIDOS_POR_PAGINA + 1;
      const fin = Math.min(inicio + PEDIDOS_POR_PAGINA - 1, totalPedidos);
      infoResultados.textContent = `Mostrando ${inicio}-${fin} de ${totalPedidos} pedidos`;
    }
    renderizarPaginacion(totalPaginas);
  }

  // Carga y actualiza la información del cliente en una fila
  async function cargarYActualizarCliente(pedidoID, clienteID, fila) {
    try {
      const cliente = await obtenerCliente(clienteID);
      if (cliente && cliente.nombre) {
        const indicePedido = todosLosPedidos.findIndex(p => p.id === pedidoID);
        if (indicePedido !== -1) {
          if (!todosLosPedidos[indicePedido].cliente) {
            todosLosPedidos[indicePedido].cliente = {};
          }
          todosLosPedidos[indicePedido].cliente.nombre = cliente.nombre;
        }
        const celdaCliente = fila.querySelector('.cliente-nombre');
        if (celdaCliente) {
          celdaCliente.textContent = cliente.nombre;
        }
      }
    } catch (error) {
    }
  }

  // Renderiza los controles de paginación
  function renderizarPaginacion(totalPaginas) {
    if (!elementoPaginacion) return;
    elementoPaginacion.innerHTML = "";

    const botonAnterior = document.createElement("button");
    botonAnterior.textContent = "Anterior";
    botonAnterior.className = "boton-pagina";
    botonAnterior.disabled = paginaActual === 1;
    botonAnterior.addEventListener("click", () => {
      if (paginaActual > 1) {
        paginaActual--;
        renderizarTabla();
      }
    });
    elementoPaginacion.appendChild(botonAnterior);

    const maxBotones = 5;
    let inicio = Math.max(1, paginaActual - Math.floor(maxBotones / 2));
    let fin = Math.min(totalPaginas, inicio + maxBotones - 1);

    if (fin - inicio + 1 < maxBotones) {
      inicio = Math.max(1, fin - maxBotones + 1);
    }

    for (let i = inicio; i <= fin; i++) {
      const botonPagina = document.createElement("button");
      botonPagina.textContent = i;
      botonPagina.className = "boton-pagina" + (i === paginaActual ? " activo" : "");
      botonPagina.addEventListener("click", () => {
        paginaActual = i;
        renderizarTabla();
      });
      elementoPaginacion.appendChild(botonPagina);
    }

    const botonSiguiente = document.createElement("button");
    botonSiguiente.textContent = "Siguiente";
    botonSiguiente.className = "boton-pagina";
    botonSiguiente.disabled = paginaActual === totalPaginas;
    botonSiguiente.addEventListener("click", () => {
      if (paginaActual < totalPaginas) {
        paginaActual++;
        renderizarTabla();
      }
    });
    elementoPaginacion.appendChild(botonSiguiente);
  }

  /**
   * Carga todos los pedidos y renderiza la tabla
   */
  async function cargarPedidos() {
    try {
      todosLosPedidos = await obtenerPedidos();
      renderizarTabla();
    } catch (error) {
    }
  }

  // Manejadores de eventos

  cuerpoTabla.addEventListener("click", async (e) => {
    const boton = e.target.closest("button");
    if (!boton) return;

    const id = boton.dataset.id;
    if (!id) return;

    const pedido = todosLosPedidos.find(p => p.id == id);
    if (!pedido) return;

    if (boton.classList.contains("boton-confirmar")) {
      if (confirm('¿Estás seguro de que deseas confirmar este pedido? Esta acción cambiará el estado a "PAGADO".')) {
        try {
          boton.disabled = true;
          boton.innerHTML = '<span class="material-symbols-outlined animate-spin text-base">refresh</span>';
          await confirmarPedido(id);
          alert('Pedido confirmado exitosamente');
          await cargarPedidos();
        } catch (error) {
          alert('Error al confirmar el pedido: ' + error.message);
          boton.disabled = false;
          boton.innerHTML = '<span class="material-symbols-outlined text-base">check_circle</span>';
        }
      }
    }
    else if (boton.classList.contains("boton-detalles")) {
      mostrarDetallesPedido(id);
    }
    else if (boton.classList.contains("boton-imprimir")) {
      await imprimirPedido(id);
    }
  });

  if (botonFiltrar) {
    botonFiltrar.addEventListener("click", () => {
      paginaActual = 1;
      renderizarTabla();
    });
  }

  [filtroEstado, filtroFecha, filtroCliente, filtroIdPedido].forEach(elemento => {
    if (elemento) {
      elemento.addEventListener("change", () => {
        paginaActual = 1;
        renderizarTabla();
      });
      elemento.addEventListener("input", () => {
        paginaActual = 1;
        renderizarTabla();
      });
    }
  });

  // Inicialización
  const modal = document.getElementById('modalDetalles');
  const botonCerrar1 = document.getElementById('botonCerrarModal');
  const botonCerrar2 = document.getElementById('botonCerrarModal2');

  if (botonCerrar1) botonCerrar1.addEventListener('click', cerrarModalDetalles);
  if (botonCerrar2) botonCerrar2.addEventListener('click', cerrarModalDetalles);

  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) cerrarModalDetalles();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal && modal.getAttribute('aria-hidden') === 'false') {
      cerrarModalDetalles();
    }
  });

  // Cargar pedidos al iniciar
  cargarPedidos();
});