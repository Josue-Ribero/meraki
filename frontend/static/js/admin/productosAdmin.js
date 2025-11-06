// productosAdmin.js - VERSIÓN CON MÁS LOGS DE DEPURACIÓN
(() => {
  const API_BASE = "";
  let productos = [];
  let categorias = [];

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
  const inputDescription = document.getElementById("product-description");
  const inputImage = document.getElementById("product-image");
  const inputVisible = document.getElementById("product-visible");
  const btnCancel = document.getElementById("modal-cancel");
  const btnDelete = document.getElementById("modal-delete");
  const imagePreview = document.getElementById("image-preview");
  const previewImg = document.getElementById("preview-img");

  // Función para hacer requests a la API
  async function apiCall(endpoint, options = {}) {
    try {
      console.log(`📡 Haciendo request a: ${API_BASE}${endpoint}`, options);

      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Accept': 'application/json',
          ...options.headers,
        },
        credentials: 'include',
        ...options
      });

      console.log(`📡 Respuesta recibida: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`Error ${response.status}: ${response.statusText} - ${errorText}`);
      }

      if (response.status === 204) {
        return null;
      }

      const data = await response.json();
      console.log('📦 Datos recibidos:', data);
      return data;

    } catch (error) {
      console.error('❌ API call failed:', error);
      throw error;
    }
  }

  // Cargar productos desde la API
  async function cargarProductos() {
    try {
      console.log("🔄 Cargando productos desde la API...");
      productos = await apiCall('/productos/');
      console.log("✅ Productos cargados:", productos.length, "productos");
      renderTable();
    } catch (error) {
      console.error('Error cargando productos:', error);
      showError('Error al cargar los productos: ' + error.message);
    }
  }

  // Cargar categorías desde la API
  async function cargarCategorias() {
    try {
      console.log("🔄 Cargando categorías desde la API...");
      // Cargar todas las categorías para validación
      categorias = await apiCall('/categorias/todas');
      console.log("✅ Categorías cargadas:", categorias);
    } catch (error) {
      console.error('Error cargando categorías:', error);
      // Si no hay endpoint de categorías, usar categorías hardcodeadas temporalmente
      categorias = [
        { id: 1, nombre: "Collares" },
        { id: 2, nombre: "Aretes" },
        { id: 3, nombre: "Pulseras" },
        { id: 4, nombre: "Anillos" }
      ];
    }
  }

  // Buscar categoría por nombre exacto
  function buscarCategoriaPorNombre(nombre) {
    const categoria = categorias.find(cat =>
      cat.nombre.toLowerCase().trim() === nombre.toLowerCase().trim()
    );
    console.log(`🔍 Buscando categoría "${nombre}":`, categoria ? 'Encontrada' : 'No encontrada');
    return categoria;
  }

  // Validar que la categoría exista
  function validarCategoria(nombreCategoria) {
    const categoria = buscarCategoriaPorNombre(nombreCategoria);
    if (!categoria) {
      const categoriasDisponibles = categorias.map(c => c.nombre).join(', ');
      console.log(`❌ Categoría "${nombreCategoria}" no encontrada. Disponibles: ${categoriasDisponibles}`);
      return {
        valida: false,
        mensaje: `La categoría "${nombreCategoria}" no existe. Categorías disponibles: ${categoriasDisponibles}`
      };
    }
    console.log(`✅ Categoría válida: ${categoria.nombre} (ID: ${categoria.id})`);
    return {
      valida: true,
      categoria: categoria
    };
  }

  function renderTable(filter = "") {
    if (!productBody) return;

    const q = filter.toLowerCase().trim();
    const filtered = productos.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (getCategoriaNombre(p.categoriaID) || "").toLowerCase().includes(q)
    );

    console.log(`🎨 Renderizando tabla: ${filtered.length} productos (filtro: "${q}")`);

    productBody.innerHTML = "";

    if (filtered.length === 0) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td colspan="6" class="py-8 text-center text-gray-500">
          No se encontraron productos
        </td>
      `;
      productBody.appendChild(tr);
      return;
    }

    filtered.forEach(p => {
      const tr = document.createElement("tr");
      const imagenSrc = p.imagenURL || '/static/images/default-product.jpg';
      const categoriaNombre = getCategoriaNombre(p.categoriaID);

      console.log(`🖼️ Imagen del producto ${p.nombre}:`, p.imagenURL);

      tr.innerHTML = `
        <td class="py-4 px-6">
          <div class="flex items-center gap-4">
            <img src="${escapeHtml(imagenSrc)}" alt="${escapeHtml(p.nombre)}" 
                 class="product-thumb" onerror="console.error('❌ Error cargando imagen:', this.src); this.src='/static/images/default-product.jpg'"/>
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
            <button class="action delete-btn" data-id="${p.id}" title="Eliminar">
              <span class="material-symbols-outlined text-red-600">delete</span>
            </button>
          </div>
        </td>
      `;
      productBody.appendChild(tr);
    });
  }

  function getCategoriaNombre(categoriaID) {
    const categoria = categorias.find(c => c.id === categoriaID);
    return categoria ? categoria.nombre : 'Sin categoría';
  }

  function escapeHtml(s) {
    return (s || "").toString().replace(/[&<>"']/g, m =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  }

  function attachEvents() {
    let t;
    searchInput && searchInput.addEventListener("input", (e) => {
      clearTimeout(t);
      t = setTimeout(() => renderTable(e.target.value), 180);
    });

    btnAdd && btnAdd.addEventListener("click", () => openModal());

    productBody && productBody.addEventListener("click", (ev) => {
      const editBtn = ev.target.closest(".edit-btn");
      const delBtn = ev.target.closest(".delete-btn");

      if (editBtn) {
        const id = parseInt(editBtn.dataset.id);
        const prod = productos.find(x => x.id === id);
        if (prod) openModal(prod);
      } else if (delBtn) {
        const id = parseInt(delBtn.dataset.id);
        eliminarProducto(id);
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
        console.log("📸 Imagen seleccionada:", file.name, file.size, "bytes");
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
      console.log("📤 Enviando formulario...");
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

  // Mostrar sugerencias de categorías
  function mostrarSugerenciasCategorias(texto) {
    // Remover sugerencias anteriores
    const sugerencias = document.getElementById('sugerencias-categorias');
    if (sugerencias) {
      sugerencias.remove();
    }

    if (!texto || texto.length < 1) return;

    const textoNormalizado = texto.toLowerCase().trim();
    const categoriasCoincidentes = categorias.filter(cat =>
      cat.nombre.toLowerCase().includes(textoNormalizado)
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

  async function eliminarProducto(id) {
    if (!confirm("¿Estás seguro de que quieres eliminar este producto?")) return;

    try {
      console.log(`🗑️ Eliminando producto ID: ${id}`);
      await apiCall(`/productos/${id}/deshabilitar`, {
        method: 'DELETE'
      });

      await cargarProductos(); // Recargar la lista
      if (modal.getAttribute("aria-hidden") === "false") closeModal();
    } catch (error) {
      console.error('Error eliminando producto:', error);
      alert('Error al eliminar el producto: ' + error.message);
    }
  }

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
      await cargarProductos(); // Recargar la lista
    } catch (error) {
      console.error('Error guardando producto:', error);
      alert('Error al guardar el producto: ' + error.message);
    }
  }

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
      console.log("➕ Abriendo modal para crear producto");
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
      console.log("✏️ Abriendo modal para editar producto:", product);
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
        console.log("🖼️ Mostrando imagen existente:", product.imagenURL);
        previewImg.src = product.imagenURL;
        imagePreview.classList.remove('hidden');
      }
    }
  }

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

  // Validar categoría en tiempo real
  function validarCategoriaEnTiempoReal() {
    const nombreCategoria = inputCategory.value.trim();
    if (nombreCategoria) {
      const categoriaEncontrada = categorias.find(cat =>
        cat.nombre.toLowerCase().trim() === nombreCategoria.toLowerCase().trim()
      );

      if (categoriaEncontrada) {
        inputCategory.style.borderColor = '#10b981'; // Verde
      } else {
        inputCategory.style.borderColor = '#ef4444'; // Rojo
      }
    } else {
      inputCategory.style.borderColor = '#d1bc97'; // Color original
    }
  }

  // Agregar el event listener en la función attachEvents()
  inputCategory.addEventListener('input', validarCategoriaEnTiempoReal);

  async function init() {
    console.log("🚀 Inicializando gestión de productos...");
    await cargarCategorias();
    await cargarProductos();
    attachEvents();
    console.log("✅ Gestión de productos inicializada correctamente");
  }

  // Hacer funciones globales para reintentos
  window.cargarProductos = cargarProductos;
  window.cargarCategorias = cargarCategorias;

  init();
})();