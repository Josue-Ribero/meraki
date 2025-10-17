from sqlmodel import SQLModel, Field, Relationship, Column
from sqlalchemy import ForeignKey

class DireccionEnvioBase(SQLModel):
    nombre: str = Field()
    calle: str = Field()
    localidad: str = Field()
    codigoPostal: str = Field()
    esPredeterminada: bool = Field(default=False)

    # Metodo direccion
    def marcarComoPredeterminada(self):
        self.esPredeterminada = True

class DireccionEnvio(DireccionEnvioBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    clienteID: int = Field(sa_column=Column(ForeignKey("cliente.id", ondelete="CASCADE")))
    cliente: "Cliente" = Relationship(back_populates="direcciones")
    pedidos: list["Pedido"] = Relationship(back_populates="direccionEnvio")

class DireccionEnvioCreate(DireccionEnvioBase):
    pass

class DireccionEnvioUpdate(DireccionEnvioBase):
    pass

class DireccionEnvioDelete(DireccionEnvioBase):
    pass

# Importaciones diferidas
from .cliente import Cliente
from .pedido import Pedido