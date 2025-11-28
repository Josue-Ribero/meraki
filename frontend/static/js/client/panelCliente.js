const slider = document.getElementById("sliderPuntos");
const puntos = document.getElementById("valorPuntos");
const descuento = document.getElementById("valorDescuento");

if (slider) {
  slider.addEventListener("input", () => {
    const valor = slider.value;
    puntos.textContent = valor;
    descuento.textContent = `S/ ${(valor / 10).toFixed(2)}`;
  });
}

// Variables para paginación
let pedidosActuales = [];
let paginaActual = 1;
const pedidosPorPagina = 10;

// Mostrar info del cliente y pedidos
document.addEventListener('DOMContentLoaded', async () => {
  let clienteInfo = null;
  const passwordForm = document.getElementById('form-cambiar-contrasena');
  const cancelPassBtn = document.getElementById('btn-cancelar-pass');
  const msgBox = document.getElementById('msg-contrasena');

  const clearPassMsg = () => {
    if (!msgBox) return;
    msgBox.textContent = '';
    msgBox.classList.remove('msg-success', 'msg-error');
    msgBox.style.display = 'none';
  };

  const showPassMsg = (message, type = 'success') => {
    if (!msgBox) return;
    msgBox.textContent = message;
    msgBox.classList.remove('msg-success', 'msg-error');
    msgBox.classList.add(type === 'error' ? 'msg-error' : 'msg-success');
    // Asegurar que sea visible tras clearPassMsg (que usa display:none)
    msgBox.style.display = 'block';
  };

  clearPassMsg();

  // Fetch info cliente y llenar panel visual
  try {
    const respCliente = await fetch('/clientes/mi-perfil', { credentials: 'include' });
    if (respCliente.ok) {
      clienteInfo = await respCliente.json();
      // Llenar los inputs del panel de información personal
      if (document.getElementById('name')) {
        document.getElementById('name').value = clienteInfo.nombre || '';
      }
      if (document.getElementById('phone')) {
        document.getElementById('phone').value = clienteInfo.telefono || '';
      }
    }
  } catch { }

  if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearPassMsg();

      if (!clienteInfo) {
        showPassMsg('No pudimos cargar tus datos. Intenta nuevamente.', 'error');
        return;
      }

      const nueva = document.getElementById('new_password').value.trim();
      const confirmar = document.getElementById('confirm_password').value.trim();

      if (!nueva || !confirmar) {
        showPassMsg('Por favor ingresa y confirma la nueva contraseña.', 'error');
        return;
      }
      if (nueva !== confirmar) {
        showPassMsg('Las contraseñas no coinciden.', 'error');
        document.getElementById('new_password').value = '';
        document.getElementById('confirm_password').value = '';
        document.getElementById('new_password').focus();
        return;
      }

      const guardarBtn = passwordForm.querySelector('.btn-guardar');
      const guardarTexto = guardarBtn ? guardarBtn.textContent : '';
      if (guardarBtn) {
        guardarBtn.disabled = true;
        guardarBtn.textContent = 'Guardando...';
      }

      try {
        const resp = await fetch(`/clientes/${clienteInfo.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ contrasena: nueva }),
          credentials: 'include'
        });

        if (resp.ok) {
          showPassMsg('¡Cambio exitoso! Tu contraseña ha sido actualizada.', 'success');
          document.getElementById('new_password').value = '';
          document.getElementById('confirm_password').value = '';
        } else {
          let errorMsg = 'Error al actualizar la contraseña.';
          try {
            const errorData = await resp.json();
            if (errorData?.detail) errorMsg = errorData.detail;
          } catch { }
          showPassMsg(errorMsg, 'error');
        }
      } catch (error) {
        showPassMsg('Error de conexión al actualizar la contraseña.', 'error');
      } finally {
        if (guardarBtn) {
          guardarBtn.disabled = false;
          guardarBtn.textContent = guardarTexto || 'Guardar Cambios';
        }
      }
    });
  }

  if (cancelPassBtn) {
    cancelPassBtn.addEventListener('click', () => {
      document.getElementById('new_password').value = '';
      document.getElementById('confirm_password').value = '';
      clearPassMsg();
    });
  }

  // Cargar pedidos
  await cargarPedidos();

  // Tabs
  const tabPedidos = document.getElementById('tab-pedidos');
  const tabInfoPersonal = document.getElementById('tab-info-personal');
  const pedidosSection = document.getElementById('pedidos-cliente');
  const infoPersonalSection = document.getElementById('info-personal');
  // Mostrar según la pestaña que tenga la clase `active-tab`.
  // Por defecto se muestra la sección de Información Personal.
  const activeBtn = document.querySelector('.tabs button.active-tab');
  const mostrarPedidos = activeBtn ? activeBtn.id === 'tab-pedidos' : false;
  if (pedidosSection && infoPersonalSection) {
    pedidosSection.style.display = mostrarPedidos ? '' : 'none';
    infoPersonalSection.style.display = mostrarPedidos ? 'none' : '';
  }

  if (tabPedidos && tabInfoPersonal && pedidosSection && infoPersonalSection) {
    tabPedidos.addEventListener('click', () => {
      pedidosSection.style.display = '';
      infoPersonalSection.style.display = 'none';
      tabPedidos.classList.add('active-tab');
      tabInfoPersonal.classList.remove('active-tab');
    });
    tabInfoPersonal.addEventListener('click', () => {
      pedidosSection.style.display = 'none';
      infoPersonalSection.style.display = '';
      tabInfoPersonal.classList.add('active-tab');
      tabPedidos.classList.remove('active-tab');
    });
  }
});

// Función para cargar pedidos
async function cargarPedidos() {
  try {
    const respPedidos = await fetch('/pedidos/mis-pedidos', { credentials: 'include' });
    if (respPedidos.ok) {
      pedidosActuales = await respPedidos.json();
      actualizarEstadisticasPedidos();
      mostrarPaginaPedidos(1);
    }
  } catch (error) {
    console.error('Error cargando pedidos:', error);
    document.getElementById('tabla-pedidos').innerHTML =
      '<tr><td colspan="5">Error al cargar los pedidos. Intenta nuevamente.</td></tr>';
  }
}

// Función para actualizar estadísticas
function actualizarEstadisticasPedidos() {
  const statsElement = document.getElementById('pedidos-stats');
  if (!statsElement) return;

  const totalPedidos = pedidosActuales.length;
  const pedidosPagados = pedidosActuales.filter(p => p.estado === 'PAGADO').length;
  const pedidosPendientes = pedidosActuales.filter(p => p.estado === 'PENDIENTE').length;

  statsElement.innerHTML = `
    <strong>Total:</strong> ${totalPedidos} pedidos | 
    <strong>Pagados:</strong> ${pedidosPagados} | 
    <strong>Pendientes:</strong> ${pedidosPendientes}
  `;
}

// Función para mostrar una página específica de pedidos
function mostrarPaginaPedidos(pagina) {
  paginaActual = pagina;
  const inicio = (pagina - 1) * pedidosPorPagina;
  const fin = inicio + pedidosPorPagina;
  const pedidosPagina = pedidosActuales.slice(inicio, fin);

  const tbody = document.getElementById('tabla-pedidos');
  const sinPedidosElement = document.getElementById('sin-pedidos');

  // Mostrar/ocultar mensaje de sin pedidos
  if (pedidosActuales.length === 0) {
    tbody.innerHTML = '';
    sinPedidosElement.classList.remove('hidden');
    document.getElementById('paginacion-pedidos').innerHTML = '';
    return;
  } else {
    sinPedidosElement.classList.add('hidden');
  }

  // Generar tabla de pedidos
  tbody.innerHTML = '';
  pedidosPagina.forEach(pedido => {
    const fila = document.createElement('tr');

    // Determinar clase de estado
    let claseEstado = 'estado-pedido ';
    switch (pedido.estado) {
      case 'PAGADO':
        claseEstado += 'estado-pagado';
        break;
      case 'PENDIENTE':
        claseEstado += 'estado-pendiente';
        break;
      case 'ENVIADO':
        claseEstado += 'estado-enviado';
        break;
      case 'COMPLETADO':
        claseEstado += 'estado-completado';
        break;
      case 'CANCELADO':
        claseEstado += 'estado-cancelado';
        break;
      default:
        claseEstado += 'estado-pendiente';
    }

    fila.innerHTML = `
      <td><strong>#${pedido.id}</strong></td>
      <td>${pedido.fecha ? new Date(pedido.fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }) : '-'}</td>
      <td><span class="${claseEstado}">${pedido.estado || 'PENDIENTE'}</span></td>
      <td><strong>$${(pedido.total || 0).toLocaleString('es-CO')}</strong></td>
      <td>
        <a href="/proceso-pago-detalles?id=${pedido.id}" class="btn-ver">
          <span class="material-symbols-outlined" style="font-size: 16px;">visibility</span>
          Ver
        </a>
      </td>
    `;
    tbody.appendChild(fila);
  });

  // Generar paginación
  generarPaginacion();
}

// Función para generar controles de paginación
function generarPaginacion() {
  const totalPaginas = Math.ceil(pedidosActuales.length / pedidosPorPagina);
  const paginacionElement = document.getElementById('paginacion-pedidos');

  if (totalPaginas <= 1) {
    paginacionElement.innerHTML = '';
    return;
  }

  let paginacionHTML = '';

  // Botón anterior
  if (paginaActual > 1) {
    paginacionHTML += `<button class="btn-pagina" onclick="mostrarPaginaPedidos(${paginaActual - 1})">
      <span class="material-symbols-outlined" style="font-size: 16px;">chevron_left</span>
    </button>`;
  } else {
    paginacionHTML += `<button class="btn-pagina" disabled>
      <span class="material-symbols-outlined" style="font-size: 16px;">chevron_left</span>
    </button>`;
  }

  // Números de página
  const paginasMostrar = [];
  const paginasALado = 2;

  for (let i = 1; i <= totalPaginas; i++) {
    if (
      i === 1 ||
      i === totalPaginas ||
      (i >= paginaActual - paginasALado && i <= paginaActual + paginasALado)
    ) {
      paginasMostrar.push(i);
    } else if (
      i === paginaActual - paginasALado - 1 ||
      i === paginaActual + paginasALado + 1
    ) {
      paginasMostrar.push('...');
    }
  }

  // Eliminar duplicados de "..." consecutivos
  const paginasUnicas = [];
  for (let i = 0; i < paginasMostrar.length; i++) {
    if (paginasMostrar[i] !== paginasMostrar[i - 1]) {
      paginasUnicas.push(paginasMostrar[i]);
    }
  }

  paginasUnicas.forEach(pagina => {
    if (pagina === '...') {
      paginacionHTML += `<span class="btn-pagina" style="border: none; background: transparent;">...</span>`;
    } else {
      const esActiva = pagina === paginaActual;
      paginacionHTML += `<button class="btn-pagina ${esActiva ? 'active' : ''}" 
        onclick="mostrarPaginaPedidos(${pagina})">${pagina}</button>`;
    }
  });

  // Botón siguiente
  if (paginaActual < totalPaginas) {
    paginacionHTML += `<button class="btn-pagina" onclick="mostrarPaginaPedidos(${paginaActual + 1})">
      <span class="material-symbols-outlined" style="font-size: 16px;">chevron_right</span>
    </button>`;
  } else {
    paginacionHTML += `<button class="btn-pagina" disabled>
      <span class="material-symbols-outlined" style="font-size: 16px;">chevron_right</span>
    </button>`;
  }

  // Información de paginación
  const inicio = (paginaActual - 1) * pedidosPorPagina + 1;
  const fin = Math.min(paginaActual * pedidosPorPagina, pedidosActuales.length);

  paginacionHTML += `<div class="info-paginacion">
    Mostrando ${inicio}-${fin} de ${pedidosActuales.length} pedidos
  </div>`;

  paginacionElement.innerHTML = paginacionHTML;
}