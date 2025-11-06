// clientesAdmin.js - VERSIÓN MEJORADA Y CORREGIDA

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Script clientesAdmin.js cargado");

  // Elementos del DOM
  const tbody = document.getElementById("clientesBody");
  const searchInput = document.getElementById("searchInput");
  const filtroEstado = document.getElementById("filtroEstado");
  const btnBuscar = document.getElementById("btnBuscar");

  // Variables de estado
  let clientes = [];
  let filtroActual = "activos";
  let busquedaActual = "";
  let paginaActual = 1;
  const clientesPorPagina = 5;

  // Configuración de API
  const API_BASE = 'http://127.0.0.1:8000';
  const CLIENTES_ENDPOINT = `${API_BASE}/clientes/`;

  // Contenedor para paginación
  let paginacionContainer;

  console.log("🔗 Endpoint de API:", CLIENTES_ENDPOINT);

  // Función para inicializar la paginación (igual que productosAdmin.js)
  function inicializarPaginacion() {
    if (!document.getElementById('paginacion-container')) {
      const table = document.querySelector('table');
      const paginacionDiv = document.createElement('div');
      paginacionDiv.id = 'paginacion-container';
      paginacionDiv.className = 'flex justify-between items-center mt-6';
      paginacionDiv.innerHTML = `
        <span id="infoPaginacion" class="text-sm text-gray-500">Mostrando 0 de 0 clientes</span>
        <div id="paginacion" class="flex items-center gap-2"></div>
      `;
      table.parentNode.insertBefore(paginacionDiv, table.nextSibling);
    }
    paginacionContainer = document.getElementById('paginacion');
  }

  // Verificar que todos los elementos del DOM existen
  if (!tbody) {
    console.error("❌ Elementos del DOM no encontrados");
    showError("Error: No se pudieron cargar los elementos de la página");
    return;
  }

  console.log("✅ Todos los elementos del DOM encontrados");

  /* ---------- Cargar clientes ---------- */
  async function cargarClientes() {
    console.log("🔄 Cargando clientes...");
    console.log("📊 Parámetros:", { filtroActual, paginaActual, busquedaActual });

    try {
      showLoading();

      const params = new URLSearchParams({
        estado: filtroActual,
        pagina: paginaActual.toString(),
        itemsPorPagina: clientesPorPagina.toString()
      });

      if (busquedaActual) {
        params.append('busqueda', busquedaActual);
      }

      const url = `${CLIENTES_ENDPOINT}?${params}`;
      console.log("📡 URL completa:", url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      console.log("📡 Estado de respuesta:", response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;

        // Intentar obtener más detalles del error
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch (e) {
          // Si no se puede parsear como JSON, usar el texto plano
          const errorText = await response.text();
          if (errorText) {
            errorMessage += ` - ${errorText}`;
          }
        }

        if (response.status === 401) {
          errorMessage = "No autorizado - Verifica que estés logueado como administrador";
        } else if (response.status === 403) {
          errorMessage = "Acceso denegado - No tienes permisos de administrador";
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("📦 Datos recibidos:", data);
      console.log("👥 Clientes en respuesta:", data.clientes ? data.clientes.length : 0);

      // Procesar respuesta
      clientes = Array.isArray(data.clientes) ? data.clientes : [];

      if (data.paginacion) {
        renderizarClientes(data.paginacion);
      } else {
        console.warn("⚠️ No hay datos de paginación en la respuesta");
        renderizarClientes({
          totalItems: clientes.length,
          paginaActual: paginaActual,
          itemsPorPagina: clientesPorPagina,
          totalPaginas: Math.ceil(clientes.length / clientesPorPagina)
        });
      }

    } catch (error) {
      console.error("❌ Error cargando clientes:", error);
      showError(`Error: ${error.message}`);
    }
  }

  /* ---------- Renderizar clientes ---------- */
  function renderizarClientes(paginacion) {
    console.log("🎨 Renderizando", clientes.length, "clientes");

    tbody.innerHTML = '';

    // Mostrar mensaje si no hay clientes
    if (clientes.length === 0) {
      const mensaje = filtroActual === "eliminados"
        ? "No hay clientes eliminados"
        : filtroActual === "todos"
          ? "No hay clientes registrados"
          : "No se encontraron clientes activos";

      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="py-12 px-6 text-center">
            <div class="flex flex-col items-center justify-center text-[#9c642d]">
              <span class="material-symbols-outlined text-5xl mb-3">group</span>
              <p class="text-xl font-semibold mb-2">${mensaje}</p>
              <p class="text-sm text-gray-600">${busquedaActual ? 'Intenta con otros términos de búsqueda' : 'Los clientes aparecerán aquí una vez registrados'}</p>
            </div>
          </td>
        </tr>`;

      const total = paginacion.totalItems || 0;
      actualizarInfoPaginacion(0, total);
      renderizarPaginacion(paginacion.totalPaginas || 1);
      return;
    }

    // Crear filas para cada cliente
    clientes.forEach((cliente) => {
      const tr = document.createElement("tr");

      // Determinar clase según el tipo de cliente
      if (filtroActual === "eliminados" || cliente.tipo === "historico") {
        tr.className = "cliente-eliminado hover:bg-gray-100";
      } else {
        tr.className = "hover:bg-[#fdfbf3]";
      }

      // Determinar estado y puntos
      let estado, puntos, estadoClass;

      if (filtroActual === "eliminados" || cliente.tipo === "historico") {
        estado = "Eliminado";
        estadoClass = "badge historico";
        puntos = "N/A";
      } else if (cliente.activo === false) {
        estado = "Inactivo";
        estadoClass = "badge inactivo";
        puntos = cliente.puntos || 0;
      } else {
        estado = "Activo";
        estadoClass = "badge activo";
        puntos = cliente.puntos || 0;
      }

      // Formatear fecha si existe
      let fechaInfo = '';
      if (cliente.fechaEliminacion) {
        fechaInfo = `<br><span class="text-xs text-gray-500">Eliminado: ${formatFecha(cliente.fechaEliminacion)}</span>`;
      } else if (cliente.fechaCreacion && filtroActual === "todos") {
        fechaInfo = `<br><span class="text-xs text-gray-500">Registro: ${formatFecha(cliente.fechaCreacion)}</span>`;
      }

      tr.innerHTML = `
        <td class="py-4 px-6">
          <p class="font-semibold text-[#363636] text-base">${escapeHtml(cliente.nombre)}</p>
        </td>
        <td class="py-4 px-6">
          <p class="text-[#9c642d] text-sm font-medium">${escapeHtml(cliente.email)}</p>
          <p class="text-gray-600 text-sm">${escapeHtml(cliente.telefono || 'No proporcionado')}</p>
        </td>
        <td class="py-4 px-6 text-center">
          <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-[#aa8744] text-white">
            ${puntos} ${typeof puntos === 'number' ? 'pts' : ''}
          </span>
        </td>
        <td class="py-4 px-6 text-center">
          <span class="${estadoClass}">
            ${estado}
          </span>
          ${fechaInfo}
        </td>`;

      tbody.appendChild(tr);
    });

    // Actualizar información de paginación
    const total = paginacion.totalItems || clientes.length;
    const mostrando = Math.min(clientes.length, clientesPorPagina);
    actualizarInfoPaginacion(mostrando, total);
    renderizarPaginacion(paginacion.totalPaginas || 1);
  }

  /* ---------- Funciones de paginación (IGUAL QUE productosAdmin.js) ---------- */
  function actualizarInfoPaginacion(mostrando, total) {
    const infoPaginacion = document.getElementById('infoPaginacion');
    if (infoPaginacion) {
      infoPaginacion.textContent = `Mostrando ${mostrando} de ${total} clientes`;
    }
  }

  function renderizarPaginacion(totalPaginas) {
    if (!paginacionContainer) return;

    paginacionContainer.innerHTML = '';

    // Botón Anterior
    const btnAnterior = document.createElement("button");
    btnAnterior.textContent = "Anterior";
    btnAnterior.className = "page-btn";
    btnAnterior.disabled = paginaActual === 1;
    btnAnterior.addEventListener("click", () => {
      if (paginaActual > 1) {
        paginaActual--;
        cargarClientes();
      }
    });
    paginacionContainer.appendChild(btnAnterior);

    // Botones de números de página
    for (let i = 1; i <= totalPaginas; i++) {
      const btnPagina = document.createElement("button");
      btnPagina.textContent = i;
      btnPagina.className = "page-btn" + (i === paginaActual ? " active" : "");
      btnPagina.addEventListener("click", () => {
        paginaActual = i;
        cargarClientes();
      });
      paginacionContainer.appendChild(btnPagina);
    }

    // Botón Siguiente
    const btnSiguiente = document.createElement("button");
    btnSiguiente.textContent = "Siguiente";
    btnSiguiente.className = "page-btn";
    btnSiguiente.disabled = paginaActual === totalPaginas;
    btnSiguiente.addEventListener("click", () => {
      if (paginaActual < totalPaginas) {
        paginaActual++;
        cargarClientes();
      }
    });
    paginacionContainer.appendChild(btnSiguiente);
  }

  /* ---------- UI Functions ---------- */

  // Mostrar estado de carga
  function showLoading() {
    tbody.innerHTML = `
      <tr id="loadingRow">
        <td colspan="4" class="py-12 px-6 text-center text-[#9c642d]">
          <div class="flex flex-col items-center justify-center">
            <span class="material-symbols-outlined animate-spin text-4xl mb-2">refresh</span>
            <p class="text-lg">Cargando clientes...</p>
          </div>
        </td>
      </tr>`;
  }

  // Mostrar mensaje de error
  function showError(message) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="py-12 px-6 text-center">
          <div class="flex flex-col items-center justify-center text-red-600">
            <span class="material-symbols-outlined text-4xl mb-2">error</span>
            <p class="text-lg font-medium mb-2">Error de conexión</p>
            <p class="text-sm text-gray-600 max-w-md">${message}</p>
            <div class="flex gap-2 mt-4">
              <button onclick="location.reload()" class="px-4 py-2 bg-[#aa8744] text-white rounded-lg hover:bg-[#9c642d] transition-colors">
                Reintentar
              </button>
              <button onclick="probarEndpoint()" class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
                Probar Conexión
              </button>
            </div>
          </div>
        </td>
      </tr>`;
  }

  // Función para probar el endpoint manualmente
  window.probarEndpoint = async function () {
    try {
      console.log("🔍 Probando conexión con el endpoint...");
      const testUrl = `${CLIENTES_ENDPOINT}?estado=activos&pagina=1&items_por_pagina=5`;
      console.log("🔍 URL de prueba:", testUrl);

      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      console.log("🔍 Resultado prueba:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (response.ok) {
        const data = await response.json();
        console.log("🔍 Datos de prueba:", data);
        alert(`✅ Conexión exitosa\nEstado: ${response.status}\nClientes encontrados: ${data.clientes ? data.clientes.length : 0}\nTotal: ${data.paginacion ? data.paginacion.total_items : 0}`);
      } else {
        let errorMsg = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.detail || errorMsg;
        } catch (e) {
          // Ignorar si no se puede parsear el error
        }
        alert(`❌ Error de conexión:\n${errorMsg}`);
      }
    } catch (error) {
      console.error("🔍 Error en prueba:", error);
      alert(`❌ Error de red:\n${error.message}`);
    }
  };

  // Escapar HTML para prevenir XSS
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Formatear fecha
  function formatFecha(fechaString) {
    try {
      const fecha = new Date(fechaString);
      return fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return fechaString;
    }
  }

  /* ---------- Event Listeners ---------- */

  // Buscar clientes
  function buscarClientes() {
    busquedaActual = searchInput.value.trim();
    paginaActual = 1;
    cargarClientes();
  }

  if (btnBuscar) {
    btnBuscar.addEventListener("click", buscarClientes);
  }

  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === 'Enter') {
        buscarClientes();
      }
    });

    // Búsqueda en tiempo real con debounce
    let timeoutId;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        busquedaActual = e.target.value.trim();
        paginaActual = 1;
        cargarClientes();
      }, 800);
    });
  }

  // Cambio en el filtro de estado
  if (filtroEstado) {
    filtroEstado.addEventListener("change", (e) => {
      filtroActual = e.target.value;
      paginaActual = 1;
      cargarClientes();
    });
  }

  // Inicializar la aplicación
  console.log("🚀 Inicializando aplicación de clientes...");
  inicializarPaginacion();
  cargarClientes();
});