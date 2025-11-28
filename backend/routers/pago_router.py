from fastapi import APIRouter, Depends, HTTPException, Form
from sqlmodel import select
from uuid import uuid4
from ..models.pago import Pago, PagoCreate
from ..models.pedido import Pedido
from ..models.cliente import Cliente
from ..models.transaccionPuntos import TransaccionPuntos
from ..utils.enums import MetodoPago, EstadoPedido, TipoTransaccion
from ..auth.auth import clienteActual, adminActual
from ..db.db import SessionDep

router = APIRouter(prefix="/pagos", tags=["Pagos"])

# CREATE - Crear un pago para un pedido
@router.post("/crear", response_model=Pago, status_code=201)
def crearPago(
    pedidoID: int = Form(...),
    metodo: MetodoPago = Form(...),
    usarPuntos: bool = Form(False),
    session: SessionDep = None,
    cliente=Depends(clienteActual)
):
    """
    Endpoint para crear un pago para un pedido
    """
    
    # Obtener pedido por ID
    pedido = session.get(Pedido, pedidoID)
    
    # Si no existe el pedido o no pertenece al cliente, mostrar error
    if not pedido or pedido.clienteID != cliente.id:
        raise HTTPException(403, "Pedido no encontrado o no te pertenece")
    
    # Verificar que el pedido no tenga ya un pago
    pagoDB = session.exec(select(Pago).where(Pago.pedidoID == pedido.id)).first()
    
    # Si ya existe un pago para este pedido, mostrar error
    if pagoDB:
        raise HTTPException(400, "Este pedido ya tiene un pago asociado")

    # Manejar pago con puntos / normal
    puntosUsados = 0
    confirmado = False

    # Si se usan puntos
    if usarPuntos:
        if cliente.puntos <= 0:
            raise HTTPException(400, "No tienes puntos disponibles")

        puntosUsados = min(cliente.puntos, pedido.total)
        cliente.puntos -= puntosUsados
        pedido.pagadoConPuntos = True
        pedido.puntosUsados = puntosUsados

        if puntosUsados > 0:
            transaccionRedimidos = TransaccionPuntos(
                clienteID=cliente.id,
                pedidoID=pedido.id,
                tipo=TipoTransaccion.REDIMIDOS,
                cantidad=puntosUsados
            )
            session.add(transaccionRedimidos)

        if puntosUsados >= pedido.total:
            confirmado = True
            pedido.estado = EstadoPedido.PAGADO
    else:
        # No puntos: estado PENDIENTE, confirmado False
        pedido.estado = EstadoPedido.PENDIENTE
        confirmado = False
    
    # Crear pago
    pago = Pago(
        pedidoID=pedido.id,
        metodo=metodo,
        referencia=f"pago-{uuid4()}",
        confirmado=confirmado
    )
    
    # Insertar y guardar cambios en la DB
    session.add(pedido)
    session.add(pago)
    session.add(cliente)
    session.commit()
    session.refresh(pago)
    return pago



# READ - Lista de pagos del cliente
@router.get("/", response_model=list[Pago])
def listaPagos(session: SessionDep, cliente=Depends(clienteActual)):
    """
    Endpoint para obtener la lista de pagos del cliente
    """
    
    # Obtener la lista de pagos
    pagos = session.exec(select(Pago).join(Pedido).where(Pedido.clienteID == cliente.id)).all()
    return pagos



# READ - Obtener detalle de un pago
@router.get("/{pagoID}", response_model=Pago)
def pago(pagoID: int, session: SessionDep, cliente=Depends(clienteActual)):
    """
    Endpoint para obtener el detalle de un pago
    """
    
    # Obtener el pago por ID
    pagoDB = session.get(Pago, pagoID)
    
    # Si no existe el pago, mostrar error
    if not pagoDB:
        raise HTTPException(404, "Pago no encontrado")
    
    return pagoDB



# READ - Obtener pago por pedidoID
@router.get("/pedido/{pedidoID}", response_model=Pago)
def pagoPorPedidoID(pedidoID: int, session: SessionDep, _=Depends(adminActual)):
    """
    Endpoint para obtener el pago por pedidoID
    """
    
    # Verificar que exista el pago
    pagoDB = session.exec(select(Pago).where(Pago.pedidoID == pedidoID)).first()
    
    # Si no existe el pago, mostrar error
    if not pagoDB:
        raise HTTPException(404, "Pago no encontrado para este pedido")
    
    return pagoDB



# READ - Obtener lista de pagos (admin)
@router.get("/admin/lista", response_model=list[Pago])
def listaPagosAdmin(session: SessionDep, _=Depends(adminActual)):
    """
    Endpoint para obtener la lista de pagos (admin)
    """
    
    # Obtener la lista de pagos
    pagos = session.exec(select(Pago)).all()
    
    # Si no hay pagos, mostrar error
    if not pagos:
        raise HTTPException(404, "No hay pagos")
    
    return pagos