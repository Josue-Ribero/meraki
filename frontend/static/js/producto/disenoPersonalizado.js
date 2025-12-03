// Elementos del canvas
const canvas = document.getElementById('designCanvas');
const previewCanvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');
const previewCtx = previewCanvas.getContext('2d');
const pixelSize = 16;
const gridSize = 32;
canvas.width = canvas.height = pixelSize * gridSize;
previewCanvas.width = previewCanvas.height = 200;

// Variables
let isDrawing = false;
let selectedColor = '#aa8744';
let selectedShape = 'circle';
let currentMaterial = 'metal';
let useShape = false;
let currentMode = 'draw';
let gridData = [];

// Paletas de colores
const palettes = {
  metal: ['#aa8744', '#363636', '#fdfbf3', '#d1bc97', '#9c642d'],
  pearls: ['#f8f8f8', '#e2e2e2', '#ffffff', '#dcdcdc', '#b0b0b0'],
  gems: ['#ff4d4d', '#4dff4d', '#4d4dff', '#ffff4d', '#ff4dff']
};

// Precios por material
const materialPrices = {
  metal: 12000,
  pearls: 15000,
  gems: 10000
};

// Funciones iniciales
function init() {
  initializeGridData();
  drawInitialGrid();
  setupColorPalette();
  setupEventListeners();
  updatePreview();
  updatePrice();
}

function initializeGridData() {
  gridData = [];
  for (let i = 0; i < gridSize; i++) {
    gridData[i] = [];
    for (let j = 0; j < gridSize; j++) {
      gridData[i][j] = '#ffffff';
    }
  }
}

function drawInitialGrid() {
  // Limpiar canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Dibujar líneas de cuadrícula
  drawGridLines();
}

function drawGridLines() {
  ctx.strokeStyle = '#f0f0f0';
  ctx.lineWidth = 1;

  // Líneas verticales
  for (let i = 0; i <= gridSize; i++) {
    ctx.beginPath();
    ctx.moveTo(i * pixelSize, 0);
    ctx.lineTo(i * pixelSize, canvas.height);
    ctx.stroke();
  }

  // Líneas horizontales
  for (let i = 0; i <= gridSize; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * pixelSize);
    ctx.lineTo(canvas.width, i * pixelSize);
    ctx.stroke();
  }
}

function updatePreview() {
  previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  previewCtx.drawImage(canvas, 0, 0, previewCanvas.width, previewCanvas.height);
}

function setupColorPalette() {
  const paletteContainer = document.getElementById('colorPalette');
  const palette = palettes[currentMaterial];

  paletteContainer.innerHTML = '';
  palette.forEach((color, index) => {
    const btn = document.createElement('button');
    btn.className = 'color-btn w-10 h-10 rounded-full border-2 border-transparent focus:border-[var(--color-primary)] hover:scale-105 transition-transform';
    btn.style.backgroundColor = color;
    btn.setAttribute('data-color', color);

    if (index === 0) {
      btn.classList.add('ring-2', 'ring-offset-2', 'ring-[var(--color-primary)]');
      selectedColor = color;
    }

    btn.addEventListener('click', () => {
      selectedColor = color;
      document.querySelectorAll('.color-btn').forEach(b => {
        b.classList.remove('ring-2', 'ring-offset-2', 'ring-[var(--color-primary)]');
      });
      btn.classList.add('ring-2', 'ring-offset-2', 'ring-[var(--color-primary)]');
    });

    paletteContainer.appendChild(btn);
  });
}

function updatePrice() {
  const basePrice = materialPrices[currentMaterial];
  const formattedPrice = basePrice.toLocaleString('es-CO');
  document.getElementById('totalPrice').textContent = `$${formattedPrice}`;
}

// Funciones de dibujo corregidas
function drawPixel(x, y) {
  const gx = Math.floor(x / pixelSize);
  const gy = Math.floor(y / pixelSize);

  if (gx >= 0 && gy >= 0 && gx < gridSize && gy < gridSize) {
    const color = currentMode === 'erase' ? '#ffffff' : selectedColor;
    gridData[gx][gy] = color;

    // Dibujar el píxel
    ctx.fillStyle = color;
    ctx.fillRect(gx * pixelSize, gy * pixelSize, pixelSize, pixelSize);

    // Redibujar las líneas de la cuadrícula para esta celda
    redrawCellGridLines(gx, gy);

    updatePreview();
  }
}

