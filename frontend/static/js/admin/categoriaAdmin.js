// categorias.js
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modal");               // overlay del modal
  const openBtn = document.getElementById("abrir-modal");      // botón "Añadir Categoría"
  const cancelBtn = document.getElementById("cancelar");       // botón "Cancelar" dentro del modal
  const modalTitle = document.getElementById("modal-title");   // título del modal
  const form = modal ? modal.querySelector("form") : null;     // el formulario dentro del modal
  const tbody = document.querySelector("table tbody");         // tbody de la tabla (delegación)
  let editingRow = null; // fila que estamos editando (null si estamos creando)

  // seguridad: si faltan elementos clave, reportar y salir
  if (!modal || !form || !tbody) {
    console.error("categorias.js: faltan elementos esperados en el DOM (modal, form o tbody). Revisa los IDs y estructura HTML.");
    return;
  }

  function openModalForAdd() {
    editingRow = null;
    modalTitle.textContent = "Añadir Nueva Categoría";
    form.reset();
    modal.classList.add("activo");   // en tu CSS .modal.activo => display:flex
    form.querySelector("#nombre").focus();
  }

  function openModalForEdit(row) {
    editingRow = row;
    modalTitle.textContent = "Editar Categoría";
    const nombre = row.querySelector("td:nth-child(1)").textContent.trim();
    const descripcion = row.querySelector("td:nth-child(2)").textContent.trim();
    form.querySelector("#nombre").value = nombre;
    form.querySelector("#descripcion").value = descripcion;
    modal.classList.add("activo");
    form.querySelector("#nombre").focus();
  }

  function closeModal() {
    modal.classList.remove("activo");
    editingRow = null;
  }

  // abrir modal para crear
  if (openBtn) openBtn.addEventListener("click", openModalForAdd);

  // cerrar modal (botón cancelar)
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

  // cerrar modal clicando fuera (overlay)
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // submit del formulario (crear o editar)
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nombreEl = form.querySelector("#nombre");
    const descEl = form.querySelector("#descripcion");
    const nombre = nombreEl.value.trim();
    const descripcion = descEl.value.trim();

    if (!nombre) {
      alert("El nombre de la categoría es obligatorio.");
      nombreEl.focus();
      return;
    }

    if (editingRow) {
      // editar fila existente
      editingRow.querySelector("td:nth-child(1)").textContent = nombre;
      editingRow.querySelector("td:nth-child(2)").textContent = descripcion;
    } else {
      // crear nueva fila
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="px-6 py-4 font-medium">${escapeHtml(nombre)}</td>
        <td class="px-6 py-4 text-gray-500 max-w-xs truncate">${escapeHtml(descripcion)}</td>
        <td class="px-6 py-4 text-center">0</td>
        <td class="px-6 py-4 text-right">
          <button class="editar p-1" title="Editar"><span class="material-symbols-outlined">edit</span></button>
          <button class="eliminar p-1 ml-2" title="Eliminar"><span class="material-symbols-outlined">delete</span></button>
        </td>
      `;
      tbody.appendChild(tr);
    }

    closeModal();
    form.reset();
  });

  // delegación para editar/eliminar filas existentes (incluye las nuevas dinámicas)
  tbody.addEventListener("click", (e) => {
    const editBtn = e.target.closest("button.editar");
    const deleteBtn = e.target.closest("button.eliminar");

    if (editBtn) {
      const row = editBtn.closest("tr");
      if (row) openModalForEdit(row);
      return;
    }

    if (deleteBtn) {
      const row = deleteBtn.closest("tr");
      if (!row) return;
      const nombre = row.querySelector("td:nth-child(1)")?.textContent?.trim() || "esta categoría";
      if (confirm(`¿Seguro que deseas eliminar "${nombre}"?`)) {
        row.remove();
      }
    }
  });

  // función simple para escapar texto antes de inyectarlo en HTML (previene XSS básico)
  function escapeHtml(text) {
    return text.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  }
});