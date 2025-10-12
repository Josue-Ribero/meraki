document.addEventListener("DOMContentLoaded", () => {
  const orders = [
    { id: "#1011", date: "2024-05-16", client: "Valentina Mora", product: "Aretes X", total: "$95.50", status: "Pendiente" },
    { id: "#1010", date: "2024-05-15", client: "Mateo Rojas", product: "Collar de perlas", total: "$210.00", status: "En Proceso" },
    { id: "#1009", date: "2024-05-14", client: "Luciana Gil", product: "Pulsera", total: "$45.00", status: "Enviado" },
    { id: "#1008", date: "2024-05-13", client: "Emilio Cruz", product: "Set Regalo", total: "$300.00", status: "Entregado" },
    { id: "#1007", date: "2024-05-12", client: "Isabella Soto", product: "Pendientes", total: "$75.00", status: "Cancelado" }
  ];

  const perPage = 5;
  let currentPage = 1;

  const tbody = document.getElementById("tabla-body");
  const statusFilter = document.getElementById("status-filter");
  const dateFilter = document.getElementById("date-filter");
  const clientFilter = document.getElementById("client-filter");
  const productFilter = document.getElementById("product-filter");
  const filterBtn = document.getElementById("filter-button");
  const resultsInfo = document.querySelector(".results-info");
  const paginationEl = document.querySelector(".pagination");

  if (!tbody) return;

  function formatDateLong(iso) {
    if (!iso) return "";
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  }

  function badgeClassesFor(status) {
    switch (status) {
      case "Pendiente": return "inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800";
      case "En Proceso": return "inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-cyan-100 text-cyan-800";
      case "Enviado": return "inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800";
      case "Entregado": return "inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800";
      case "Cancelado": return "inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800";
      default: return "inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800";
    }
  }

  function applyFilters() {
    const status = statusFilter.value || "Todos";
    const date = dateFilter.value || "";
    const client = (clientFilter.value || "").trim().toLowerCase();
    const product = (productFilter.value || "").trim().toLowerCase();

    return orders.filter(o => {
      if (status !== "Todos" && o.status !== status) return false;
      if (date && o.date !== date) return false;
      if (client && !o.client.toLowerCase().includes(client)) return false;
      if (product && !o.product.toLowerCase().includes(product)) return false;
      return true;
    });
  }

  function renderTable() {
    const filtered = applyFilters();
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    if (currentPage > totalPages) currentPage = totalPages;

    const start = (currentPage - 1) * perPage;
    const pageItems = filtered.slice(start, start + perPage);

    tbody.innerHTML = "";
    for (const o of pageItems) {
      const tr = document.createElement("tr");
      tr.className = "hover:bg-gray-50";
      tr.innerHTML = `
        <td class="px-6 py-4 text-sm font-medium text-[var(--c-363636)]">${o.id}</td>
        <td class="px-6 py-4 text-sm">${formatDateLong(o.date)}</td>
        <td class="px-6 py-4 text-sm">${escapeHtml(o.client)}</td>
        <td class="px-6 py-4 text-sm">${escapeHtml(o.total)}</td>
        <td class="px-6 py-4 text-center"><span class="${badgeClassesFor(o.status)}">${o.status}</span></td>
        <td class="px-6 py-4 text-center">
          <button class="text-[var(--c-aa8744)] hover:text-[var(--c-9c642d)] p-1 edit-btn" data-id="${o.id}" title="Editar"><span class="material-symbols-outlined text-base">edit</span></button>
          <button class="text-[var(--c-aa8744)] hover:text-[var(--c-9c642d)] p-1 print-btn" data-id="${o.id}" title="Imprimir"><span class="material-symbols-outlined text-base">print</span></button>
          <button class="text-[var(--c-aa8744)] hover:text-[var(--c-9c642d)] p-1 mail-btn" data-id="${o.id}" title="Mail"><span class="material-symbols-outlined text-base">mail</span></button>
        </td>
      `;
      tbody.appendChild(tr);
    }

    if (resultsInfo) resultsInfo.textContent = `Mostrando ${pageItems.length} de ${filtered.length} pedidos`;
    renderPagination(totalPages);
  }

  function renderPagination(totalPages) {
    if (!paginationEl) return;
    paginationEl.innerHTML = "";
    const prev = document.createElement("button");
    prev.textContent = "Anterior";
    prev.className = "page-btn";
    prev.disabled = currentPage === 1;
    prev.addEventListener("click", () => { currentPage = Math.max(1, currentPage - 1); renderTable(); });
    paginationEl.appendChild(prev);

    for (let i = 1; i <= totalPages; i++) {
      const b = document.createElement("button");
      b.textContent = i;
      b.className = "page-btn" + (i === currentPage ? " active" : "");
      b.addEventListener("click", () => { currentPage = i; renderTable(); });
      paginationEl.appendChild(b);
    }

    const next = document.createElement("button");
    next.textContent = "Siguiente";
    next.className = "page-btn";
    next.disabled = currentPage === totalPages;
    next.addEventListener("click", () => { currentPage = Math.min(totalPages, currentPage + 1); renderTable(); });
    paginationEl.appendChild(next);
  }

  tbody.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const id = btn.dataset.id;
    if (!id) return;
    const order = orders.find(o => o.id === id);
    if (!order) return;

    if (btn.classList.contains("edit-btn")) {
      openModal(order);
    } else if (btn.classList.contains("print-btn")) {
      printOrder(order);
    } else if (btn.classList.contains("mail-btn")) {
      mailOrder(order);
    }
  });

  filterBtn.addEventListener("click", () => { currentPage = 1; renderTable(); });
  [statusFilter, dateFilter, clientFilter, productFilter].forEach(el => {
    el.addEventListener("input", () => { currentPage = 1; renderTable(); });
  });

  function openModal(order) {
    const existing = document.getElementById("order-modal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "order-modal";
    modal.style.cssText = "position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);z-index:9999;padding:20px;";
    modal.innerHTML = `
      <div style="width:100%;max-width:680px;background:#fff;border-radius:12px;padding:18px;">
        <h3 style="font-size:18px;margin-bottom:8px;">Detalles del pedido ${escapeHtml(order.id)}</h3>
        <form id="modal-form" style="display:grid;gap:8px;">
          <label>Fecha <input id="m-date" type="date" value="${order.date}" class="input"></label>
          <label>Cliente <input id="m-client" type="text" value="${escapeHtml(order.client)}" class="input"></label>
          <label>Producto <input id="m-product" type="text" value="${escapeHtml(order.product)}" class="input"></label>
          <label>Total <input id="m-total" type="text" value="${escapeHtml(order.total)}" class="input"></label>
          <label>Estado 
            <select id="m-status" class="input">
              <option${order.status === "Pendiente" ? ' selected' : ''}>Pendiente</option>
              <option${order.status === "En Proceso" ? ' selected' : ''}>En Proceso</option>
              <option${order.status === "Enviado" ? ' selected' : ''}>Enviado</option>
              <option${order.status === "Entregado" ? ' selected' : ''}>Entregado</option>
              <option${order.status === "Cancelado" ? ' selected' : ''}>Cancelado</option>
            </select>
          </label>
          <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:6px;">
            <button type="button" id="m-close" class="btn-secondary">Cerrar</button>
            <button type="submit" id="m-save" class="btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector("#m-close").addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (ev) => { if (ev.target === modal) modal.remove(); });

    modal.querySelector("#modal-form").addEventListener("submit", (ev) => {
      ev.preventDefault();
      order.date = modal.querySelector("#m-date").value;
      order.client = modal.querySelector("#m-client").value.trim();
      order.product = modal.querySelector("#m-product").value.trim();
      order.total = modal.querySelector("#m-total").value.trim();
      order.status = modal.querySelector("#m-status").value;
      renderTable();
      modal.remove();
    });
  }

  function printOrder(order) {
    const html = `
      <html><head><title>Imprimir ${order.id}</title></head>
      <body style="font-family:Arial,Helvetica,sans-serif;padding:20px;">
        <h2>Pedido ${order.id}</h2>
        <p><strong>Fecha:</strong> ${formatDateLong(order.date)}</p>
        <p><strong>Cliente:</strong> ${escapeHtml(order.client)}</p>
        <p><strong>Producto:</strong> ${escapeHtml(order.product)}</p>
        <p><strong>Total:</strong> ${escapeHtml(order.total)}</p>
        <p><strong>Estado:</strong> ${escapeHtml(order.status)}</p>
        <script>window.print();setTimeout(()=>window.close(),200);</script>
      </body></html>`;
    const w = window.open("", "_blank", "width=600,height=600");
    if (!w) { alert("No se pudo abrir la ventana de impresión (bloqueador?)."); return; }
    w.document.write(html);
    w.document.close();
  }

  function mailOrder(order) {
    const subj = encodeURIComponent(`Detalles pedido ${order.id}`);
    const body = encodeURIComponent(`Pedido: ${order.id}%0AFecha: ${formatDateLong(order.date)}%0ACliente: ${order.client}%0AProducto: ${order.product}%0ATotal: ${order.total}%0AEstado: ${order.status}`);
    window.location.href = `mailto:?subject=${subj}&body=${body}`;
  }

  function escapeHtml(str) {
    if (typeof str !== "string") return str;
    return str.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  }

  renderTable();
});