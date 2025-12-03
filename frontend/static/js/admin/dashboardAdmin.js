// Inicialización cuando el DOM está completamente cargado
document.addEventListener("DOMContentLoaded", function () {

  // Inicializar todos los componentes
  inicializarGrafica();
  inicializarTooltips();
});

function inicializarGrafica() {
  const ctx = document.getElementById("ventasChart");

  if (!ctx) {
    return;
  }

  // Verificar si tenemos datos para la gráfica
  if (!window.datosGrafica || !Array.isArray(window.datosGrafica.meses) || !Array.isArray(window.datosGrafica.ventas)) {
    crearGraficaConDatosEjemplo(ctx);
    return;
  }

  crearGraficaConDatosReales(ctx);
}

function crearGraficaConDatosReales(ctx) {
  try {
    const meses = window.datosGrafica.meses;
    const ventas = window.datosGrafica.ventas;

    // Validar que los datos sean correctos
    if (meses.length === 0 || ventas.length === 0 || meses.length !== ventas.length) {
      throw new Error("Datos de gráfica inconsistentes");
    }

    new Chart(ctx, {
      type: "line",
      data: {
        labels: meses,
        datasets: [{
          label: "Ventas ($)",
          data: ventas,
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
                return `Ventas: $${context.parsed.y.toLocaleString()}`;
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
                return '$' + value.toLocaleString();
              }
            },
            beginAtZero: true
          }
        }
      }
    });

  } catch (error) {
    crearGraficaConDatosEjemplo(ctx);
  }
}

function crearGraficaConDatosEjemplo(ctx) {
  try {
    // Datos de ejemplo para demostración
    const mesesEjemplo = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const ventasEjemplo = [1200, 1900, 1500, 2200, 1800, 2500, 2100, 2800, 2400, 3000, 2700, 3200];

    new Chart(ctx, {
      type: "line",
      data: {
        labels: mesesEjemplo,
        datasets: [{
          label: "Ventas ($) - Datos de Ejemplo",
          data: ventasEjemplo,
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
          }
        },
        scales: {
          x: {
            grid: {
              color: "rgba(209, 188, 151, 0.2)"
            },
            ticks: {
              color: "#363636",
              font: { family: "Work Sans" }
            }
          },
          y: {
            grid: {
              color: "rgba(209, 188, 151, 0.2)"
            },
            ticks: {
              color: "#363636",
              font: { family: "Work Sans" },
              callback: function (value) {
                return '$' + value.toLocaleString();
              }
            },
            beginAtZero: true
          }
        }
      }
    });

  } catch (error) {
    // Si falla incluso la gráfica de ejemplo, mostrar un mensaje
    ctx.parentElement.innerHTML = '<p class="text-red-500">No se pudo cargar la gráfica de ventas</p>';
  }
}

function inicializarTooltips() {
}