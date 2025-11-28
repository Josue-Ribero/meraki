from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime as dt
from typing import Optional

"""
    Modelo para administrador.

    Es el encargado de gestionar los pedidos, clientes, productos, categorias y mirar como va el negocio.

    Asi mismo, tiene su propio panel para revisar las estadisticas del emprendimiento.
"""

# Modelo base de administrador
class AdministradorBase(SQLModel):
    nombre: str = Field()
    email: str = Field(unique=True)
    contrasenaHash: str = Field()
    fechaCreacion: dt = Field(default_factory=dt.now)

    # Metodos administrador
    def crearCategoria():
        print("Aun no")
    
    def crearProducto():
        print("Aun no")
    
    def actualizarCategoria():
        print("Aun no")
    
    def actualizarProducto():
        print("Aun no")
    
    def eliminarCategoria():
        print("Aun no")
    
    def eliminarProducto():
        print("Aun no")
    
    def actualizarEstadoPedido():
        print("Aun no")



# Modelo de administrador
class Administrador(AdministradorBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    categorias: list["Categoria"] = Relationship(back_populates="administrador")
    clientes: list["Cliente"] = Relationship(back_populates="administrador")
    disenos: list["DisenoPersonalizado"] = Relationship(back_populates="administrador")
    productos: list["Producto"] = Relationship(back_populates="administrador")
    pedidos: list["Pedido"] = Relationship(back_populates="administrador")
    pagos: list["Pago"] = Relationship(back_populates="administrador")
    


# Modelo de administrador para actualizar
class AdministradorUpdate(SQLModel):
    nombre: Optional[str] = None



# Importaciones diferidas
from .categoria import Categoria
from .cliente import Cliente
from .disenoPersonalizado import DisenoPersonalizado
from .producto import Producto
from .pedido import Pedido
from .pago import Pago