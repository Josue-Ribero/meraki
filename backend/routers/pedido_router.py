from fastapi import APIRouter, HTTPException, Depends
from ..auth.auth import clienteActual, adminActual
from ..utils.enums import EstadoPedido, TipoTransaccion
from sqlmodel import select
from ..models.pedido import Pedido, PedidoCreate, PedidoUpdate
from ..models.carrito import Carrito
from ..models.direccionEnvio import DireccionEnvio
from ..models.pedido import Pedido
from ..models.detallePedido import DetallePedido
from ..models.transaccionPuntos import TransaccionPuntos
from ..models.pago import Pago
from ..db.db import SessionDep

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])

# CREATE - Crear un pedido desde el carrito
@router.post("/checkout", status_code=201)
def checkout(nuevoPedido: PedidoCreate, session: SessionDep, cliente=Depends(clienteActual)):
    # Busca el carrito con los items
    carritoDB = session.exec(select(Carrito).where(Carrito.clienteID == cliente.id)).first()
    if not carritoDB or not carritoDB.detalles:
        raise HTTPException(400, "Carrito vacío")

    # Busca direccion (primero si es predeterminada)
    direccion = session.exec(
        select(DireccionEnvio).where(
            DireccionEnvio.clienteID == cliente.id,
            DireccionEnvio.esPredeterminada == True,
        )
    ).first()
    # Si no es predeterminada
    if not direccion:
        direccion = session.exec(select(DireccionEnvio).where(DireccionEnvio.clienteID == cliente.id)).first()
    # Si no hay direcciones
    if not direccion:
        raise HTTPException(400, "Necesitas una dirección")

    # Crear el pedido
    pedido = Pedido(
        clienteID=cliente.id,
        direccionEnvioID=direccion.id,
        estado=EstadoPedido.PENDIENTE,
        pagadoConPuntos=nuevoPedido.pagadoConPuntos,
        total=0,
    )
    session.add(pedido)
    session.flush()

    # Crear los detalles y descontar del stock
    total = 0
    for detalle in carritoDB.detalles:
        detallePedido = DetallePedido(
            pedidoID=pedido.id,
            productoID=detalle.productoID,
            disenoID=detalle.disenoID,
            cantidad=detalle.cantidad,
            precioUnidad=detalle.precioUnidad,
            subtotal=detalle.subtotal,
            esPersonalizado=detalle.esPersonalizado,
        )
        session.add(detallePedido)
        total += detalle.subtotal
        if detalle.productoID and detalle.producto:
            detalle.producto.stock -= detalle.cantidad
            if detalle.producto.stock < 0:
                raise HTTPException(400, f"Stock insuficiente para {detalle.producto.nombre}")
            session.add(detalle.producto)

    # Si se paga con puntos
    if nuevoPedido.pagadoConPuntos and cliente.puntos > 0:
        usar = min(cliente.puntos, total)
        total -= usar
        cliente.puntos -= usar
        pedido.puntosUsados = usar
        session.add(
            TransaccionPuntos(
                clienteID=cliente.id,
                pedidoID=pedido.id,
                tipo=TipoTransaccion.REDIMIDOS,
                cantidad=usar,
            )
        )

    pedido.total = total
    session.add(pedido)

    # Crear el pago como pendiente
    pago = Pago(pedidoID=pedido.id, confirmado=False)
    session.add(pago) # Insertar en la DB

    # Vaciar el carrito luego de hacer el pedido
    for detalle in carritoDB.detalles:
        session.delete(detalle)

    session.commit() # Guardar los cambios
    session.refresh(pedido)
    return pedido




# READ - Obtener la lista de pedidos del cliente
@router.get("/mis-pedidos", response_model=list[Pedido])
def misPedidos(session: SessionDep, cliente=Depends(clienteActual)):
    pedidosDB = session.exec(select(Pedido).where(Pedido.clienteID == cliente.id)).all()
    if not pedidosDB:
        raise HTTPException(404, "No tienes transacciones")
    return pedidosDB



# READ - Obtener lista de pedidos (solo administrador)
@router.get("/", response_model=list[Pedido])
def listaPedidos(session: SessionDep, _=Depends(adminActual)):
    pedidos = session.exec(select(Pedido)).all()
    return pedidos



# READ - Obtener pedido por ID (solo administrador)
@router.get("/{pedidoID}", response_model=Pedido)
def pedidoPorID(pedidoID: int, session: SessionDep, _=Depends(adminActual)):
    pedidoDB = session.get(Pedido, pedidoID)
    if not pedidoDB:
        raise HTTPException(404, "Pedido no encontrado")
    return pedidoDB



# UPDATE - Actualizar el estado del pedido (solo administrador)
@router.patch("/{pedidoID}", response_model=Pedido)
def actualizarEstado(pedidoID: int, pedidoData: PedidoUpdate, session: SessionDep, _=Depends(adminActual)):
    pedidoDB = session.get(Pedido, pedidoID)
    if not pedidoDB:
        raise HTTPException(404, "Pedido no encontrado")
    
    # Excluir los campos vacios
    pedidoUpdate = pedidoDB.model_dump(exclude_none=True)

    pedidoDB.sqlmodel_update(pedidoUpdate)
    session.add(pedidoDB)
    session.commit()
    session.refresh(pedidoDB)
    return pedidoDB