document.addEventListener("DOMContentLoaded", () => {
  const ctx = document.getElementById("ventasChart");

  if (!ctx) return;

  const data = {
    labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
    datasets: [{
      label: "Ventas ($)",
      data: [1200, 900, 1500, 1700, 1600, 2100, 2500, 2300, 2800, 3000, 3200, 4000],
      borderColor: "#9c642d",
      backgroundColor: "rgba(170, 135, 68, 0.3)",
      borderWidth: 2,
      tension: 0.4,
      fill: true,
      pointBackgroundColor: "#aa8744"
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: "#363636",
          font: { family: "Work Sans", weight: "bold" }
        }
      },
      tooltip: {
        backgroundColor: "#363636",
        titleColor: "#aa8744",
        bodyColor: "#fdfbf3"
      }
    },
    scales: {
      x: {
        ticks: { color: "#9c642d" },
        grid: { display: false }
      },
      y: {
        ticks: { color: "#9c642d" },
        grid: { color: "rgba(156,100,45,0.1)" }
      }
    }
  };

  new Chart(ctx, { type: "line", data, options });
});