document.addEventListener('DOMContentLoaded', async () => {
  // Elementos
  const productosContainer = document.getElementById('productos-pedido');
  const pedidoIdElem = document.getElementById('pedido-id');
  const pedidoEstadoElem = document.getElementById('pedido-estado');
  const pedidoTotalElem = document.getElementById('pedido-total');
  const pedidoFechaElem = document.getElementById('pedido-fecha');
  const pedidoDireccionElem = document.getElementById('pedido-direccion');
  const resumenProductos = document.getElementById('resumen-productos');
  const resumenSubtotal = document.getElementById('resumen-subtotal');
  const resumenEnvio = document.getElementById('resumen-envio');
  const resumenTotal = document.getElementById('resumen-total');
  const cancelarPedidoBtn = document.getElementById('cancelar-pedido-btn');
  const continuarPagoBtn = document.getElementById('continuar-pago-btn');

  // Función para formatear el precio
  const formatCOP = (valor) => {
    try {
      return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(valor) || 0);
    } catch { return `$${Number(valor) || 0}`; }
  };

  // Función para formatear fecha
  const formatFecha = (fechaString) => {
    if (!fechaString) return '-';
    try {
      const fecha = new Date(fechaString);
      return fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return fechaString;
    }
  };

  // Función para cancelar pedido
  async function cancelarPedido() {
    if (!pedidoID) {
      alert('No se puede cancelar el pedido: ID no disponible');
      return;
    }

    // Confirmar cancelación
    if (!confirm('¿Estás seguro de que deseas cancelar este pedido? Esta acción no se puede deshacer.')) {
      return;
    }

    // Cancelar pedido
    try {
      const response = await fetch(`/pedidos/${pedidoID}/cancelar`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al cancelar el pedido');
      }

      const pedidoCancelado = await response.json();

      // Actualizar la interfaz
      pedidoEstadoElem.textContent = pedidoCancelado.estado;
      pedidoEstadoElem.classList.add('text-red-600');

      // Deshabilitar el botón de cancelar
      cancelarPedidoBtn.disabled = true;
      cancelarPedidoBtn.classList.add('opacity-50', 'cursor-not-allowed');
      cancelarPedidoBtn.textContent = 'Pedido cancelado';

      // Mostrar mensaje de éxito
      alert('Pedido cancelado exitosamente');

      // Actualizar también el mensaje de éxito
      const successMessage = document.querySelector('.bg-green-50');
      if (successMessage) {
        successMessage.innerHTML = `
          <p class="text-red-700 text-sm text-center">
            <span class="material-symbols-outlined align-middle text-base">cancel</span>
            Pedido cancelado exitosamente
          </p>
        `;
        successMessage.classList.remove('bg-green-50', 'border-green-200');
        successMessage.classList.add('bg-red-50', 'border-red-200');
      }

    } catch (error) {
      console.error('Error al cancelar el pedido:', error);
      alert('Error al cancelar el pedido: ' + error.message);
    }
  }

  // Asignar evento al botón de cancelar
  if (cancelarPedidoBtn) {
    cancelarPedidoBtn.addEventListener('click', cancelarPedido);
  }

  // Mostrar mensaje de carga
  productosContainer.innerHTML = "<div class='text-center py-8 text-gray-500'>Cargando productos...</div>";

  // Obtener el id del pedido desde query string (acepta 'id' o 'pedidoId')
  const params = new URLSearchParams(window.location.search);
  const pedidoID = params.get('id') || params.get('pedidoId');
  if (!pedidoID) {
    alert('No se encontró el pedido.');
    productosContainer.innerHTML = "<div class='text-center py-8 text-red-500'>No se encontró el pedido.</div>";
    return;
  }

  // Obtener detalles del pedido
  try {
    const response = await fetch(`/pedidos/mi-pedido/${pedidoID}`, {
      credentials: 'include'
    });
    if (!response.ok) {
      let msg = 'No se pudo obtener el pedido';
      if (response.status === 404) msg = 'Pedido no encontrado';
      throw new Error(msg);
    }
    const pedido = await response.json();

    // Renderizar datos en la página
    pedidoIdElem.textContent = pedido.id ?? '-';
    pedidoEstadoElem.textContent = pedido.estado ?? '-';
    pedidoTotalElem.textContent = pedido.total ? formatCOP(pedido.total) : '-';

    // Mostrar fecha formateada
    pedidoFechaElem.textContent = formatFecha(pedido.fecha);

    const direccionContainer = document.getElementById('direccion-container');
    if (pedido.direccionEnvio) {
      pedidoDireccionElem.textContent = `${pedido.direccionEnvio.nombre}, ${pedido.direccionEnvio.calle}, ${pedido.direccionEnvio.localidad} (${pedido.direccionEnvio.codigoPostal})`;
      if (direccionContainer) direccionContainer.style.display = 'block';
    } else {
      pedidoDireccionElem.textContent = '';
      if (direccionContainer) direccionContainer.style.display = 'none';
    }

    // Si el pedido ya está cancelado, deshabilitar el botón
    if (pedido.estado === 'CANCELADO' && cancelarPedidoBtn || pedido.estado === 'PAGADO' && cancelarPedidoBtn) {
      cancelarPedidoBtn.disabled = true;
      cancelarPedidoBtn.classList.add('opacity-50', 'cursor-not-allowed');
      cancelarPedidoBtn.textContent = 'Pedido cancelado';
    }

    // Ajustar comportamiento del botón "Continuar al pago" según el estado del pedido
    if (continuarPagoBtn) {
      const estadoRaw = pedido.estado ? String(pedido.estado) : '';
      const estado = estadoRaw.trim().toLowerCase();
      // Log para depuración: muestra el estado tal cual viene y la forma normalizada
      console.debug('procesoPagoDetalles: pedido.estado raw / normalized ->', { estadoRaw, estado, pedidoId: pedido.id });

      // Comprobaciones robustas contra variantes del estado (mayúsculas, espacios, diferentes palabras)
      if (estado.includes('pendient')) {
        continuarPagoBtn.textContent = 'Volver a la tienda';
        // Ruta de la tienda principal (ajustable si prefieres otra)
        continuarPagoBtn.setAttribute('href', '/');
      } else if (estado.includes('proces') || estado.includes('en proceso')) {
        continuarPagoBtn.textContent = 'Ver mis pedidos';
        continuarPagoBtn.setAttribute('href', '/personal');
      } else if (estado.includes('proces') || estado.includes('cancelado') || estado.includes('pagado')) {
        continuarPagoBtn.textContent = 'Ver mis pedidos';
        continuarPagoBtn.setAttribute('href', '/personal');
      } else {
        // Enlace por defecto al proceso de pago con el id del pedido
        continuarPagoBtn.setAttribute('href', `/proceso-pago?id=${pedido.id}`);
      }
    } else {
      console.debug('procesoPagoDetalles: continuarPagoBtn no encontrado en el DOM');
    }

    // Productos (lista principal)
    productosContainer.innerHTML = '';
    if (pedido.productos && pedido.productos.length) {
      pedido.productos.forEach(prod => {
        productosContainer.innerHTML += `
          <div class='flex items-center gap-4 mb-2'>
            <img src='${prod.img}' alt='' class='w-12 h-12 object-cover rounded-md border'>
            <div class='flex-1'>
              <div class='font-medium'>${prod.name}</div>
              <div class='text-xs text-gray-500'>Cantidad: ${prod.qty}</div>
            </div>
            <div class='text-right font-semibold'>${formatCOP(prod.price)}</div>
          </div>`;
      });
    } else {
      productosContainer.innerHTML = "<div class='text-center py-8 text-gray-500'>No hay productos en este pedido.</div>";
    }

    // Resumen del pedido
    resumenProductos.innerHTML = '';
    let subtotal = Number(pedido.subtotal) || 0;
    if (pedido.productos && pedido.productos.length) {
      pedido.productos.forEach(prod => {
        const lineTotal = (Number(prod.price) || 0);
        resumenProductos.innerHTML += `
          <div class='flex items-center gap-4 mb-4'>
            <div class='bg-center bg-no-repeat bg-cover rounded-md w-16 h-16 flex items-center justify-center'>
              <img src='${prod.img}' alt='Foto producto' class='w-14 h-14 object-cover rounded-md' />
            </div>
            <div class='flex-1'>
              <p class='font-semibold'>${prod.name}</p>
              <p class='text-sm text-gray-500'>Cantidad: ${prod.qty}</p>
            </div>
            <p class='font-semibold'>${formatCOP(lineTotal)}</p>
          </div>`;
      });
    }
    const total = Number(pedido.total) || subtotal;
    const envio = Number(pedido.envio);
    resumenSubtotal.textContent = formatCOP(subtotal);
    resumenEnvio.textContent = envio === 0 ? 'Gratis' : formatCOP(envio);
    resumenTotal.textContent = formatCOP(total);
  } catch (error) {
    productosContainer.innerHTML = `<div class='text-center py-8 text-red-500'>${error.message}</div>`;
    alert('Error al cargar el pedido: ' + error.message);
  }
});