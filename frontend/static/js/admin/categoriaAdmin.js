// categoriaAdmin.js
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modal");
  const openBtn = document.getElementById("abrir-modal");
  const cancelBtn = document.getElementById("cancelar");
  const modalTitle = document.getElementById("modal-title");
  const form = modal?.querySelector("form");
  const tbody = document.getElementById("categoriaBody");
  const inputBuscar = document.getElementById("buscarCategoria");

  let editingRow = null;

  if (!modal || !form || !tbody || !inputBuscar) {
    console.error("Faltan elementos críticos en el DOM.");
    return;
  }

  /* ---------- Buscador en tiempo real ---------- */
  inputBuscar.addEventListener("input", () => {
    const texto = inputBuscar.value.trim().toLowerCase();
    [...tbody.querySelectorAll("tr")].forEach(row => {
      const nombre = row.cells[0].textContent.toLowerCase();
      row.style.display = nombre.includes(texto) ? "" : "none";
    });
  });

  /* ---------- Modal lógica (crear/editar) ---------- */
  function openModalForAdd() {
    editingRow = null;
    modalTitle.textContent = "Añadir Nueva Categoría";
    form.reset();
    modal.classList.add("activo");
    form.querySelector("#nombre").focus();
  }

  function openModalForEdit(row) {
    editingRow = row;
    modalTitle.textContent = "Editar Categoría";
    const nombre = row.cells[0].textContent.trim();
    const descripcion = row.cells[1].textContent.trim();
    form.querySelector("#nombre").value = nombre;
    form.querySelector("#descripcion").value = descripcion;
    modal.classList.add("activo");
    form.querySelector("#nombre").focus();
  }

  function closeModal() {
    modal.classList.remove("activo");
    editingRow = null;
  }

  openBtn?.addEventListener("click", openModalForAdd);
  cancelBtn?.addEventListener("click", closeModal);
  modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });

  form.addEventListener("submit", e => {
    e.preventDefault();
    const nombreEl = form.querySelector("#nombre");
    const descEl = form.querySelector("#descripcion");
    const nombre = nombreEl.value.trim();
    const descr = descEl.value.trim();

    if (!nombre) { alert("El nombre es obligatorio."); nombreEl.focus(); return; }

    if (editingRow) {
      editingRow.cells[0].textContent = nombre;
      editingRow.cells[1].textContent = descr;
    } else {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(nombre)}</td>
        <td>${escapeHtml(descr)}</td>
        <td class="centro">0</td>
        <td class="derecha">
          <button class="editar"><span class="material-symbols-outlined">edit</span></button>
          <button class="eliminar"><span class="material-symbols-outlined">delete</span></button>
        </td>`;
      tbody.appendChild(tr);
    }
    closeModal();
    form.reset();
  });

  /* ---------- Delegación editar/eliminar ---------- */
  tbody.addEventListener("click", e => {
    const editBtn = e.target.closest("button.editar");
    const delBtn = e.target.closest("button.eliminar");
    if (editBtn) { openModalForEdit(editBtn.closest("tr")); return; }
    if (delBtn) {
      const row = delBtn.closest("tr");
      const nom = row.cells[0].textContent.trim();
      if (confirm(`¿Seguro que deseas eliminar "${nom}"?`)) row.remove();
    }
  });

  /* ---------- Escapar HTML ---------- */
  function escapeHtml(text) {
    return text.replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  }
});