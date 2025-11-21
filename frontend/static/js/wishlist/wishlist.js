document.addEventListener('DOMContentLoaded', async () => {
  const galeria = document.getElementById('galeria');

  function renderEmpty() {
    galeria.innerHTML = `
      <div class="text-center col-span-full">
        <p>No tienes productos en tu wishlist.</p>
        <a href="/" class="btn-primario" style="display:inline-block;margin-top:12px;">Seguir comprando</a>
      </div>
    `;
  }

  try {
    // show loading state
    galeria.innerHTML = `<div class="text-center col-span-full" id="wishlist-loading"><p class="texto-cargando" style="font-weight:600;">Cargando tu wishlist...</p></div>`;
    const resp = await fetch('/wishlist/mi-wishlist', { credentials: 'same-origin' });
    if (resp.status === 401 || resp.status === 403) {
      window.location.href = '/ingresar';
      return;
    }

    if (resp.status === 404) {
      renderEmpty();
      return;
    }

    if (!resp.ok) {
      // Try fallback to localStorage
      console.warn('No se pudo cargar wishlist desde servidor, usando localStorage');
      const local = localStorage.getItem('wishlist');
      if (!local) { renderEmpty(); return; }
      const ids = JSON.parse(local);
      if (!Array.isArray(ids) || ids.length === 0) { renderEmpty(); return; }
      await renderFromIds(ids);
      return;
    }

    const items = await resp.json();
    if (!items || items.length === 0) {
      renderEmpty();
      return;
    }

    const ids = items.map(i => i.productoID);
    await renderFromIds(ids);
  } catch (err) {
    console.error('Error cargando wishlist:', err);
    renderEmpty();
  }

  async function renderFromIds(ids) {
    // Fetch category list so we can show category names like on principal
    const categoriasResp = await fetch('/categorias/');
    let categoriasMap = {};
    if (categoriasResp.ok) {
      const categorias = await categoriasResp.json();
      categorias.forEach(c => { categoriasMap[c.id] = c.nombre; });
    }

    // Fetch product details in parallel
    const fetches = ids.map(id => fetch(`/productos/${id}`));
    const responses = await Promise.all(fetches);
    const products = [];
    for (let i = 0; i < responses.length; i++) {
      const r = responses[i];
      if (r.ok) {
        const p = await r.json();
        products.push(p);
      }
    }

    if (products.length === 0) { renderEmpty(); return; }

    // Helper to format price like principal
    function formatearPrecio(precio) {
      if (precio === null || precio === undefined) return '0';
      const precioString = Math.floor(Number(precio)).toString();
      return precioString.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    galeria.innerHTML = products.map(p => (`
      <div class="group relative flex flex-col overflow-hidden rounded-xl shadow-md hover:shadow-2xl transition-shadow duration-300 bg-white border border-color-borde-input/50">
        <div class="aspect-square w-full overflow-hidden">
          <img alt="${p.nombre}" class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300" src="${p.imagenURL || '/static/img/placeholder.jpg'}" onerror="this.src='/static/img/placeholder.jpg'" />
        </div>
        <div class="p-4 flex flex-col flex-grow">
          <a href="/producto/${p.id}">
            <h3 class="text-base font-semibold text-color-texto-oscuro">${p.nombre}</h3>
            <p class="text-sm text-gray-500">${categoriasMap[p.categoriaID] || ''}</p>
          </a>
          <div class="flex items-center justify-between mt-4">
            <p class="text-xl font-bold text-color-secundario">$${formatearPrecio(p.precio)}</p>
            <div class="flex items-center gap-2">
              <button class="p-2.5 rounded-full bg-color-principal text-color-blanco hover:bg-color-principal-oscuro transition-colors btn-mover-carrito" data-id="${p.id}">
                <span class="material-symbols-outlined text-xl">add_shopping_cart</span>
              </button>
              <button class="btn-eliminar" data-id="${p.id}" title="Eliminar">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `)).join('');

    // Attach handlers
    document.querySelectorAll('.btn-eliminar').forEach(boton => {
      boton.addEventListener('click', async (e) => {
        const id = boton.getAttribute('data-id');
        try {
          const resp = await fetch(`/wishlist/${id}`, { method: 'DELETE', credentials: 'same-origin' });
          if (resp.status === 204) {
            const tarjeta = boton.closest('.tarjeta');
            tarjeta.style.transition = 'opacity 0.3s';
            tarjeta.style.opacity = '0';
            setTimeout(() => tarjeta.remove(), 300);
            // Also remove from localStorage fallback
            const local = getLocalWishlist();
            if (local) {
              const filtered = local.filter(i => String(i) !== String(id));
              localStorage.setItem('wishlist', JSON.stringify(filtered));
            }
            return;
          }
          if (resp.status === 401 || resp.status === 403) { window.location.href = '/ingresar'; return; }
          const err = await resp.json().catch(() => ({}));
          alert(err.detail || 'No se pudo eliminar de la wishlist');
        } catch (err) {
          console.error('Error eliminando wishlist:', err);
          // Fallback local
          const tarjeta = boton.closest('.tarjeta');
          tarjeta.style.transition = 'opacity 0.3s';
          tarjeta.style.opacity = '0';
          setTimeout(() => tarjeta.remove(), 300);
          const local = getLocalWishlist() || [];
          const filtered = local.filter(i => String(i) !== String(id));
          localStorage.setItem('wishlist', JSON.stringify(filtered));
        }
      });
    });

    document.querySelectorAll('.btn-mover-carrito').forEach(boton => {
      boton.addEventListener('click', async (e) => {
        const id = boton.getAttribute('data-id');
        boton.disabled = true;
        boton.textContent = 'Enviando...';
        try {
          const resp = await fetch(`/wishlist/mover-al-carrito/${id}`, { method: 'POST', credentials: 'same-origin' });
          if (resp.ok) {
            // Remove card from DOM
            const tarjeta = boton.closest('.tarjeta');
            tarjeta.style.transition = 'opacity 0.3s';
            tarjeta.style.opacity = '0';
            setTimeout(() => tarjeta.remove(), 300);
            // Also update localStorage fallback
            const local = getLocalWishlist() || [];
            const filtered = local.filter(i => String(i) !== String(id));
            localStorage.setItem('wishlist', JSON.stringify(filtered));
            return;
          }
          if (resp.status === 401 || resp.status === 403) { window.location.href = '/ingresar'; return; }
          const err = await resp.json().catch(() => ({}));
          alert(err.detail || 'No se pudo mover al carrito');
        } catch (err) {
          console.error('Error moviendo al carrito:', err);
          // Try fallback: add to carrito endpoint directly (may create carrito)
          try {
            const form = new FormData();
            form.append('productoID', id);
            form.append('cantidad', '1');
            const r2 = await fetch('/carrito/agregar-producto', { method: 'POST', body: form, credentials: 'same-origin' });
            if (r2.ok) {
              const tarjeta = boton.closest('.tarjeta');
              tarjeta.style.transition = 'opacity 0.3s';
              tarjeta.style.opacity = '0';
              setTimeout(() => tarjeta.remove(), 300);
              const local = getLocalWishlist() || [];
              const filtered = local.filter(i => String(i) !== String(id));
              localStorage.setItem('wishlist', JSON.stringify(filtered));
              return;
            }
            const ebody = await r2.json().catch(() => ({}));
            alert(ebody.detail || 'No se pudo agregar al carrito (fallback)');
          } catch (err2) {
            console.error('Fallback agregar al carrito falló:', err2);
            alert('Error de red. Intenta nuevamente.');
          }
        } finally {
          try { boton.disabled = false; boton.textContent = 'Añadir al carrito'; } catch(e){}
        }
      });
    });
  }

  function getLocalWishlist() {
    try { return JSON.parse(localStorage.getItem('wishlist') || '[]'); } catch(e) { return []; }
  }
});