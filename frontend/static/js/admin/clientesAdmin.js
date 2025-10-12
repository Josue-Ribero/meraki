document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("searchInput");
  const tbody = document.getElementById("clientsBody");

  /* ---------- Datos simulados de pedidos ---------- */
  const pedidos = {
    1: [
      { fecha: "2024-05-12", total: "$1,250.00", estado: "Entregado" },
      { fecha: "2024-03-08", total: "$680.00", estado: "Entregado" }
    ],
    2: [
      { fecha: "2024-04-22", total: "$320.00", estado: "Entregado" }
    ],
    3: [
      { fecha: "2024-06-01", total: "$2,100.00", estado: "Entregado" },
      { fecha: "2024-05-18", total: "$950.00", estado: "Cancelado" },
      { fecha: "2024-02-10", total: "$450.00", estado: "Entregado" }
    ],
    4: [
      { fecha: "2024-03-30", total: "$150.00", estado: "Entregado" }
    ],
    5: [
      { fecha: "2024-05-25", total: "$1,800.00", estado: "Entregado" },
      { fecha: "2024-01-15", total: "$670.00", estado: "Entregado" }
    ]
  };

  /* ---------- Buscador ---------- */
  function filterRows(query) {
    const term = query.trim().toLowerCase();
    [...tbody.querySelectorAll("tr")].forEach(row => {
      if (row.classList.contains("detail-row")) return;
      const name = (row.querySelector(".client-name")?.textContent || "").toLowerCase();
      const email = (row.querySelector(".client-email")?.textContent || "").toLowerCase();
      const phone = (row.querySelector(".client-phone")?.textContent || "").toLowerCase();
      row.style.display = (name.includes(term) || email.includes(term) || phone.includes(term)) ? "" : "none";
    });
  }
  searchInput.addEventListener("input", () => filterRows(searchInput.value));

  /* ---------- Mostrar/ocultar historial ---------- */
  tbody.addEventListener("click", e => {
    const btn = e.target.closest(".view-btn");
    if (!btn) return;

    const row = btn.closest("tr");
    const next = row.nextElementSibling;
    const id = row.dataset.cliente;

    // Si ya hay un panel abierto para este cliente, lo cerramos
    if (next && next.classList.contains("detail-row")) {
      next.remove();
      return;
    }

    // Eliminar cualquier otro panel abierto previamente
    tbody.querySelectorAll(".detail-row").forEach(r => r.remove());

    // Construir tabla de pedidos
    const lista = pedidos[id] || [];
    let html = "<strong>Historial de pedidos</strong><br><br>";
    if (!lista.length) {
      html += "No hay pedidos registrados.";
    } else {
      html += `<table class="hist-table"><thead><tr>
                 <th>Fecha</th><th>Total</th><th>Estado</th>
               </tr></thead><tbody>`;
      lista.forEach(p => {
        html += `<tr>
                   <td>${p.fecha}</td>
                   <td>${p.total}</td>
                   <td><span class="badge ${p.estado.toLowerCase()}">${p.estado}</span></td>
                 </tr>`;
      });
      html += "</tbody></table>";
    }

    const detail = document.createElement("tr");
    detail.className = "detail-row";
    detail.innerHTML = `
      <td colspan="4">
        <div class="detail-panel">${html}</div>
      </td>
    `;
    row.after(detail);
  });
});