function redrawCellGridLines(gx, gy) {
  ctx.strokeStyle = '#f0f0f0';
  ctx.lineWidth = 1;

  // Redibujar todas las líneas alrededor de la celda
  // Línea superior
  ctx.beginPath();
  ctx.moveTo(gx * pixelSize, gy * pixelSize);
  ctx.lineTo((gx + 1) * pixelSize, gy * pixelSize);
  ctx.stroke();

  // Línea derecha
  ctx.beginPath();
  ctx.moveTo((gx + 1) * pixelSize, gy * pixelSize);
  ctx.lineTo((gx + 1) * pixelSize, (gy + 1) * pixelSize);
  ctx.stroke();

  // Línea inferior
  ctx.beginPath();
  ctx.moveTo(gx * pixelSize, (gy + 1) * pixelSize);
  ctx.lineTo((gx + 1) * pixelSize, (gy + 1) * pixelSize);
  ctx.stroke();

  // Línea izquierda
  ctx.beginPath();
  ctx.moveTo(gx * pixelSize, gy * pixelSize);
  ctx.lineTo(gx * pixelSize, (gy + 1) * pixelSize);
  ctx.stroke();
}

function drawShape(x, y) {
  const gx = Math.floor(x / pixelSize);
  const gy = Math.floor(y / pixelSize);
  const radius = 2;
  const color = currentMode === 'erase' ? '#ffffff' : selectedColor;
  const modifiedCells = [];

  for (let dx = -radius; dx <= radius; dx++) {
    for (let dy = -radius; dy <= radius; dy++) {
      const px = gx + dx;
      const py = gy + dy;

      if (px < 0 || py < 0 || px >= gridSize || py >= gridSize) continue;

      let draw = false;

      if (selectedShape === 'circle') {
        if (dx * dx + dy * dy <= radius * radius) draw = true;
      } else if (selectedShape === 'square') {
        if (Math.abs(dx) <= radius && Math.abs(dy) <= radius) draw = true;
      } else if (selectedShape === 'pentagon') {
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
        gridData[px][py] = color;
        ctx.fillStyle = color;
        ctx.fillRect(px * pixelSize, py * pixelSize, pixelSize, pixelSize);
        modifiedCells.push({ x: px, y: py });
      }
    }
  }

  // Redibujar líneas para todas las celdas modificadas
  modifiedCells.forEach(cell => {
    redrawCellGridLines(cell.x, cell.y);
  });

  updatePreview();
}

