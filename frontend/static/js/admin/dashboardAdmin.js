// dashboardAdmin.js - Versión corregida para leer datos correctamente
document.addEventListener("DOMContentLoaded", function () {
  console.log("Dashboard cargado correctamente");

  // Inicializar todos los componentes
  inicializarGrafica();
  inicializarTooltips();
});

function inicializarGrafica() {
  const ctx = document.getElementById("ventasChart");

  if (!ctx) {
    console.error("No se encontró el elemento canvas para la gráfica");
    return;
  }

  const datosGraficaElement = document.getElementById("datosGrafica");

  if (!datosGraficaElement) {
    console.error("No se encontró el elemento datosGrafica");
    mostrarMensajeSinDatos(ctx);
    return;
  }

  try {
    // Leer datos desde los atributos data separados
    const mesesData = datosGraficaElement.getAttribute('data-meses');
    const ventasData = datosGraficaElement.getAttribute('data-ventas');

    console.log("Datos crudos - Meses:", mesesData);
    console.log("Datos crudos - Ventas:", ventasData);

    if (!mesesData || !ventasData) {
      throw new Error("Datos de gráfica no encontrados en los atributos");
    }

    // Parsear los datos
    const meses = JSON.parse(mesesData);
    const ventas = JSON.parse(ventasData);

    console.log("Datos parseados - Meses:", meses);
    console.log("Datos parseados - Ventas:", ventas);

    // Validar datos
    if (!Array.isArray(meses) || !Array.isArray(ventas) ||
      meses.length === 0 || ventas.length === 0 ||
      meses.length !== ventas.length) {
      throw new Error("Datos de gráfica inválidos o inconsistentes");
    }

    crearGraficaConDatosReales(ctx, meses, ventas);

  } catch (error) {
    console.error("Error procesando datos de la gráfica:", error);
    mostrarMensajeError(ctx, "Error cargando datos: " + error.message);
  }
}

function crearGraficaConDatosReales(ctx, meses, ventas) {
  try {
    console.log("Creando gráfica con datos reales");

    // Asegurar que las ventas sean números
    const ventasNumeros = ventas.map(v => {
      if (typeof v === 'number') return v;
      if (typeof v === 'string') {
        // Remover caracteres no numéricos excepto punto y guión
        const numero = parseFloat(v.replace(/[^0-9.-]+/g, ""));
        return isNaN(numero) ? 0 : numero;
      }
      return 0;
    });

    console.log("Ventas convertidas a números:", ventasNumeros);

    new Chart(ctx, {
      type: "line",
      data: {
        labels: meses,
        datasets: [{
          label: "Ventas ($)",
          data: ventasNumeros,
          borderColor: "#9c642d",
          backgroundColor: "rgba(170, 135, 68, 0.3)",
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: "#aa8744",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: {
              color: "#363636",
              font: {
                family: "Work Sans",
                weight: "bold",
                size: 12
              }
            }
          },
          tooltip: {
            backgroundColor: "rgba(54, 54, 54, 0.9)",
            titleFont: { family: "Work Sans" },
            bodyFont: { family: "Work Sans" },
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: function (context) {
                return `Ventas: $${formatearPrecio(context.parsed.y)}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: "rgba(209, 188, 151, 0.2)"
            },
            ticks: {
              color: "#363636",
              font: {
                family: "Work Sans",
                size: 11
              }
            }
          },
          y: {
            grid: {
              color: "rgba(209, 188, 151, 0.2)"
            },
            ticks: {
              color: "#363636",
              font: {
                family: "Work Sans",
                size: 11
              },
              callback: function (value) {
                return '$' + formatearPrecio(value);
              }
            },
            beginAtZero: true
          }
        }
      }
    });

    console.log("Gráfica creada exitosamente con datos reales");

  } catch (error) {
    console.error("Error creando gráfica con datos reales:", error);
    mostrarMensajeError(ctx, "Error creando gráfica: " + error.message);
  }
}

// Funcion para formatear precios con puntos (ej: 170.000)
function formatearPrecio(precio) {
  if (!precio && precio !== 0) return '0';
  // Convertir a entero y luego a string
  const precioString = Math.floor(Number(precio)).toString();
  // Usar regex para agregar puntos cada 3 dígitos
  return precioString.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function mostrarMensajeSinDatos(ctx) {
  ctx.parentElement.innerHTML = `
    <div class="flex flex-col items-center justify-center h-full text-center p-4">
      <span class="material-symbols-outlined text-4xl text-gray-400 mb-2">bar_chart</span>
      <p class="text-gray-500 font-medium">No hay datos de ventas disponibles</p>
      <p class="text-gray-400 text-sm mt-1">Los datos de ventas mensuales no están disponibles en este momento.</p>
    </div>
  `;
}

function mostrarMensajeError(ctx, mensaje) {
  ctx.parentElement.innerHTML = `
    <div class="flex flex-col items-center justify-center h-full text-center p-4">
      <span class="material-symbols-outlined text-4xl text-red-400 mb-2">error</span>
      <p class="text-red-500 font-medium">Error al cargar la gráfica</p>
      <p class="text-gray-600 text-sm mt-1">${mensaje}</p>
    </div>
  `;
}

function inicializarTooltips() {
  // Inicializar tooltips si es necesario
  console.log("Tooltips inicializados");
}