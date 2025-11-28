from sqlmodel import SQLModel, Field, Relationship, Column
from sqlalchemy import ForeignKey
from typing import Optional

"""
    Modelo para dirección de envío.

    Almacena las direcciones físicas asociadas a un cliente para la entrega de pedidos.
    Permite gestionar múltiples direcciones y marcar una como predeterminada.
"""

# Modelo base de direccion de envio
class DireccionEnvioBase(SQLModel):
    nombre: str = Field()
    calle: str = Field()
    localidad: str = Field()
    codigoPostal: str = Field()
    esPredeterminada: bool = Field(default=False)

    # Metodo direccion
    def marcarComoPredeterminada(self):
        self.esPredeterminada = True



# Modelo de direccion de envio
class DireccionEnvio(DireccionEnvioBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    clienteID: int = Field(sa_column=Column(ForeignKey("cliente.id", ondelete="CASCADE")))
    cliente: "Cliente" = Relationship(back_populates="direcciones")
    pedidos: list["Pedido"] = Relationship(back_populates="direccionEnvio")



# Modelo de direccion de envio para crear
class DireccionEnvioCreate(DireccionEnvioBase):
    pass



# Modelo de direccion de envio para actualizar
class DireccionEnvioUpdate(DireccionEnvioBase):
    pass



# Modelo de direccion de envio para eliminar
class DireccionEnvioDelete(DireccionEnvioBase):
    pass



# Importaciones diferidas
from .cliente import Cliente
from .pedido import Pedido