import requests
import os

TOKEN_WOMPI = os.getenv("WOMPI_PRIVATE_KEY")

def crearTransaccionWompi(pedido, cliente, metodo):
    headers={"Authorization": f"Bearer {TOKEN_WOMPI}"}

    # Mapear el método a Wompi
    mapMetodo = {
        "NEQUI": "NEQUI",
        "DAVIPLATA": "DAVIPLATA",
        "TRANSFERENCIA": "PSE"
    }

    # Tipo de pago
    tipo = mapMetodo.get(metodo.value if hasattr(metodo, "value") else metodo, "PSE")

    # Datos de la transaccion
    datos = {
        "amount_in_cents": int(pedido.total * 100),
        "currency": "COP",
        "customer_email": cliente.email,
        "payment_method": {"type": tipo},
        "reference": f"pedido-{pedido.id}",
        "redirect_url": f"https://tuapp.com/pago-exitoso/{pedido.id}"
    }

    try:

        response = requests.post(
            # sandbox en dev y production en despliegue
            "https://sandbox.wompi.co/v1/transactions",
            headers={"Authorization": "Bearer TU_TOKEN_PRIVADO"},
            json=datos,
            timeout=10
        )
        response.raise_for_status()

    except requests.RequestException as exception:
        raise Exception(f"Error al crear la transaccion de Wompi: {str(exception)}")
    
    datosResponse = response.json().get("data")
    # datosResponse = response.json()["data"]

    if not datosResponse:
        raise Exception("Respuesta inválida de Wompi")
    
    checkoutUrl = datosResponse.get("payment_method", {}).get("extra", {}).get("async_payment_url")
    referencia = datosResponse.get("reference")

    if not checkoutUrl or not referencia:
        raise Exception("Faltan datos de checkout o referencia en la respuesta Wompi")

    return checkoutUrl, referencia