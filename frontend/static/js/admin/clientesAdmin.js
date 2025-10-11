// clientes.js
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const table = document.getElementById("clientsTable");
  const tbody = table.querySelector("tbody");

  // Filtrar filas por texto (nombre, email o teléfono)
  function filterRows(query) {
    const term = query.trim().toLowerCase();
    const rows = Array.from(tbody.querySelectorAll("tr"));
    rows.forEach(row => {
      const name = (row.querySelector(".client-name")?.textContent || "").toLowerCase();
      const email = (row.querySelector(".client-email")?.textContent || "").toLowerCase();
      const phone = (row.querySelector(".client-phone")?.textContent || "").toLowerCase();
      const match = name.includes(term) || email.includes(term) || phone.includes(term);
      row.style.display = match || term === "" ? "" : "none";
    });
  }

  // Debounce básico para mejorar rendimiento en máquinas lentas
  function debounce(fn, delay = 200) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  if (searchInput) {
    searchInput.addEventListener("input", debounce((e) => {
      filterRows(e.target.value);
    }, 150));
  }

  // Manejo del botón "Ver" — delegación
  tbody.addEventListener("click", (e) => {
    const btn = e.target.closest(".view-btn");
    if (!btn) return;
    const row = btn.closest("tr");
    if (!row) return;

    const name = row.querySelector(".client-name")?.textContent?.trim() || "—";
    const email = row.querySelector(".client-email")?.textContent?.trim() || "—";
    const phone = row.querySelector(".client-phone")?.textContent?.trim() || "—";
    const points = row.querySelector(".badge")?.textContent?.trim() || "0";

    // por ahora muestra una alerta simple; cámbialo por un modal si quieres
    alert(`Cliente: ${name}\nEmail: ${email}\nTeléfono: ${phone}\nPuntos: ${points}`);
  });
});