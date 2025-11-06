// categoriaAdmin.js - CON SOPORTE PARA CATEGORÍAS DESACTIVADAS Y PAGINACIÓN

// Inicialización cuando el DOM está completamente cargado
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Script categoriaAdmin.js cargado");

  // Elementos del DOM
  const modal = document.getElementById("modal");
  const openBtn = document.getElementById("abrir-modal");
  const cancelBtn = document.getElementById("cancelar");
  const modalTitle = document.getElementById("modal-title");
  const form = document.getElementById("categoriaForm");
  const tbody = document.getElementById("categoriaBody");
  const inputBuscar = document.getElementById("buscarCategoria");
  const filtroEstado = document.getElementById("filtroEstado");
  const paginacionEl = document.getElementById("paginacion");
  const infoPaginacionEl = document.getElementById("infoPaginacion");

  // Variables de estado
  let editingRow = null;
  let categorias = [];
  let categoriasFiltradas = [];
  let filtroActual = "activas"; // "activas", "inactivas", "todas"
  let paginaActual = 1;
  const categoriasPorPagina = 7;

  // Configuración de API
  const API_BASE = 'http://127.0.0.1:8000';
  const CATEGORIAS_ENDPOINT = `${API_BASE}/categorias/`;

  console.log("🔗 Endpoint de API:", CATEGORIAS_ENDPOINT);

  // Verificar que todos los elementos del DOM existen
  if (!modal || !openBtn || !form || !tbody || !cancelBtn || !paginacionEl || !infoPaginacionEl) {
    console.error("❌ Elementos del DOM no encontrados");
    showError("Error: No se pudieron cargar los elementos de la página");
    return;
  }

  console.log("✅ Todos los elementos del DOM encontrados");

  /* ---------- Cargar categorías ---------- */
  async function cargarCategorias() {
    console.log("🔄 Cargando categorías...");

    try {
      showLoading();

      const url = `${CATEGORIAS_ENDPOINT}todas`;
      console.log("📡 Haciendo petición GET a:", url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include'
      });

      console.log("📡 Respuesta GET:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      // Verificar si la respuesta es exitosa
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("📦 Datos recibidos:", data);

      // Guardar categorías y aplicar filtros
      categorias = Array.isArray(data) ? data : [];
      aplicarFiltros();

    } catch (error) {
      console.error("❌ Error cargando categorías:", error);
      showError(`Error: ${error.message}`);
    }
  }

  /* ---------- Aplicar filtros ---------- */
  function aplicarFiltros() {
    const texto = inputBuscar ? inputBuscar.value.trim().toLowerCase() : '';

    categoriasFiltradas = categorias.filter(cat => {
      const coincideTexto = !texto ||
        cat.nombre.toLowerCase().includes(texto) ||
        (cat.descripcion && cat.descripcion.toLowerCase().includes(texto));

      const coincideEstado =
        filtroActual === "todas" ||
        (filtroActual === "activas" && cat.activo) ||
        (filtroActual === "inactivas" && !cat.activo);

      return coincideTexto && coincideEstado;
    });

    // Resetear a página 1 cuando se aplican filtros
    paginaActual = 1;
    renderizarCategorias();
  }

  /* ---------- Renderizar categorías ---------- */
  function renderizarCategorias() {
    console.log("🎨 Renderizando categorías");

    // Calcular índices para la paginación
    const totalCategorias = categoriasFiltradas.length;
    const totalPaginas = Math.max(1, Math.ceil(totalCategorias / categoriasPorPagina));

    // Asegurar que la página actual sea válida
    if (paginaActual > totalPaginas) {
      paginaActual = totalPaginas;
    }

    const inicio = (paginaActual - 1) * categoriasPorPagina;
    const fin = inicio + categoriasPorPagina;
    const categoriasPagina = categoriasFiltradas.slice(inicio, fin);

    console.log(`📄 Página ${paginaActual} de ${totalPaginas}, mostrando ${categoriasPagina.length} categorías`);

    tbody.innerHTML = '';

    // Mostrar mensaje si no hay categorías
    if (categoriasPagina.length === 0) {
      const mensaje = filtroActual === "inactivas"
        ? "No hay categorías desactivadas"
        : "Aún no tienes categorías";

      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="py-12 px-6 text-center">
            <div class="flex flex-col items-center justify-center text-[#9c642d]">
              <span class="material-symbols-outlined text-5xl mb-3">category</span>
              <p class="text-xl font-semibold mb-2">${mensaje}</p>
              ${filtroActual === "activas" ? '<p class="text-sm text-gray-600">Comienza agregando tu primera categoría</p>' : ''}
            </div>
          </td>
        </tr>`;

      // Actualizar información de paginación
      actualizarInfoPaginacion(0, totalCategorias);
      renderizarPaginacion(totalPaginas);
      return;
    }

    // Crear filas para cada categoría de la página actual
    categoriasPagina.forEach(categoria => {
      const tr = document.createElement("tr");
      tr.className = categoria.activo ? "hover:bg-[#fdfbf3]" : "categoria-inactiva hover:bg-gray-100";
      tr.dataset.id = categoria.id;

      const estadoBadge = !categoria.activo
        ? '<span class="badge-inactivo ml-2">Inactiva</span>'
        : '';

      // Botones de acción según el estado
      const botonesAccion = categoria.activo ? `
        <button class="editar p-2 rounded-lg hover:bg-[#f5f5f5] transition-colors" data-id="${categoria.id}" title="Editar">
          <span class="material-symbols-outlined text-[#aa8744]">edit</span>
        </button>
        <button class="eliminar p-2 rounded-lg hover:bg-[#f5f5f5] transition-colors" data-id="${categoria.id}" title="Desactivar">
          <span class="material-symbols-outlined text-[#dc2626]">block</span>
        </button>
      ` : `
        <button class="activar p-2 rounded-lg hover:bg-[#f5f5f5] transition-colors" data-id="${categoria.id}" title="Activar">
          <span class="material-symbols-outlined text-[#16a34a]">check_circle</span>
        </button>
      `;

      tr.innerHTML = `
        <td class="py-4 px-6 font-medium text-[#363636]">
          ${escapeHtml(categoria.nombre)}${estadoBadge}
        </td>
        <td class="py-4 px-6 text-[#666]">${escapeHtml(categoria.descripcion || 'Sin descripción')}</td>
        <td class="py-4 px-6 text-center">
          <span class="inline-flex items-center justify-center w-8 h-8 bg-[#f0f0f0] rounded-full text-sm font-medium">
            ${categoria.contarProductos || 0}
          </span>
        </td>
        <td class="py-4 px-6 text-center">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoria.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
            ${categoria.activo ? 'Activa' : 'Inactiva'}
          </span>
        </td>
        <td class="py-4 px-6 text-center">
          ${botonesAccion}
        </td>`;
      tbody.appendChild(tr);
    });

    // Actualizar información de paginación
    actualizarInfoPaginacion(categoriasPagina.length, totalCategorias);
    renderizarPaginacion(totalPaginas);
  }

  /* ---------- Funciones de paginación ---------- */
  function actualizarInfoPaginacion(mostrando, total) {
    if (infoPaginacionEl) {
      infoPaginacionEl.textContent = `Mostrando ${mostrando} de ${total} categorías`;
    }
  }

  function renderizarPaginacion(totalPaginas) {
    paginacionEl.innerHTML = '';

    // Botón Anterior - CORREGIDO: usando paginaActual en lugar de currentPage
    const btnAnterior = document.createElement("button");
    btnAnterior.textContent = "Anterior";
    btnAnterior.className = "page-btn";
    btnAnterior.disabled = paginaActual === 1;
    btnAnterior.addEventListener("click", () => {
      if (paginaActual > 1) {
        paginaActual--;
        renderizarCategorias();
      }
    });
    paginacionEl.appendChild(btnAnterior);

    // Botones de números de página
    for (let i = 1; i <= totalPaginas; i++) {
      const btnPagina = document.createElement("button");
      btnPagina.textContent = i;
      btnPagina.className = "page-btn" + (i === paginaActual ? " active" : "");
      btnPagina.addEventListener("click", () => {
        paginaActual = i;
        renderizarCategorias();
      });
      paginacionEl.appendChild(btnPagina);
    }

    // Botón Siguiente
    const btnSiguiente = document.createElement("button");
    btnSiguiente.textContent = "Siguiente";
    btnSiguiente.className = "page-btn";
    btnSiguiente.disabled = paginaActual === totalPaginas;
    btnSiguiente.addEventListener("click", () => {
      if (paginaActual < totalPaginas) {
        paginaActual++;
        renderizarCategorias();
      }
    });
    paginacionEl.appendChild(btnSiguiente);
  }

  /* ---------- Funciones de API ---------- */

  // CREATE - Crear una nueva categoría
  async function crearCategoria(nombre, descripcion) {
    console.log("📤 Creando categoría:", { nombre, descripcion });

    const formData = new FormData();
    formData.append('nombre', nombre);
    if (descripcion) {
      formData.append('descripcion', descripcion);
    }

    const response = await fetch(CATEGORIAS_ENDPOINT, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });

    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (e) { }
      throw new Error(errorMessage);
    }

    return await response.json();
  }

  // UPDATE - Editar una categoría existente
  async function editarCategoria(id, nombre, descripcion) {
    console.log("✏️ Editando categoría", id);

    const formData = new FormData();
    if (nombre !== undefined) formData.append('nombre', nombre);
    if (descripcion !== undefined) formData.append('descripcion', descripcion);

    const url = `${CATEGORIAS_ENDPOINT.slice(0, -1)}/${id}`;
    const response = await fetch(url, {
      method: 'PATCH',
      credentials: 'include',
      body: formData
    });

    if (!response.ok) {
      let errorMessage = `Error ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (e) { }
      throw new Error(errorMessage);
    }

    return await response.json();
  }

  // DELETE - Desactivar una categoría
  async function desactivarCategoria(id) {
    console.log("🚫 Desactivando categoría:", id);

    const url = `${CATEGORIAS_ENDPOINT.slice(0, -1)}/${id}/deshabilitar`;
    const response = await fetch(url, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!response.ok) {
      let errorMessage = `Error ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (e) { }
      throw new Error(errorMessage);
    }

    return { success: true };
  }

  // UPDATE - Reactivar una categoría desactivada
  async function activarCategoria(id) {
    console.log("✅ Activando categoría:", id);

    const url = `${CATEGORIAS_ENDPOINT.slice(0, -1)}/${id}/habilitar`;
    const response = await fetch(url, {
      method: 'PATCH',
      credentials: 'include'
    });

    if (!response.ok) {
      let errorMessage = `Error ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (e) { }
      throw new Error(errorMessage);
    }

    return await response.json();
  }

  /* ---------- UI Functions ---------- */

  // Abrir modal para agregar nueva categoría
  function openModalForAdd() {
    console.log("➕ Abriendo modal para agregar");
    editingRow = null;
    modalTitle.textContent = "Añadir Nueva Categoría";
    form.reset();
    modal.style.display = "flex";
    document.getElementById("nombre").focus();
  }

  // Abrir modal para editar categoría existente
  function openModalForEdit(categoria) {
    console.log("✏️ Abriendo modal para editar:", categoria);
    editingRow = categoria;
    modalTitle.textContent = "Editar Categoría";
    document.getElementById("nombre").value = categoria.nombre;
    document.getElementById("descripcion").value = categoria.descripcion || '';
    modal.style.display = "flex";
    document.getElementById("nombre").focus();
  }

  // Cerrar modal
  function closeModal() {
    console.log("❌ Cerrando modal");
    modal.style.display = "none";
    editingRow = null;
    form.reset();
  }

  // Mostrar estado de carga
  function showLoading() {
    tbody.innerHTML = `
      <tr id="loadingRow">
        <td colspan="5" class="py-12 px-6 text-center text-[#9c642d]">
          <div class="flex flex-col items-center justify-center">
            <span class="material-symbols-outlined animate-spin text-4xl mb-2">refresh</span>
            <p class="text-lg">Cargando categorías...</p>
          </div>
        </td>
      </tr>`;
  }

  // Mostrar mensaje de error
  function showError(message) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="py-12 px-6 text-center">
          <div class="flex flex-col items-center justify-center text-red-600">
            <span class="material-symbols-outlined text-4xl mb-2">error</span>
            <p class="text-lg font-medium mb-2">Error de conexión</p>
            <p class="text-sm text-gray-600 max-w-md">${message}</p>
            <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-[#aa8744] text-white rounded-lg hover:bg-[#9c642d] transition-colors">
              Reintentar
            </button>
          </div>
        </td>
      </tr>`;
  }

  // Escapar HTML para prevenir XSS
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /* ---------- Event Listeners ---------- */

  // Envío del formulario para crear/editar categorías
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombreInput = document.getElementById("nombre");
    const descripcionInput = document.getElementById("descripcion");
    const nombre = nombreInput.value.trim();
    const descripcion = descripcionInput.value.trim();

    // Validar que el nombre no esté vacío
    if (!nombre) {
      alert("El nombre de la categoría es obligatorio.");
      nombreInput.focus();
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = "Guardando...";
      submitBtn.classList.add('opacity-50');

      // Crear o editar según el contexto
      if (editingRow) {
        await editarCategoria(editingRow.id, nombre, descripcion);
      } else {
        await crearCategoria(nombre, descripcion);
      }

      closeModal();
      await cargarCategorias();

    } catch (error) {
      console.error("❌ Error:", error);
      alert(`Error: ${error.message}`);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      submitBtn.classList.remove('opacity-50');
    }
  });

  // Delegación de eventos para los botones de acción
  tbody.addEventListener("click", async (e) => {
    const target = e.target.closest("button");
    if (!target) return;

    const categoriaId = parseInt(target.dataset.id);
    const categoria = categorias.find(cat => cat.id === categoriaId);

    // Editar categoría
    if (target.classList.contains("editar")) {
      if (categoria) openModalForEdit(categoria);
      return;
    }

    // Desactivar categoría
    if (target.classList.contains("eliminar")) {
      if (categoria) {
        const confirmar = confirm(`¿Desactivar la categoría "${categoria.nombre}"?`);
        if (confirmar) {
          try {
            await desactivarCategoria(categoriaId);
            await cargarCategorias();
          } catch (error) {
            alert(`Error: ${error.message}`);
          }
        }
      }
      return;
    }

    // Activar categoría
    if (target.classList.contains("activar")) {
      if (categoria) {
        const confirmar = confirm(`¿Reactivar la categoría "${categoria.nombre}"?`);
        if (confirmar) {
          try {
            await activarCategoria(categoriaId);
            await cargarCategorias();
          } catch (error) {
            alert(`Error: ${error.message}`);
          }
        }
      }
    }
  });

  // Cambio en el filtro de estado
  if (filtroEstado) {
    filtroEstado.addEventListener("change", (e) => {
      filtroActual = e.target.value;
      aplicarFiltros();
    });
  }

  // Event listeners principales
  openBtn.addEventListener("click", openModalForAdd);
  cancelBtn.addEventListener("click", closeModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === 'Escape' && modal.style.display === "flex") {
      closeModal();
    }
  });

  // Búsqueda en tiempo real
  if (inputBuscar) {
    inputBuscar.addEventListener("input", aplicarFiltros);
  }

  // Inicializar la aplicación
  console.log("🚀 Inicializando aplicación de categorías...");
  cargarCategorias();
});