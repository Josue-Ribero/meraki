document.addEventListener("DOMContentLoaded", () => {

  // Elementos del DOM
  const tbody = document.getElementById("clientesBody");
  const searchInput = document.getElementById("searchInput");
  const filtroEstado = document.getElementById("filtroEstado");
  const btnBuscar = document.getElementById("btnBuscar");

  // Variables de estado
  let todosLosClientes = []; // Para almacenar todos los clientes y filtrar en frontend
  let filtroActual = "activos";
  let busquedaActual = "";
  let paginaActual = 1;
  const clientesPorPagina = 10;

  // Configuración de API
  const API_BASE = '';

  // Contenedor para paginación
  let paginacionContainer;

  // Función para inicializar la paginación
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
    showError("Error: No se pudieron cargar los elementos de la página");
    return;
  }

  // Cargar clientes
  async function cargarClientes() {
    try {
      showLoading();

      // URL para la API
      let url;
      if (filtroActual === "activos") {
        url = `${API_BASE}/clientes/`;
      } else if (filtroActual === "todos") {
        url = `${API_BASE}/clientes/todos`;
      } else if (filtroActual === "eliminados") {
        url = `${API_BASE}/clientes/eliminados`;
      }

      // Petición a la API
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      // Si la respuesta es diferente a 200, mostrar error
      if (!response.ok) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;

        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch (e) {
          const errorText = await response.text();
          if (errorText) {
            errorMessage += ` - ${errorText}`;
          }
        }

        // Si la respuesta es 401 o 403, mostrar error
        if (response.status === 401) {
          errorMessage = "No autorizado - Verifica que estés logueado como administrador";
        } else if (response.status === 403) {
          errorMessage = "Acceso denegado - No tienes permisos de administrador";
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Obtener los clientes del response
      todosLosClientes = Array.isArray(data.clientes) ? data.clientes : [];

      // Aplicar filtro de búsqueda si existe
      let clientesFiltrados = todosLosClientes;
      if (busquedaActual) {
        const termino = busquedaActual.toLowerCase();
        clientesFiltrados = todosLosClientes.filter(cliente =>
          cliente.nombre.toLowerCase().includes(termino) ||
          cliente.email.toLowerCase().includes(termino) ||
          (cliente.telefono && cliente.telefono.toLowerCase().includes(termino))
        );
      }

      // Calcular paginación
      const totalItems = clientesFiltrados.length;
      const totalPaginas = Math.ceil(totalItems / clientesPorPagina);
      const inicio = (paginaActual - 1) * clientesPorPagina;
      const fin = inicio + clientesPorPagina;
      const clientesPaginados = clientesFiltrados.slice(inicio, fin);

      // Renderizar clientes y paginación
      renderizarClientes(clientesPaginados, {
        totalItems: totalItems,
        paginaActual: paginaActual,
        itemsPorPagina: clientesPorPagina,
        totalPaginas: totalPaginas
      });

    } catch (error) {
      showError(`Error: ${error.message}`);
    }
  }

  // Funcion de renderizar clientes
  function renderizarClientes(clientes, paginacion) {
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

      actualizarInfoPaginacion(0, paginacion.totalItems);
      renderizarPaginacion(paginacion.totalPaginas);
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

      // Si el cliente esta eliminado
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
    const mostrando = clientes.length;
    actualizarInfoPaginacion(mostrando, paginacion.totalItems);
    renderizarPaginacion(paginacion.totalPaginas);
  }

  // Funcion para actualizar la informacion de la paginacion
  function actualizarInfoPaginacion(mostrando, total) {
    const infoPaginacion = document.getElementById('infoPaginacion');
    if (infoPaginacion) {
      infoPaginacion.textContent = `Mostrando ${mostrando} de ${total} clientes`;
    }
  }

  // Funcion para renderizar la paginacion
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

  // Funcion para mostrar estado de carga
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

  // Funcion para mostrar mensaje de error
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
            </div>
          </div>
        </td>
      </tr>`;
  }

  // Funcion para escapar HTML para prevenir XSS
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Funcion para formatear fecha
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

  // Event Listeners

  // Funcion para buscar clientes
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

    // Funcion para la busqueda en tiempo real con debounce
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

  // Funcion para el cambio en el filtro de estado
  if (filtroEstado) {
    filtroEstado.addEventListener("change", (e) => {
      filtroActual = e.target.value;
      paginaActual = 1;
      cargarClientes();
    });
  }

  // Funcion para inicializar la aplicacion
  console.log("Inicializando aplicación de clientes...");
  inicializarPaginacion();
  cargarClientes();
});