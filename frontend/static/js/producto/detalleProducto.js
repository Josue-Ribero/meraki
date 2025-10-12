document.querySelectorAll('.thumb').forEach(thumb => {
  thumb.addEventListener('click', () => {
    const newSrc = thumb.dataset.src;
    document.getElementById('mainImage').src = newSrc;
    document.querySelectorAll('.thumb').forEach(t => t.classList.remove('activo'));
    thumb.classList.add('activo');
  });
});

const qtyEl = document.getElementById('qty');
const btnDec = document.getElementById('btnDec');
const btnInc = document.getElementById('btnInc');
let qty = 1;

btnDec.addEventListener('click', () => {
  if (qty > 1) { qty--; qtyEl.textContent = qty; }
});
btnInc.addEventListener('click', () => {
  qty++; qtyEl.textContent = qty;
});

document.getElementById('addToCart').addEventListener('click', () => {
  location.reload();
});