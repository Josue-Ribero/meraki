// productosAdmin.js - CON FILTROS, PAGINACIÓN Y TODAS LAS FUNCIONES
(() => {
  // Configuración base de la API
  const API_BASE = "";
  let productos = [];
  let categorias = [];

  // Variables para filtros y paginación
  let filtroEstado = "todos"; // "todos", "activos", "inactivos"
  let paginaActual = 1;
  const productosPorPagina = 5;

  // Elementos del DOM
  const productBody = document.getElementById("productBody");
  const searchInput = document.getElementById("searchInput");
  const filtroEstadoSelect = document.getElementById("filtroEstado");
  const btnAdd = document.getElementById("btnAdd");
  const modal = document.getElementById("productModal");
  const form = document.getElementById("productForm");
  const inputId = document.getElementById("product-id");
  const inputName = document.getElementById("product-name");
  const inputSku = document.getElementById("product-sku");
  const inputCategory = document.getElementById("product-category");
  const inputStock = document.getElementById("product-stock");
  const inputPrice = document.getElementById("product-price");
  const inputDescription = document.getElementById("product-description");
  const inputImage = document.getElementById("product-image");
  const inputVisible = document.getElementById("product-visible");
  const btnCancel = document.getElementById("modal-cancel");
  const btnDelete = document.getElementById("modal-delete");
  const imagePreview = document.getElementById("image-preview");
  const previewImg = document.getElementById("preview-img");

  // Contenedor para paginación
  let paginacionContainer;

  // Función para inicializar la paginación
  function inicializarPaginacion() {
    if (!document.getElementById('paginacion-container')) {
      const table = document.getElementById('productTable');
      const paginacionDiv = document.createElement('div');
      paginacionDiv.id = 'paginacion-container';
      paginacionDiv.className = 'flex justify-between items-center mt-6';
      paginacionDiv.innerHTML = `
        <span id="infoPaginacion" class="text-sm text-gray-500">Mostrando 0 de 0 productos</span>
        <div id="paginacion" class="flex items-center gap-2"></div>
      `;
      table.parentNode.insertBefore(paginacionDiv, table.nextSibling);
    }
    paginacionContainer = document.getElementById('paginacion');
  }

  // Función para hacer requests a la API
  async function apiCall(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Accept': 'application/json',
          ...options.headers,
        },
        credentials: 'include',
        ...options
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      if (response.status === 204) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }

  // Cargar productos desde la API
  async function cargarProductos() {
    try {
      console.log("🔄 Cargando productos desde la API...");
      // Cargar TODOS los productos (incluyendo inactivos)
      productos = await apiCall('/productos/todas');
      console.log("✅ Productos cargados:", productos);
      aplicarFiltrosYRenderizar();
    } catch (error) {
      console.error('Error cargando productos:', error);
      // Si no existe el endpoint /todas, intentar con el normal
      try {
        productos = await apiCall('/productos/');
        console.log("✅ Productos cargados (solo activos):", productos);
        aplicarFiltrosYRenderizar();
      } catch (error2) {
        showError('Error al cargar los productos: ' + error2.message);
      }
    }
  }

  // Cargar categorías desde la API
  async function cargarCategorias() {
    try {
      console.log("🔄 Cargando categorías desde la API...");
      categorias = await apiCall('/categorias/todas');
      console.log("✅ Categorías cargadas:", categorias);
    } catch (error) {
      console.error('Error cargando categorías:', error);
      categorias = [
        { id: 1, nombre: "Collares" },
        { id: 2, nombre: "Aretes" },
        { id: 3, nombre: "Pulseras" },
        { id: 4, nombre: "Anillos" }
      ];
    }
  }

  // Aplicar filtros y renderizar
  function aplicarFiltrosYRenderizar() {
    const textoBusqueda = searchInput ? searchInput.value.toLowerCase().trim() : '';

    let productosFiltrados = productos.filter(p => {
      // Filtro por texto
      const coincideTexto = !textoBusqueda ||
        p.nombre.toLowerCase().includes(textoBusqueda) ||
        (p.sku && p.sku.toLowerCase().includes(textoBusqueda)) ||
        (getCategoriaNombre(p.categoriaID) || "").toLowerCase().includes(textoBusqueda);

      // Filtro por estado
      const coincideEstado =
        filtroEstado === "todos" ||
        (filtroEstado === "activos" && p.activo) ||
        (filtroEstado === "inactivos" && !p.activo);

      return coincideTexto && coincideEstado;
    });

    renderTable(productosFiltrados);
  }

  function renderTable(productosFiltrados = []) {
    if (!productBody) return;

    // Calcular paginación
    const totalProductos = productosFiltrados.length;
    const totalPaginas = Math.max(1, Math.ceil(totalProductos / productosPorPagina));

    // Ajustar página actual si es necesario
    if (paginaActual > totalPaginas) {
      paginaActual = totalPaginas;
    }

    const inicio = (paginaActual - 1) * productosPorPagina;
    const fin = inicio + productosPorPagina;
    const productosPagina = productosFiltrados.slice(inicio, fin);

    productBody.innerHTML = "";

    if (productosPagina.length === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td colspan="6" class="py-8 text-center text-gray-500">
          No se encontraron productos
        </td>
      `;
      productBody.appendChild(tr);
    } else {
      productosPagina.forEach(p => {
        const tr = document.createElement("tr");
        const imagenSrc = p.imagenURL || '/static/images/default-product.jpg';
        const categoriaNombre = getCategoriaNombre(p.categoriaID);

        tr.innerHTML = `
          <td class="py-4 px-6">
            <div class="flex items-center gap-4">
              <img src="${escapeHtml(imagenSrc)}" alt="${escapeHtml(p.nombre)}" 
                   class="product-thumb" onerror="this.src='/static/images/default-product.jpg'"/>
              <div>
                <div class="font-medium">${escapeHtml(p.nombre)}</div>
                <div class="text-sm text-gray-500">${escapeHtml(p.descripcion || '')}</div>
              </div>
            </div>
          </td>
          <td class="py-4 px-6">${escapeHtml(p.sku || 'N/A')}</td>
          <td class="py-4 px-6">${escapeHtml(categoriaNombre)}</td>
          <td class="py-4 px-6 text-center ${p.stock === 0 ? 'text-red-600 font-semibold' : ''}">${p.stock}</td>
          <td class="py-4 px-6 text-right">$${Number(p.precio).toFixed(2)}</td>
          <td class="py-4 px-6 text-center">
            ${p.activo ? '<span class="badge-visible"><span></span>Visible</span>' : '<span class="badge-hidden"><span></span>Oculto</span>'}
            <div style="margin-top:8px;">
              <button class="action edit-btn" data-id="${p.id}" title="Editar">
                <span class="material-symbols-outlined">edit</span>
              </button>
              ${p.activo ?
            `<button class="action delete-btn" data-id="${p.id}" title="Desactivar">
                  <span class="material-symbols-outlined text-red-600">block</span>
                </button>` :
            `<button class="action activate-btn" data-id="${p.id}" title="Activar">
                  <span class="material-symbols-outlined text-green-600">check_circle</span>
                </button>`
          }
            </div>
          </td>
        `;
        productBody.appendChild(tr);
      });
    }

    // Actualizar información de paginación
    actualizarInfoPaginacion(productosPagina.length, totalProductos);
    renderizarPaginacion(totalPaginas);
  }

  // Actualizar información de paginación
  function actualizarInfoPaginacion(mostrando, total) {
    const infoPaginacion = document.getElementById('infoPaginacion');
    if (infoPaginacion) {
      infoPaginacion.textContent = `Mostrando ${mostrando} de ${total} productos`;
    }
  }

  // Renderizar controles de paginación
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
        aplicarFiltrosYRenderizar();
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
        aplicarFiltrosYRenderizar();
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
        aplicarFiltrosYRenderizar();
      }
    });
    paginacionContainer.appendChild(btnSiguiente);
  }

  function getCategoriaNombre(categoriaID) {
    const categoria = categorias.find(c => c.id === categoriaID);
    return categoria ? categoria.nombre : 'Sin categoría';
  }

  function escapeHtml(s) {
    return (s || "").toString().replace(/[&<>"']/g, m =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  }

  // Función para activar producto
  async function activarProducto(id) {
    if (!confirm("¿Estás seguro de que quieres activar este producto?")) return;

    try {
      await apiCall(`/productos/${id}/habilitar`, {
        method: 'PATCH'
      });

      await cargarProductos();
      if (modal.getAttribute("aria-hidden") === "false") closeModal();
    } catch (error) {
      console.error('Error activando producto:', error);
      alert('Error al activar el producto: ' + error.message);
    }
  }

  // Función para eliminar/desactivar producto
  async function eliminarProducto(id) {
    if (!confirm("¿Estás seguro de que quieres desactivar este producto?")) return;

    try {
      await apiCall(`/productos/${id}/deshabilitar`, {
        method: 'DELETE'
      });

      await cargarProductos();
      if (modal.getAttribute("aria-hidden") === "false") closeModal();
    } catch (error) {
      console.error('Error eliminando producto:', error);
      alert('Error al desactivar el producto: ' + error.message);
    }
  }

  // Mostrar sugerencias de categorías
  function mostrarSugerenciasCategorias(texto) {
    const sugerencias = document.getElementById('sugerencias-categorias');
    if (sugerencias) {
      sugerencias.remove();
    }

    if (!texto || texto.length < 1) return;

    const categoriasCoincidentes = categorias.filter(cat =>
      cat.nombre.toLowerCase().includes(texto.toLowerCase())
    );

    if (categoriasCoincidentes.length === 0) return;

    const sugerenciasDiv = document.createElement('div');
    sugerenciasDiv.id = 'sugerencias-categorias';
    sugerenciasDiv.className = 'absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto';

    categoriasCoincidentes.forEach(cat => {
      const div = document.createElement('div');
      div.className = 'px-4 py-2 hover:bg-gray-100 cursor-pointer';
      div.textContent = cat.nombre;
      div.addEventListener('click', () => {
        inputCategory.value = cat.nombre;
        sugerenciasDiv.remove();
      });
      sugerenciasDiv.appendChild(div);
    });

    inputCategory.parentNode.appendChild(sugerenciasDiv);
  }

  // Función para guardar producto (crear o actualizar)
  async function guardarProducto() {
    const id = inputId.value ? parseInt(inputId.value) : null;

    // Validar categoría - BUSCAR POR NOMBRE EXACTO
    const nombreCategoria = inputCategory.value.trim();
    if (!nombreCategoria) {
      alert("La categoría es obligatoria.");
      inputCategory.focus();
      return;
    }

    try {
      // Buscar categoría por nombre exacto en la API
      console.log("🔍 Buscando categoría:", nombreCategoria);
      const todasCategorias = await apiCall('/categorias/todas');
      const categoriaEncontrada = todasCategorias.find(cat =>
        cat.nombre.toLowerCase().trim() === nombreCategoria.toLowerCase().trim()
      );

      if (!categoriaEncontrada) {
        alert(`❌ La categoría "${nombreCategoria}" no existe. Por favor, ingrese una categoría válida.`);
        inputCategory.focus();
        return;
      }

      const categoriaID = categoriaEncontrada.id;
      console.log("✅ Categoría encontrada:", categoriaEncontrada);

      const formData = new FormData();

      // Agregar campos al FormData
      formData.append('nombre', inputName.value.trim());
      formData.append('sku', inputSku.value.trim());
      formData.append('categoriaID', categoriaID);
      formData.append('stock', parseInt(inputStock.value) || 0);
      formData.append('precio', parseFloat(inputPrice.value) || 0);
      formData.append('descripcion', inputDescription.value.trim());
      formData.append('activo', inputVisible.checked);

      // Agregar imagen si hay una nueva
      const imageFile = inputImage.files[0];
      if (imageFile) {
        formData.append('imagen', imageFile);
      }

      if (id) {
        // Actualizar producto existente
        await apiCall(`/productos/${id}`, {
          method: 'PATCH',
          body: formData
        });
      } else {
        // Crear nuevo producto
        await apiCall('/productos/crear', {
          method: 'POST',
          body: formData
        });
      }

      closeModal();
      await cargarProductos();
    } catch (error) {
      console.error('Error guardando producto:', error);
      alert('Error al guardar el producto: ' + error.message);
    }
  }

  // Función para abrir modal
  function openModal(product) {
    if (!modal) return;
    modal.setAttribute("aria-hidden", "false");

    // Resetear preview de imagen
    imagePreview.classList.add('hidden');
    inputImage.value = '';

    // Remover sugerencias anteriores
    const sugerencias = document.getElementById('sugerencias-categorias');
    if (sugerencias) {
      sugerencias.remove();
    }

    if (!product) {
      // Modo crear
      inputId.value = "";
      inputName.value = "";
      inputSku.value = "";
      inputCategory.value = "";
      inputStock.value = 0;
      inputPrice.value = "";
      inputDescription.value = "";
      inputVisible.checked = true;
      btnDelete.style.display = "none";
      document.getElementById("modal-title").textContent = "Añadir Producto";
    } else {
      // Modo editar
      inputId.value = product.id;
      inputName.value = product.nombre;
      inputSku.value = product.sku;
      inputCategory.value = getCategoriaNombre(product.categoriaID);
      inputStock.value = product.stock;
      inputPrice.value = product.precio;
      inputDescription.value = product.descripcion || "";
      inputVisible.checked = product.activo;
      btnDelete.style.display = "";
      document.getElementById("modal-title").textContent = "Editar Producto";

      // Mostrar imagen actual si existe
      if (product.imagenURL) {
        previewImg.src = product.imagenURL;
        imagePreview.classList.remove('hidden');
      }
    }
  }

  // Función para cerrar modal
  function closeModal() {
    if (!modal) return;
    modal.setAttribute("aria-hidden", "true");

    // Remover sugerencias al cerrar
    const sugerencias = document.getElementById('sugerencias-categorias');
    if (sugerencias) {
      sugerencias.remove();
    }

    form.reset();
  }

  // Función para mostrar error
  function showError(message) {
    if (!productBody) return;

    productBody.innerHTML = `
      <tr>
        <td colspan="6" class="py-12 px-6 text-center">
          <div class="flex flex-col items-center justify-center text-red-600">
            <span class="material-symbols-outlined text-4xl mb-2">error</span>
            <p class="text-lg font-medium mb-2">Error de conexión</p>
            <p class="text-sm text-gray-600 max-w-md">${message}</p>
            <button onclick="cargarProductos()" class="mt-4 px-4 py-2 bg-[#aa8744] text-white rounded-lg hover:bg-[#9c642d] transition-colors">
              Reintentar
            </button>
          </div>
        </td>
      </tr>`;
  }

  // Adjuntar eventos
  function attachEvents() {
    let t;
    searchInput && searchInput.addEventListener("input", (e) => {
      clearTimeout(t);
      t = setTimeout(() => {
        paginaActual = 1;
        aplicarFiltrosYRenderizar();
      }, 180);
    });

    // Filtro de estado
    filtroEstadoSelect && filtroEstadoSelect.addEventListener("change", (e) => {
      filtroEstado = e.target.value;
      paginaActual = 1;
      aplicarFiltrosYRenderizar();
    });

    btnAdd && btnAdd.addEventListener("click", () => openModal());

    productBody && productBody.addEventListener("click", (ev) => {
      const editBtn = ev.target.closest(".edit-btn");
      const delBtn = ev.target.closest(".delete-btn");
      const activateBtn = ev.target.closest(".activate-btn");

      if (editBtn) {
        const id = parseInt(editBtn.dataset.id);
        const prod = productos.find(x => x.id === id);
        if (prod) openModal(prod);
      } else if (delBtn) {
        const id = parseInt(delBtn.dataset.id);
        eliminarProducto(id);
      } else if (activateBtn) {
        const id = parseInt(activateBtn.dataset.id);
        activarProducto(id);
      }
    });

    btnCancel && btnCancel.addEventListener("click", closeModal);

    btnDelete && btnDelete.addEventListener("click", () => {
      const id = parseInt(inputId.value);
      if (!id) return;
      eliminarProducto(id);
    });

    // Preview de imagen
    inputImage && inputImage.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          previewImg.src = e.target.result;
          imagePreview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
      }
    });

    form && form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      await guardarProducto();
    });

    // Mostrar sugerencias de categorías al escribir
    inputCategory && inputCategory.addEventListener("input", function (e) {
      mostrarSugerenciasCategorias(e.target.value);
    });

    window.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape" && modal && modal.getAttribute("aria-hidden") === "false") closeModal();
    });
  }

  // Inicializar la aplicación
  async function init() {
    console.log("🚀 Inicializando gestión de productos...");
    inicializarPaginacion();
    await cargarCategorias();
    await cargarProductos();
    attachEvents();
  }

  // Hacer funciones globales para reintentos
  window.cargarProductos = cargarProductos;
  window.cargarCategorias = cargarCategorias;

  init();
})();