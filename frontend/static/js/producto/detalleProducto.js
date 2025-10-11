// Cambio de imagen al hacer clic en miniaturas
document.querySelectorAll('.thumb').forEach(thumb => {
  thumb.addEventListener('click', () => {
    const newSrc = thumb.dataset.src;
    document.getElementById('mainImage').src = newSrc;

    // resaltar thumb activa
    document.querySelectorAll('.thumb').forEach(t => t.classList.remove('activo'));
    thumb.classList.add('activo');
  });
});

// Contador de cantidad
const qtyEl   = document.getElementById('qty');
const btnDec  = document.getElementById('btnDec');
const btnInc  = document.getElementById('btnInc');
let qty = 1;

btnDec.addEventListener('click', () => {
  if (qty > 1) { qty--; qtyEl.textContent = qty; }
});
btnInc.addEventListener('click', () => {
  qty++; qtyEl.textContent = qty;
});

// Añadir al carrito (placeholder)
document.getElementById('addToCart').addEventListener('click', () => {
  alert(`Se añadieron ${qty} producto(s) al carrito.`);
});