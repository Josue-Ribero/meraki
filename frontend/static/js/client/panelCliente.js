// Controla el slider de puntos y actualiza el texto dinámicamente
const slider = document.getElementById("sliderPuntos");
const puntos = document.getElementById("valorPuntos");
const descuento = document.getElementById("valorDescuento");

if (slider) {
  slider.addEventListener("input", () => {
    const valor = slider.value;
    puntos.textContent = valor;
    descuento.textContent = `S/ ${(valor / 10).toFixed(2)}`;
  });
}