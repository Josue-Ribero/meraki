// Funcion para actualizar el valor del slider
const slider = document.getElementById("sliderPuntos");
const puntos = document.getElementById("valorPuntos");
const descuento = document.getElementById("valorDescuento");

// Si el slider existe, agregar el evento
if (slider) {
  slider.addEventListener("input", () => {
    const valor = slider.value;
    puntos.textContent = valor;
    descuento.textContent = `S/ ${(valor / 10).toFixed(2)}`;
  });
}