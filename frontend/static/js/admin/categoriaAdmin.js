// categoriaAdmin.js - VERSIÓN DEBUG
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Script categoriaAdmin.js cargado");

  const modal = document.getElementById("modal");
  const openBtn = document.getElementById("abrir-modal");
  const cancelBtn = document.getElementById("cancelar");
  const modalTitle = document.getElementById("modal-title");
  const form = modal?.querySelector("form");
  const tbody = document.getElementById("categoriaBody");
  const inputBuscar = document.getElementById("buscarCategoria");

  let editingRow = null;
  let categorias = [];

  // Configuración de la API
  const API_BASE = 'http://localhost:8000';
  const CATEGORIAS_ENDPOINT = `${API_BASE}/categorias`;

  console.log("🔗 Endpoint de API:", CATEGORIAS_ENDPOINT);

  // Verificar elementos críticos
  if (!modal || !form || !tbody || !inputBuscar) {
    console.error("❌ Elementos del DOM no encontrados:", {
      modal: !!modal,
      form: !!form,
      tbody: !!tbody,
      inputBuscar: !!inputBuscar
    });
    return;
  }

  console.log("✅ Todos los elementos del DOM encontrados");

  /* ---------- Cargar categorías ---------- */
  async function cargarCategorias() {
    console.log("🔄 Cargando categorías...");

    try {
      showLoading();

      const response = await fetch(CATEGORIAS_ENDPOINT, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include'
      });

      console.log("📡 Respuesta GET:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn("⚠️ Endpoint no encontrado (404)");
          showError("El endpoint de categorías no está disponible");
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("📦 Datos recibidos:", data);

      categorias = data;
      renderizarCategorias(categorias);

    } catch (error) {
      console.error("❌ Error cargando categorías:", error);

      if (error.message.includes('Failed to fetch')) {
        showError("No se pudo conectar con el servidor. Verifica que esté ejecutándose.");
      } else {
        showError(`Error al cargar categorías: ${error.message}`);
      }
    }
  }

  /* ---------- Renderizar categorías ---------- */
  function renderizarCategorias(categorias) {
    console.log("🎨 Renderizando", categorias.length, "categorías");

    tbody.innerHTML = '';

    if (categorias.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="centro">No hay categorías disponibles</td>
        </tr>`;
      return;
    }

    categorias.forEach(categoria => {
      const tr = document.createElement("tr");
      tr.dataset.id = categoria.id;
      tr.innerHTML = `
        <td>${escapeHtml(categoria.nombre)}</td>
        <td>${escapeHtml(categoria.descripcion || 'Sin descripción')}</td>
        <td class="centro">${categoria.contarProductos ? categoria.contarProductos() : 0}</td>
        <td class="derecha">
          <button class="editar" data-id="${categoria.id}">
            <span class="material-symbols-outlined">edit</span>
          </button>
          <button class="eliminar" data-id="${categoria.id}">
            <span class="material-symbols-outlined">delete</span>
          </button>
        </td>`;
      tbody.appendChild(tr);
    });
  }

  /* ---------- Funciones de API ---------- */
  async function crearCategoria(nombre, descripcion) {
    console.log("📤 Creando categoría:", { nombre, descripcion });

    const response = await fetch(CATEGORIAS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        nombre: nombre,
        descripcion: descripcion
      })
    });

    console.log("📨 Respuesta POST:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {
        // No se pudo parsear como JSON
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  }

  async function editarCategoria(id, nombre, descripcion) {
    console.log("✏️ Editando categoría", id, ":", { nombre, descripcion });

    const updateData = {};
    if (nombre !== undefined) updateData.nombre = nombre;
    if (descripcion !== undefined) updateData.descripcion = descripcion;

    const response = await fetch(`${CATEGORIAS_ENDPOINT}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(updateData)
    });

    console.log("📨 Respuesta PATCH:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {
        // No se pudo parsear como JSON
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  }

  async function eliminarCategoria(id) {
    console.log("🗑️ Eliminando categoría:", id);

    const response = await fetch(`${CATEGORIAS_ENDPOINT}/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    console.log("📨 Respuesta DELETE:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      let errorMessage = `Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {
        // No se pudo parsear como JSON
      }
      throw new Error(errorMessage);
    }

    return { success: true };
  }

  /* ---------- UI Functions ---------- */
  function openModalForAdd() {
    console.log("➕ Abriendo modal para agregar");
    editingRow = null;
    modalTitle.textContent = "Añadir Nueva Categoría";
    form.reset();
    modal.classList.add("activo");
  }

  function openModalForEdit(categoria) {
    console.log("✏️ Abriendo modal para editar:", categoria);
    editingRow = categoria;
    modalTitle.textContent = "Editar Categoría";
    form.querySelector("#nombre").value = categoria.nombre;
    form.querySelector("#descripcion").value = categoria.descripcion || '';
    modal.classList.add("activo");
  }

  function closeModal() {
    console.log("❌ Cerrando modal");
    modal.classList.remove("activo");
    editingRow = null;
    form.reset();
  }

  function showLoading() {
    tbody.innerHTML = `
      <tr id="loadingRow">
        <td colspan="4" class="centro">🔄 Cargando categorías...</td>
      </tr>`;
  }

  function showError(message) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="centro" style="color: red;">❌ ${message}</td>
      </tr>`;
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /* ---------- Event Listeners ---------- */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("📝 Enviando formulario");

    const nombre = form.querySelector("#nombre").value.trim();
    const descripcion = form.querySelector("#descripcion").value.trim();

    if (!nombre) {
      alert("El nombre es obligatorio.");
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = "Guardando...";

      if (editingRow) {
        const newNombre = nombre !== editingRow.nombre ? nombre : undefined;
        const newDescripcion = descripcion !== (editingRow.descripcion || '') ? descripcion : undefined;
        await editarCategoria(editingRow.id, newNombre, newDescripcion);
      } else {
        await crearCategoria(nombre, descripcion);
      }

      closeModal();
      await cargarCategorias();
      console.log("✅ Operación completada exitosamente");

    } catch (error) {
      console.error("❌ Error en formulario:", error);
      alert(`Error: ${error.message}`);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  tbody.addEventListener("click", async (e) => {
    const editBtn = e.target.closest("button.editar");
    const delBtn = e.target.closest("button.eliminar");

    if (editBtn) {
      const categoriaId = parseInt(editBtn.dataset.id);
      const categoria = categorias.find(cat => cat.id === categoriaId);
      if (categoria) openModalForEdit(categoria);
      return;
    }

    if (delBtn) {
      const categoriaId = parseInt(delBtn.dataset.id);
      const categoria = categorias.find(cat => cat.id === categoriaId);

      if (categoria && confirm(`¿Estás seguro de que deseas eliminar la categoría "${categoria.nombre}"?`)) {
        try {
          await eliminarCategoria(categoriaId);
          await cargarCategorias();
          console.log("✅ Categoría eliminada exitosamente");
        } catch (error) {
          console.error("❌ Error al eliminar:", error);
          alert(`Error al eliminar: ${error.message}`);
        }
      }
    }
  });

  openBtn?.addEventListener("click", openModalForAdd);
  cancelBtn?.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  inputBuscar.addEventListener("input", () => {
    const texto = inputBuscar.value.trim().toLowerCase();
    const filtradas = categorias.filter(cat =>
      cat.nombre.toLowerCase().includes(texto) ||
      (cat.descripcion && cat.descripcion.toLowerCase().includes(texto))
    );
    renderizarCategorias(filtradas);
  });

  // Inicializar
  console.log("🚀 Inicializando aplicación...");
  cargarCategorias();
});