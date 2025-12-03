// Elementos del DOM
const slider = document.getElementById("sliderPuntos");
const puntos = document.getElementById("valorPuntos");
const descuento = document.getElementById("valorDescuento");

// Evento para el slider
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

// Variables para información original del cliente
let clienteOriginalInfo = {
  nombre: '',
  telefono: ''
};

// Mostrar info del cliente y pedidos
document.addEventListener('DOMContentLoaded', async () => {
  let clienteInfo = null;
  const passwordForm = document.getElementById('form-cambiar-contrasena');
  const cancelPassBtn = document.getElementById('btn-cancelar-pass');
  const msgBox = document.getElementById('msg-contrasena');
  const msgInfoPersonal = document.getElementById('msg-info-personal');

  // Elementos para información personal
  const nombreInput = document.getElementById('name');
  const telefonoInput = document.getElementById('phone');
  const guardarInfoBtn = document.querySelector('.card-info-personal .btn-guardar');
  const cancelarInfoBtn = document.getElementById('btn-cancelar-info');

  // Función para limpiar mensajes de contraseña
  const clearPassMsg = () => {
    if (!msgBox) return;
    msgBox.textContent = '';
    msgBox.classList.remove('msg-success', 'msg-error', 'msg-info');
    msgBox.style.display = 'none';
  };

  // Función para mostrar mensajes de contraseña
  const showPassMsg = (message, type = 'success') => {
    if (!msgBox) return;
    msgBox.textContent = message;
    msgBox.classList.remove('msg-success', 'msg-error', 'msg-info');
    msgBox.classList.add(`msg-${type}`);
    msgBox.style.display = 'block';
  };

  // Función para limpiar mensajes de información personal
  const clearInfoMsg = () => {
    if (!msgInfoPersonal) return;
    msgInfoPersonal.textContent = '';
    msgInfoPersonal.classList.remove('msg-success', 'msg-error', 'msg-info');
    msgInfoPersonal.style.display = 'none';
  };

  // Función para mostrar mensajes de información personal
  const showInfoMsg = (message, type = 'success') => {
    if (!msgInfoPersonal) return;
    msgInfoPersonal.textContent = message;
    msgInfoPersonal.classList.remove('msg-success', 'msg-error', 'msg-info');
    msgInfoPersonal.classList.add(`msg-${type}`);
    msgInfoPersonal.style.display = 'block';
  };

  clearPassMsg();
  clearInfoMsg();

  // Obtener información del cliente desde la API
  try {
    const respCliente = await fetch('/clientes/mi-perfil', { credentials: 'include' });
    if (respCliente.ok) {
      clienteInfo = await respCliente.json();

      // Guardar información original
      clienteOriginalInfo = {
        nombre: clienteInfo.nombre || '',
        telefono: clienteInfo.telefono || ''
      };

      // Llenar los campos del formulario
      if (nombreInput) {
        nombreInput.value = clienteInfo.nombre || '';
      }
      if (telefonoInput) {
        telefonoInput.value = clienteInfo.telefono || '';
      }
    }
  } catch (error) {
    console.error('Error cargando información del cliente:', error);
  }

  // Configurar el botón de guardar información personal
  if (guardarInfoBtn && clienteInfo) {
    guardarInfoBtn.addEventListener('click', async () => {
      clearInfoMsg();

      // Obtener valores de los campos
      const nuevoNombre = nombreInput ? nombreInput.value.trim() : '';
      const nuevoTelefono = telefonoInput ? telefonoInput.value.trim() : '';

      // Crear FormData para enviar
      const formData = new URLSearchParams();

      // Solo agregar nombre si es diferente del original o si está vacío pero el original no
      if (nuevoNombre !== clienteOriginalInfo.nombre) {
        formData.append('nombre', nuevoNombre);
      }

      // Solo agregar teléfono si es diferente del original o si está vacío pero el original no
      if (nuevoTelefono !== clienteOriginalInfo.telefono) {
        // Validar teléfono si se proporciona
        if (nuevoTelefono && nuevoTelefono.replace(/\D/g, '').length < 7) {
          showInfoMsg('El número de teléfono debe tener al menos 7 dígitos', 'error');
          return;
        }
        formData.append('telefono', nuevoTelefono);
      }

      // Si no hay cambios, mostrar mensaje
      if (formData.toString().length === 0) {
        showInfoMsg('No se detectaron cambios para guardar', 'info');
        return;
      }

      // Deshabilitar botón durante la petición
      guardarInfoBtn.disabled = true;
      const textoOriginal = guardarInfoBtn.textContent;
      guardarInfoBtn.textContent = 'Guardando...';

      try {
        // Realizar petición PATCH al endpoint de clientes
        const resp = await fetch(`/clientes/${clienteInfo.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData,
          credentials: 'include'
        });

        if (resp.ok) {
          showInfoMsg('Información actualizada correctamente', 'success');

          // Actualizar información original
          const datosActualizados = await resp.json();
          clienteOriginalInfo.nombre = datosActualizados.nombre || clienteOriginalInfo.nombre;
          clienteOriginalInfo.telefono = datosActualizados.telefono || clienteOriginalInfo.telefono;

          // Actualizar clienteInfo local
          clienteInfo.nombre = datosActualizados.nombre;
          clienteInfo.telefono = datosActualizados.telefono;

        } else {
          let errorMsg = 'Error al actualizar la información.';
          try {
            const errorData = await resp.json();
            if (errorData?.detail) errorMsg = errorData.detail;
          } catch { }
          showInfoMsg(errorMsg, 'error');
        }
      } catch (error) {
        showInfoMsg('Error de conexión al actualizar la información.', 'error');
        console.error('Error:', error);
      } finally {
        // Restaurar botón
        guardarInfoBtn.disabled = false;
        guardarInfoBtn.textContent = textoOriginal;
      }
    });
  }

  // Configurar el botón de cancelar información personal
  if (cancelarInfoBtn && clienteInfo) {
    cancelarInfoBtn.addEventListener('click', () => {
      // Restaurar valores originales
      if (nombreInput) {
        nombreInput.value = clienteOriginalInfo.nombre || '';
      }
      if (telefonoInput) {
        telefonoInput.value = clienteOriginalInfo.telefono || '';
      }
      showInfoMsg('Cambios cancelados. Se restauraron los valores originales.', 'success');
      setTimeout(() => clearInfoMsg(), 3000);
    });
  }

  // Configurar formulario de cambiar contraseña
  if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearPassMsg();

      // Validar que el clienteInfo esté cargado
      if (!clienteInfo) {
        showPassMsg('No se pudieron cargar tus datos. Intenta nuevamente.', 'error');
        return;
      }

      // Obtener valores de contraseña
      const nueva = document.getElementById('new_password').value.trim();
      const confirmar = document.getElementById('confirm_password').value.trim();

      // Validar que ambos campos estén completos
      if (!nueva || !confirmar) {
        showPassMsg('Por favor ingresa y confirma la nueva contraseña.', 'error');
        return;
      }

      // Validar que las contraseñas coincidan
      if (nueva !== confirmar) {
        showPassMsg('Las contraseñas no coinciden.', 'error');
        document.getElementById('new_password').value = '';
        document.getElementById('confirm_password').value = '';
        document.getElementById('new_password').focus();
        return;
      }

      // Deshabilitar botón durante la petición
      const guardarBtn = passwordForm.querySelector('.btn-guardar');
      const guardarTexto = guardarBtn ? guardarBtn.textContent : '';
      if (guardarBtn) {
        guardarBtn.disabled = true;
        guardarBtn.textContent = 'Guardando...';
      }

      try {
        // Realizar petición para actualizar contraseña
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
        // Restaurar botón
        if (guardarBtn) {
          guardarBtn.disabled = false;
          guardarBtn.textContent = guardarTexto || 'Guardar Cambios';
        }
      }
    });
  }

  // Configurar botón de cancelar contraseña
  if (cancelPassBtn) {
    cancelPassBtn.addEventListener('click', () => {
      document.getElementById('new_password').value = '';
      document.getElementById('confirm_password').value = '';
      clearPassMsg();
    });
  }

  // Cargar pedidos del cliente
  await cargarPedidos();

  // Configurar sistema de pestañas
  const tabPedidos = document.getElementById('tab-pedidos');
  const tabInfoPersonal = document.getElementById('tab-info-personal');
  const pedidosSection = document.getElementById('pedidos-cliente');
  const infoPersonalSection = document.getElementById('info-personal');

  // Mostrar sección según pestaña activa
  const activeBtn = document.querySelector('.tabs button.active-tab');
  const mostrarPedidos = activeBtn ? activeBtn.id === 'tab-pedidos' : false;
  if (pedidosSection && infoPersonalSection) {
    pedidosSection.style.display = mostrarPedidos ? '' : 'none';
    infoPersonalSection.style.display = mostrarPedidos ? 'none' : '';
  }

  // Configurar eventos para cambiar entre pestañas
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

  // Configurar botón para eliminar cuenta
  const btnEliminarCuenta = document.getElementById('btn-eliminar-cuenta');
  if (btnEliminarCuenta) {
    btnEliminarCuenta.addEventListener('click', eliminarCuenta);
  }
});

// Función para cargar pedidos del cliente
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

// Función para actualizar estadísticas de pedidos
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

  // Mostrar mensaje si no hay pedidos
  if (pedidosActuales.length === 0) {
    tbody.innerHTML = '';
    sinPedidosElement.classList.remove('hidden');
    document.getElementById('paginacion-pedidos').innerHTML = '';
    return;
  } else {
    sinPedidosElement.classList.add('hidden');
  }

  // Generar filas de la tabla con los pedidos
  tbody.innerHTML = '';
  pedidosPagina.forEach(pedido => {
    const fila = document.createElement('tr');

    // Determinar clase CSS según el estado del pedido
    let claseEstado = 'estado-pedido ';
    switch (pedido.estado) {
      case 'PAGADO':
        claseEstado += 'estado-pagado';
        break;
      case 'PENDIENTE':
        claseEstado += 'estado-pendiente';
        break;
      case 'CANCELADO':
        claseEstado += 'estado-cancelado';
        break;
      default:
        claseEstado += 'estado-pendiente';
    }

    // Crear HTML de la fila
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

  // Generar controles de paginación
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

  // Eliminar duplicados de puntos suspensivos
  const paginasUnicas = [];
  for (let i = 0; i < paginasMostrar.length; i++) {
    if (paginasMostrar[i] !== paginasMostrar[i - 1]) {
      paginasUnicas.push(paginasMostrar[i]);
    }
  }

  // Generar botones de números de página
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

// Función para eliminar la cuenta del cliente
async function eliminarCuenta() {
  const btnEliminar = document.getElementById('btn-eliminar-cuenta');
  const msgCuenta = document.getElementById('msg-cuenta');

  if (!btnEliminar || !msgCuenta) return;

  const confirmacion1 = confirm('¿Estás seguro de que quieres eliminar tu cuenta?\n\nEsta acción es irreversible y eliminará todos tus datos.');
  if (!confirmacion1) return;

  const confirmacionFinal = prompt('Para confirmar, escribe "ELIMINAR" (en mayúsculas):');
  if (confirmacionFinal !== 'ELIMINAR') {
    alert('Eliminación cancelada.');
    return;
  }

  const textoOriginal = btnEliminar.textContent;
  btnEliminar.disabled = true;
  btnEliminar.textContent = 'Eliminando...';

  msgCuenta.textContent = '';
  msgCuenta.classList.remove('msg-success', 'msg-error');
  msgCuenta.style.display = 'none';

  try {
    const response = await fetch('/clientes/eliminar-cuenta', {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.ok) {
      const resultado = await response.json();

      msgCuenta.textContent = resultado.mensaje || 'Cuenta eliminada exitosamente. Serás redirigido...';
      msgCuenta.classList.add('msg-success');
      msgCuenta.style.display = 'block';

      setTimeout(() => {
        window.location.href = '/auth/logout';
      }, 3000);

    } else {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      let esErrorEstadoPedidos = false;

      try {
        const errorData = await response.json();
        if (errorData?.detail) {
          errorMessage = errorData.detail;
          if (errorMessage.includes('PAGADO') || errorMessage.includes('CANCELADO') ||
            errorMessage.includes('estado')) {
            esErrorEstadoPedidos = true;
          }
        }
      } catch {
        const text = await response.text();
        if (text) errorMessage = text;
      }

      if (esErrorEstadoPedidos) {
        try {
          const respPedidos = await fetch('/pedidos/mis-pedidos', { credentials: 'include' });
          if (respPedidos.ok) {
            const pedidos = await respPedidos.json();
            const pedidosPendientes = pedidos.filter(p =>
              p.estado !== 'PAGADO' && p.estado !== 'CANCELADO'
            );

            if (pedidosPendientes.length > 0) {
              errorMessage += `\n\nPedidos pendientes:\n`;
              pedidosPendientes.slice(0, 5).forEach(p => {
                errorMessage += `- Pedido #${p.id}: ${p.estado} ($${p.total})\n`;
              });
              if (pedidosPendientes.length > 5) {
                errorMessage += `... y ${pedidosPendientes.length - 5} más`;
              }
            }
          }
        } catch (e) {
          console.error('Error al obtener pedidos:', e);
        }
      }

      throw new Error(errorMessage);
    }

  } catch (error) {
    console.error('Error al eliminar cuenta:', error);

    let mensajeError = error.message;

    if (mensajeError.includes('\n')) {
      const lineas = mensajeError.split('\n');
      msgCuenta.innerHTML = lineas.map(line => {
        if (line.includes('Pedido #') || line.includes('-')) {
          return `<div style="margin-left: 1rem; font-size: 0.9em;">${line}</div>`;
        }
        return `<div>${line}</div>`;
      }).join('');
    } else {
      msgCuenta.textContent = `Error: ${mensajeError}`;
    }

    msgCuenta.classList.add('msg-error');
    msgCuenta.style.display = 'block';

    btnEliminar.disabled = false;
    btnEliminar.textContent = textoOriginal;

    setTimeout(() => {
      msgCuenta.style.display = 'none';
    }, 8000);
  }
}