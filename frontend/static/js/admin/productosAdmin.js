/* script.js - gestión de productos (Local, sin backend) */
(() => {
  const STORAGE_KEY = "meraki_products_v1";

  // Productos iniciales (se usan si no hay localStorage)
  const initialProducts = [
    {
      id: "MK-C001",
      nombre: "Collar de Perlas Finas",
      sku: "MK-C001",
      categoria: "Collares",
      stock: 15,
      precio: 125.0,
      imagen: "https://lh3.googleusercontent.com/aida-public/AB6AXuAJxzS1PUIrsSDWpBwn7kT1lJ3nbgOSN71xvUyyltOs1t6fKluZlZXQo0GiV6Mcr6ZQ5yTXqtQBvXn_FDgS-DI29KQxisqf0Cfp7dteiLG-NFNWBZtq6-m-D3ohtZrzS4KiGcpErSujPCsEJ789QH5zn8sTAa2IGJ_q2m9DDWUyrA2AWp5vr5bJrVeSbkK2y4E9vEkD2FrAoLwFjpmaDis_yQzNbIdWUpAFSbSUurloSsiHkWkGvIURg9fWTBI2MucWJZLBHuX2MIIK",
      visible: true
    },
    {
      id: "MK-A002",
      nombre: "Aretes de Oro 18k",
      sku: "MK-A002",
      categoria: "Aretes",
      stock: 32,
      precio: 250.0,
      imagen: "https://lh3.googleusercontent.com/aida-public/AB6AXuCAKpHLB-_T-FU6vBlmJorHhqJX4OeePLkJVPEK_rWxfqKplMCGvLd4trXi1iKXQuyRBN0j6eywhexk9Jw7hpC1x86TVEADOYv8oTQWHlQTfn6i_cRHzOdBxRugxb63kS4uAMK0ci4ILAzEB_CYVl7Q1Xqwh-tP2Hs9j_UGHQcuPptira7mwnd3KjlXxe0ODOcaVcSkxUE2jR9A4_UCXPfqfZX2lGGlaGBgPSanU9HVLJCk7ivsRAnqjiF0SOSexcLGEYKIH7kyiBPJ",
      visible: true
    },
    {
      id: "MK-P003",
      nombre: "Pulsera de Plata 950",
      sku: "MK-P003",
      categoria: "Pulseras",
      stock: 0,
      precio: 95.0,
      imagen: "https://lh3.googleusercontent.com/aida-public/AB6AXuDx5Ap5bYkkTykGvsEC54KBRIHajn_iYIT1Dj_MJdz7LGCwz8e92fQaNuQBiBBMWU_zS9ILRrbdbTcogbvOOvMX1f3QglP5r3aUcQaOMrv7WclUDQgAnWch8Ek0sZT22mZu9dDpcOLg9FiI4cTSbJhoUo0JPH_akxVMwGLxOygn2IFXzJAQkAh9tc2l6acWLGnM0y5kLZsW0zwNs1SiAe4A5ItTfIiEmfY5ZwGNoxLyIt7J6_A4pwYSf2RXqWZXDpOOu-HkY9J8ZVIA",
      visible: false
    }
  ];

  // estado
  let productos = [];

  // DOM
  const productBody = document.getElementById("productBody");
  const searchInput = document.getElementById("searchInput");
  const btnAdd = document.getElementById("btnAdd");

  const modal = document.getElementById("productModal");
  const form = document.getElementById("productForm");
  const inputId = document.getElementById("product-id");
  const inputName = document.getElementById("product-name");
  const inputSku = document.getElementById("product-sku");
  const inputCategory = document.getElementById("product-category");
  const inputStock = document.getElementById("product-stock");
  const inputPrice = document.getElementById("product-price");
  const inputImage = document.getElementById("product-image");
  const inputVisible = document.getElementById("product-visible");
  const btnCancel = document.getElementById("modal-cancel");
  const btnDelete = document.getElementById("modal-delete");

  // helpers
  const saveToStorage = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(productos));
  const loadFromStorage = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  };

  // inicializar
  function init() {
    const fromStorage = loadFromStorage();
    productos = fromStorage && Array.isArray(fromStorage) ? fromStorage : initialProducts.slice();
    renderTable();
    attachEvents();
  }

  // render tabla (filtrado simple)
  function renderTable(filter = "") {
    if (!productBody) return;
    productBody.innerHTML = "";

    const q = (filter || "").toLowerCase().trim();
    const filtered = productos.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.categoria || "").toLowerCase().includes(q)
    );

    filtered.forEach(p => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="py-4 px-6">
          <div class="flex items-center gap-4">
            <img src="${escapeHtml(p.imagen || '')}" alt="${escapeHtml(p.nombre)}" class="product-thumb" onerror="this.style.opacity=.5;"/>
            <div>
              <div class="font-medium">${escapeHtml(p.nombre)}</div>
            </div>
          </div>
        </td>
        <td class="py-4 px-6">${escapeHtml(p.sku)}</td>
        <td class="py-4 px-6">${escapeHtml(p.categoria || '')}</td>
        <td class="py-4 px-6 text-center ${p.stock === 0 ? 'text-red-600 font-semibold' : ''}">${p.stock}</td>
        <td class="py-4 px-6 text-right">$${Number(p.precio).toFixed(2)}</td>
        <td class="py-4 px-6 text-center">
          ${p.visible ? '<span class="badge-visible"><span style="width:8px;height:8px;background:#16a34a;border-radius:50%;display:inline-block;"></span> Visible</span>'
                     : '<span class="badge-hidden"><span style="width:8px;height:8px;background:#6b7280;border-radius:50%;display:inline-block;"></span> Oculto</span>'}
          <div style="margin-top:8px;">
            <button class="action edit-btn" data-id="${p.id}" title="Editar"><span class="material-symbols-outlined">edit</span></button>
            <button class="action delete-btn" data-id="${p.id}" title="Eliminar"><span class="material-symbols-outlined text-red-600">delete</span></button>
          </div>
        </td>
      `;
      productBody.appendChild(tr);
    });
  }

  // escapar HTML básico
  function escapeHtml(s) { return (s||"").toString().replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m])); }

  // eventos (delegación)
  function attachEvents() {
    // buscar (debounce)
    let t;
    searchInput && searchInput.addEventListener("input", (e) => {
      clearTimeout(t);
      t = setTimeout(() => renderTable(e.target.value), 180);
    });

    // abrir modal para añadir
    btnAdd && btnAdd.addEventListener("click", () => openModal());

    // acciones de tabla (delegación)
    productBody && productBody.addEventListener("click", (ev) => {
      const editBtn = ev.target.closest(".edit-btn");
      const delBtn = ev.target.closest(".delete-btn");
      if (editBtn) {
        const id = editBtn.dataset.id;
        const prod = productos.find(x => x.id === id);
        if (prod) openModal(prod);
      } else if (delBtn) {
        const id = delBtn.dataset.id;
        if (!confirm("¿Eliminar este producto?")) return;
        productos = productos.filter(x => x.id !== id);
        saveToStorage();
        renderTable(searchInput ? searchInput.value : "");
      }
    });

    // modal: cancelar
    btnCancel && btnCancel.addEventListener("click", closeModal);

    // modal: borrar desde modal
    btnDelete && btnDelete.addEventListener("click", () => {
      const id = inputId.value;
      if (!id) return;
      if (!confirm("¿Eliminar este producto?")) return;
      productos = productos.filter(x => x.id !== id);
      saveToStorage();
      closeModal();
      renderTable(searchInput ? searchInput.value : "");
    });

    // submit modal (guardar)
    form && form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      const id = inputId.value || generateId();
      const item = {
        id: id,
        nombre: inputName.value.trim(),
        sku: inputSku.value.trim(),
        categoria: inputCategory.value.trim(),
        stock: Number(inputStock.value) || 0,
        precio: Number(inputPrice.value) || 0,
        imagen: inputImage.value.trim() || '',
        visible: !!inputVisible.checked
      };

      const exists = productos.findIndex(p => p.id === id);
      if (exists >= 0) productos[exists] = item;
      else productos.unshift(item); // agregar arriba

      saveToStorage();
      closeModal();
      renderTable(searchInput ? searchInput.value : "");
    });

    // cerrar modal con Esc
    window.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape" && modal && modal.getAttribute("aria-hidden")==="false") closeModal();
    });
  }

  // abrir modal: si product dado -> edición, si no -> creación
  function openModal(product) {
    if (!modal) return;
    modal.setAttribute("aria-hidden", "false");

    if (!product) {
      inputId.value = "";
      inputName.value = "";
      inputSku.value = "";
      inputCategory.value = "";
      inputStock.value = 0;
      inputPrice.value = 0;
      inputImage.value = "";
      inputVisible.checked = true;
      btnDelete.style.display = "none";
      document.getElementById("modal-title").textContent = "Añadir Producto";
    } else {
      inputId.value = product.id;
      inputName.value = product.nombre;
      inputSku.value = product.sku;
      inputCategory.value = product.categoria || "";
      inputStock.value = product.stock;
      inputPrice.value = product.precio;
      inputImage.value = product.imagen || "";
      inputVisible.checked = !!product.visible;
      btnDelete.style.display = "";
      document.getElementById("modal-title").textContent = "Editar Producto";
    }
  }

  function closeModal() {
    if (!modal) return;
    modal.setAttribute("aria-hidden", "true");
  }

  function generateId() {
    return "P" + Date.now().toString(36) + Math.floor(Math.random()*1000).toString(36);
  }

  // inicialización
  init();
})();