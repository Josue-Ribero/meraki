const canvas = document.getElementById('designCanvas');
const ctx = canvas.getContext('2d');
const pixelSize = 16;
const gridSize = 32;
canvas.width = canvas.height = pixelSize * gridSize;

let isDrawing = false;
let selectedColor = '#aa8744';
let selectedShape = 'circle';
let currentMaterial = 'metal';
let useShape = false;

const palettes = {
  metal: ['#aa8744', '#363636', '#fdfbf3', '#d1bc97', '#9c642d'],
  pearls: ['#f8f8f8', '#e2e2e2', '#ffffff', '#dcdcdc', '#b0b0b0'],
  gems: ['#ff4d4d', '#4dff4d', '#4d4dff', '#ffff4d', '#ff4dff']
};

function drawGrid() {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#f0f0f0';
  for (let i = 0; i <= gridSize; i++) {
    ctx.beginPath();
    ctx.moveTo(i * pixelSize, 0);
    ctx.lineTo(i * pixelSize, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * pixelSize);
    ctx.lineTo(canvas.width, i * pixelSize);
    ctx.stroke();
  }
}
drawGrid();

function drawPixel(x, y) {
  const gx = Math.floor(x / pixelSize);
  const gy = Math.floor(y / pixelSize);
  if (gx >= 0 && gy >= 0 && gx < gridSize && gy < gridSize) {
    ctx.fillStyle = selectedColor;
    ctx.fillRect(gx * pixelSize, gy * pixelSize, pixelSize, pixelSize);
  }
}

function drawShape(x, y) {
  const gx = Math.floor(x / pixelSize);
  const gy = Math.floor(y / pixelSize);
  const radius = 3;
  ctx.fillStyle = selectedColor;

  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = -radius; dy <= radius; dy++) {
      const px = gx + dx;
      const py = gy + dy;
      if (px < 0 || py < 0 || px >= gridSize || py >= gridSize) continue;

      let draw = false;
      if (selectedShape === 'circle' && dx * dx + dy * dy <= radius * radius) draw = true;
      if (selectedShape === 'square' && Math.abs(dx) <= radius && Math.abs(dy) <= radius) draw = true;
      if (selectedShape === 'pentagon') {
        const angle = Math.atan2(dy, dx);
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angleStep = (Math.PI * 2) / 5;
        const alignedAngle = angle + angleStep / 2;
        const sector = Math.floor(alignedAngle / angleStep);
        const sectorAngle = sector * angleStep;
        const x1 = Math.cos(sectorAngle) * radius;
        const y1 = Math.sin(sectorAngle) * radius;
        const x2 = Math.cos(sectorAngle + angleStep) * radius;
        const y2 = Math.sin(sectorAngle + angleStep) * radius;
        const cross = (dx - x1) * (y2 - y1) - (dy - y1) * (x2 - x1);
        if (cross <= 0 && dist <= radius) draw = true;
      }

      if (draw) {
        ctx.fillRect(px * pixelSize, py * pixelSize, pixelSize, pixelSize);
      }
    }
  }
}

canvas.addEventListener('mousedown', (e) => {
  isDrawing = true;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  if (useShape) drawShape(x, y);
  else drawPixel(x, y);
});
canvas.addEventListener('mousemove', (e) => {
  if (!isDrawing) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  if (useShape) drawShape(x, y);
  else drawPixel(x, y);
});
canvas.addEventListener('mouseup', () => isDrawing = false);
canvas.addEventListener('mouseleave', () => isDrawing = false);

document.querySelectorAll('.shape-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    selectedShape = btn.dataset.shape;
    document.querySelectorAll('.shape-btn').forEach(b => b.classList.remove('ring-2', 'ring-[var(--color-primary)]'));
    btn.classList.add('ring-2', 'ring-[var(--color-primary)]');
  });
});

document.getElementById('shapeToggle').addEventListener('change', (e) => {
  useShape = e.target.checked;
});

function updatePalette() {
  currentMaterial = document.querySelector('.material-radio:checked').value;
  const palette = palettes[currentMaterial];
  const paletteContainer = document.getElementById('colorPalette');
  paletteContainer.innerHTML = '';
  palette.forEach((color, index) => {
    const btn = document.createElement('button');
    btn.className = 'color-btn w-10 h-10 rounded-full border-2 border-transparent focus:border-[var(--color-primary)]';
    btn.style.backgroundColor = color;
    if (index === 0) {
      btn.classList.add('ring-2', 'ring-offset-2');
      selectedColor = color;
    }
    btn.addEventListener('click', () => {
      selectedColor = color;
      document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('ring-2', 'ring-offset-2'));
      btn.classList.add('ring-2', 'ring-offset-2');
    });
    paletteContainer.appendChild(btn);
  });
  document.getElementById('selectedMaterial').textContent = currentMaterial === 'metal' ? 'Metal' : currentMaterial === 'pearls' ? 'Perlas' : 'Gemas';
}

document.querySelectorAll('.material-radio').forEach(radio => {
  radio.addEventListener('change', updatePalette);
});

document.getElementById('clearBtn').addEventListener('click', drawGrid);

document.getElementById('saveBtn').addEventListener('click', () => {
  const dataURL = canvas.toDataURL();
  document.getElementById('previewImg').style.backgroundImage = `url(${dataURL})`;

  const link = document.createElement('a');
  link.download = 'mi-joya.png';
  link.href = dataURL;
  link.click();
});