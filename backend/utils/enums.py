from enum import Enum

"""
    Definición de enumeraciones (Enums) para el sistema.

    Centraliza los estados y tipos constantes utilizados en los modelos y la lógica de negocio,
    como estados de pedidos, métodos de pago, tipos de transacción y estados de diseño,
    asegurando consistencia en toda la aplicación.
"""

# Estado carrito
class EstadoCarrito(Enum):
    ACTIVO = "ACTIVO"
    CONVERTIDO = "CONVERTIDO" # Pasa a ser pedido



# Estado de los pedidos
class EstadoPedido(Enum):
    POR_PAGAR = "POR PAGAR"
    PENDIENTE = "PENDIENTE"
    PAGADO = "PAGADO"
    CANCELADO = "CANCELADO"



# Estado de los pagos
class EstadoPago(Enum):
    PENDIENTE = "PENDIENTE"
    PAGADO = "PAGADO"
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
    EN_PRODUCCION = "EN PRODUCCION"
    TERMINADO = "TERMINADO"