// Event listeners
canvas.addEventListener('mousedown', (e) => {
  isDrawing = true;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (useShape) {
    drawShape(x, y);
  } else {
    drawPixel(x, y);
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (!isDrawing) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (useShape) {
    drawShape(x, y);
  } else {
    drawPixel(x, y);
  }
});

canvas.addEventListener('mouseup', () => {
  isDrawing = false;
});

canvas.addEventListener('mouseleave', () => {
  isDrawing = false;
});

// Eventos de modos de dibujo
document.getElementById('drawMode').addEventListener('click', () => {
  currentMode = 'draw';
  document.getElementById('drawMode').classList.add('active', 'bg-[var(--color-primary)]', 'text-white');
  document.getElementById('drawMode').classList.remove('text-gray-600', 'hover:bg-gray-200');
  document.getElementById('eraseMode').classList.remove('active', 'bg-[var(--color-primary)]', 'text-white');
  document.getElementById('eraseMode').classList.add('text-gray-600', 'hover:bg-gray-200');
});

document.getElementById('eraseMode').addEventListener('click', () => {
  currentMode = 'erase';
  document.getElementById('eraseMode').classList.add('active', 'bg-[var(--color-primary)]', 'text-white');
  document.getElementById('eraseMode').classList.remove('text-gray-600', 'hover:bg-gray-200');
  document.getElementById('drawMode').classList.remove('active', 'bg-[var(--color-primary)]', 'text-white');
  document.getElementById('drawMode').classList.add('text-gray-600', 'hover:bg-gray-200');
});

// Eventos de formas
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

// Eventos de materiales
document.querySelectorAll('.material-radio').forEach(radio => {
  radio.addEventListener('change', (e) => {
    currentMaterial = e.target.value;

    // Actualizar texto del material
    let materialText = '';
    switch (currentMaterial) {
      case 'metal': materialText = 'Metal'; break;
      case 'pearls': materialText = 'Perlas'; break;
      case 'gems': materialText = 'Mostacilla'; break;
    }
    document.getElementById('selectedMaterial').textContent = materialText;

    // Actualizar paleta de colores
    const palette = palettes[currentMaterial];
    const paletteContainer = document.getElementById('colorPalette');
    paletteContainer.innerHTML = '';

    palette.forEach((color, index) => {
      const btn = document.createElement('button');
      btn.className = 'color-btn w-10 h-10 rounded-full border-2 border-transparent focus:border-[var(--color-primary)] hover:scale-105 transition-transform';
      btn.style.backgroundColor = color;
      btn.setAttribute('data-color', color);

      if (index === 0) {
        btn.classList.add('ring-2', 'ring-offset-2', 'ring-[var(--color-primary)]');
        selectedColor = color;
      }

      btn.addEventListener('click', () => {
        selectedColor = color;
        document.querySelectorAll('.color-btn').forEach(b => {
          b.classList.remove('ring-2', 'ring-offset-2', 'ring-[var(--color-primary)]');
        });
        btn.classList.add('ring-2', 'ring-offset-2', 'ring-[var(--color-primary)]');
      });

      paletteContainer.appendChild(btn);
    });

    updatePrice();
  });
});

// Botón limpiar
document.getElementById('clearBtn').addEventListener('click', () => {
  if (confirm('¿Estás seguro de que quieres limpiar todo el lienzo?')) {
    initializeGridData();
    drawInitialGrid();
    updatePreview();
  }
});

// Botón guardar diseño
document.getElementById('saveBtn').addEventListener('click', () => {
  const dataURL = canvas.toDataURL();
  const link = document.createElement('a');
  link.download = 'mi-joya.png';
  link.href = dataURL;
  link.click();
});

// Botón añadir al carrito
document.getElementById('addToCartBtn').addEventListener('click', async () => {
  try {
    const originalText = document.getElementById('addToCartBtn').innerHTML;
    document.getElementById('addToCartBtn').innerHTML = '<span class="material-symbols-outlined mr-2">hourglass_empty</span>Procesando...';
    document.getElementById('addToCartBtn').disabled = true;

    // Convertir canvas a imagen base64
    const imageData = canvas.toDataURL('image/png');
    const basePrice = materialPrices[currentMaterial];

    // 1. Crear el diseño en el backend
    const formData = new FormData();
    formData.append('imagenURL', imageData);
    formData.append('precioEstimado', basePrice);

    const designResponse = await fetch('/disenos/crear', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    if (!designResponse.ok) {
      const errorText = await designResponse.text();
      console.error('Error al crear diseño:', errorText);
      throw new Error(`Error al crear el diseño: ${designResponse.status}`);
    }

    const designData = await designResponse.json();
    const designId = designData.id;
    console.log('Diseño creado con ID:', designId);

    // 2. Añadir el diseño al carrito
    const cartFormData = new FormData();
    cartFormData.append('disenoPersonalizadoID', designId);
    cartFormData.append('cantidad', '1');

    const cartResponse = await fetch('/disenos/agregar', {
      method: 'POST',
      body: cartFormData,
      credentials: 'include'
    });

    if (!cartResponse.ok) {
      const errorText = await cartResponse.text();
      console.error('Error en respuesta del carrito:', errorText);

      // Intentar parsear el error
      let errorMessage = 'Error al añadir al carrito';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.detail || errorMessage;
      } catch (e) {
        errorMessage = errorText;
      }

      throw new Error(errorMessage);
    }

    const cartResult = await cartResponse.json();
    console.log('Resultado del carrito:', cartResult);

    // 3. Mostrar modal de éxito
    document.getElementById('modalMessage').textContent =
      `Tu diseño personalizado ha sido guardado y añadido al carrito exitosamente.`;
    document.getElementById('successModal').classList.remove('hidden');

  } catch (error) {
    console.error('Error completo:', error);

    // Mostrar error específico
    let errorMessage = error.message;
    if (errorMessage.includes('403')) {
      errorMessage = 'No tienes permiso para realizar esta acción. Por favor, inicia sesión nuevamente.';
    } else if (errorMessage.includes('404')) {
      errorMessage = 'El diseño no se encontró. Por favor, intenta guardarlo nuevamente.';
    } else if (errorMessage.includes('500')) {
      errorMessage = 'Error interno del servidor. Por favor, intenta más tarde o contacta al soporte.';
    }

    alert(`Error: ${errorMessage}`);
  } finally {
    // Restaurar botón
    document.getElementById('addToCartBtn').innerHTML =
      '<span class="material-symbols-outlined mr-2">add_shopping_cart</span>Añadir al Carrito';
    document.getElementById('addToCartBtn').disabled = false;
  }
});

// Eventos del modal
document.getElementById('continueDesigning').addEventListener('click', () => {
  document.getElementById('successModal').classList.add('hidden');
});

document.getElementById('goToCart').addEventListener('click', () => {
  window.location.href = '/carrito';
});

// Inicializar
document.addEventListener('DOMContentLoaded', init);