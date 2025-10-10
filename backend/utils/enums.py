from enum import Enum

# Estado carrito
class EstadoCarrito(Enum):
    ACTIVO = "ACTIVO"
    CONVERTIDO = "CONVERTIDO" # Pasa a ser pedido

# Estado de los pedidos
class EstadoPedido(Enum):
    PENDIENTE = "PENDIENTE"
    PAGADO = "PAGADO"
    ENVIADO = "ENVIADO"
    ENTREGADO = "ENTREGADO"
    CANCELADO = "CANCELADO"

# Metodos de pago
class MetodoPago(Enum):
    TRANSFERENCIA = "TRANSFERENCIA"
    NEQUI = "NEQUI"
    DAVIPLATA = "DAVIPLATA"
    EFECTIVO = "EFECTIVO"
    PUNTOS = "PUNTOS"

# Tipo de transaccion de puntos
class TipoTransaccion(Enum):
    GANADOS = "GANADOS"
    REDIMIDOS = "REDIMIDOS"

# Estado del diseño personalizado
class EstadoDiseno(Enum):
    ENVIADO = "ENVIADO"
    EN_PRODUCCION = "EN_PRODUCCION"
    TERMINADO = "TERMINADO"