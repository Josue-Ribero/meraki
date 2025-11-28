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
  } catch {}

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
          } catch {}
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

  // Fetch pedidos
  try {
    const respPedidos = await fetch('/pedidos/mis-pedidos', { credentials: 'include' });
    if (respPedidos.ok) {
      const pedidos = await respPedidos.json();
      const tbody = document.getElementById('tabla-pedidos');
      tbody.innerHTML = '';
      if (pedidos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">No tienes pedidos aún.</td></tr>';
      } else {
        pedidos.forEach(p => {
          tbody.innerHTML += `<tr>
            <td>${p.id}</td>
            <td>${p.fecha ? new Date(p.fecha).toLocaleDateString('es-CO') : '-'}</td>
            <td>${p.estado || '-'}</td>
            <td>$${p.total || '-'}</td>
            <td><a href="/proceso-pago-detalles?id=${p.id}" class="btn-ver">Ver</a></td>
          </tr>`;
        });
      }
    }
  } catch {}

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