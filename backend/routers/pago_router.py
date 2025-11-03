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
    pedido = session.get(Pedido, pedidoID)
    if not pedido or pedido.clienteID != cliente.id:
        raise HTTPException(403, "Pedido no encontrado o no te pertenece")
    
    # Verificar que el pedido no tenga ya un pago
    pagoExistente = session.exec(
        select(Pago).where(Pago.pedidoID == pedido.id)
    ).first()
    if pagoExistente:
        raise HTTPException(400, "Este pedido ya tiene un pago asociado")
    
    # Manejar pago con puntos
    puntosUsados = 0
    confirmado = False
    
    if usarPuntos:
        if cliente.puntos <= 0:
            raise HTTPException(400, "No tienes puntos disponibles")
        
        # Usar puntos disponibles (hasta cubrir el total o los puntos disponibles)
        puntosUsados = min(cliente.puntos, pedido.total)
        
        # Actualizar puntos del cliente
        cliente.puntos -= puntosUsados
        pedido.pagadoConPuntos = True
        pedido.puntosUsados = puntosUsados
        
        # Registrar transacción de puntos redimidos
        if puntosUsados > 0:
            transaccionRedimidos = TransaccionPuntos(
                clienteID=cliente.id,
                pedidoID=pedido.id,
                tipo=TipoTransaccion.REDIMIDOS,
                cantidad=puntosUsados
            )
            session.add(transaccionRedimidos)
        
        # Si el pago se cubre completamente con puntos, se confirma automáticamente
        if puntosUsados >= pedido.total:
            confirmado = True
            pedido.estado = EstadoPedido.PAGADO
    
    # Crear pago
    pago = Pago(
        pedidoID=pedido.id,
        metodo=metodo,
        referencia=f"pago-{uuid4()}",
        confirmado=confirmado
    )
    
    # NOTA: Se eliminó la parte que otorgaba puntos cuando se paga con puntos
    
    session.add(pago)
    session.add(cliente)
    session.commit()
    session.refresh(pago)
    return pago

# READ - Lista de pagos del cliente
@router.get("/", response_model=list[Pago])
def listaPagos(session: SessionDep, cliente=Depends(clienteActual)):
    pagos = session.exec(select(Pago).join(Pedido).where(Pedido.clienteID == cliente.id)).all()
    return pagos

# READ - Obtener detalle de un pago
@router.get("/{pagoID}", response_model=Pago)
def pago(pagoID: int, session: SessionDep, cliente=Depends(clienteActual)):
    pagoDB = session.get(Pago, pagoID)
    if not pagoDB:
        raise HTTPException(404, "Pago no encontrado")
    
    pedidoDB = session.get(Pedido, pagoDB.pedidoID)
    if not pedidoDB or pedidoDB.clienteID != cliente.id:
        raise HTTPException(403, "No tienes permiso para ver este pago")
    
    return pagoDB

# READ - Obtener lista de pagos (admin)
@router.get("/admin/lista", response_model=list[Pago])
def listaPagosAdmin(session: SessionDep, _=Depends(adminActual)):
    pagos = session.exec(select(Pago)).all()
    return pagos

# UPDATE - Confirmar el pago (admin)
@router.patch("/{pagoID}/confirmar", response_model=Pago)
def confirmarPago(pagoID: int, session: SessionDep, _=Depends(adminActual)):
    pagoDB = session.get(Pago, pagoID)
    if not pagoDB:
        raise HTTPException(404, "Pago no encontrado")
    
    pagoDB.confirmado = True
    
    # Actualizar estado del pedido
    pedido = session.get(Pedido, pagoDB.pedidoID)
    if pedido:
        pedido.estado = EstadoPedido.PAGADO
        
        # Otorgar 5% del total en puntos al cliente (SOLO si NO pagó con puntos)
        if not pedido.pagadoConPuntos:
            puntosGanados = int(pedido.total * 0.05)
            if puntosGanados > 0:
                cliente = session.get(Cliente, pedido.clienteID)
                if cliente:
                    cliente.puntos += puntosGanados
                    
                    # Registrar transacción de puntos ganados
                    transaccion = TransaccionPuntos(
                        clienteID=cliente.id,
                        pedidoID=pedido.id,
                        tipo=TipoTransaccion.GANADOS,
                        cantidad=puntosGanados
                    )
                    session.add(transaccion)
                    session.add(cliente)
    
    session.add(pagoDB)
    session.commit()
    session.refresh(pagoDB)
    return pagoDB