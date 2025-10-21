from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from uuid import uuid4
from ..models.pago import Pago, PagoCreate
from ..models.pedido import Pedido
from ..utils.enums import MetodoPago, EstadoPago, EstadoPedido
from ..services.pagoService import crearTransaccionWompi
from ..auth.auth import clienteActual, adminActual
from ..db.db import SessionDep

router = APIRouter(prefix="/pagos", tags=["Pagos"])

# CREATE - Crear un pago (por ahora solo pasa como pago)
# Intento de pasarela de pago
"""@router.post("/crear", response_model=Pago, status_code=201)
def crearPago(nuevoPago: PagoCreate, session: SessionDep, cliente=Depends(clienteActual)):
    # Validar que el pedido sea del cliente
    pedido = session.get(Pedido, nuevoPago.pedidoID)
    # Si no existe el pedido o no es el mismo
    if not pedido or pedido.clienteID != cliente.id:
        raise HTTPException(403, "Pedido no encontrado o no te pertenece")
    
    # Verificar si el pedido ya tiene un pago registrado
    pagoDB = session.exec(
        select(Pago).where(Pago.pedidoID == pedido.id)
    ).first()
    # Si existe el pago
    if pagoDB:
        raise HTTPException(400, "Este pedido ya tiene un pago en proceso o confirmado")
    
    # Crear el pago local (sin confirmar)
    pago = Pago(
        pedidoID=pedido.id,
        metodo=nuevoPago.metodo,
        referencia=f"pago-{uuid4()}",
        estado=EstadoPago.PENDIENTE,
        monto=pedido.total
    )
    session.add(pago)
    session.commit()
    session.refresh(pago)

    # Si el método es digital, conectar con pasarela (Wompi)
    if pago.metodo in [MetodoPago.NEQUI, MetodoPago.DAVIPLATA, MetodoPago.TRANSFERENCIA]:
        try:
            urlCheckout, referenciaWompi = crearTransaccionWompi(pedido, cliente, pago.metodo)
            pago.urlCheckout = urlCheckout
            pago.referencia = referenciaWompi  # Actualiza con referencia Wompi
            session.add(pago)
            session.commit()
            session.refresh(pago)
        except Exception as exception:
            session.rollback()
            raise HTTPException(status_code=500, detail=f"Error creando la transacción: {str(exception)}")
    
    # Si es pago con puntos, confirma directo
    elif pago.metodo == MetodoPago.PUNTOS:
        pago.confirmado = True
        session.commit() # Guarda los cambios
    
    return pago"""


# READ - Lista de pagos del cliente
@router.get("/", response_model=list[Pago])
def listaPagos(session: SessionDep, cliente=Depends(clienteActual)):
    pagos = session.exec(select(Pago).join(Pedido).where(Pedido.clienteID == cliente.id)).all()
    return pagos



# READ - Obtener detalle de un pago
@router.get("/{pagoID}", response_model=Pago)
def pago(pagoID: int, session: SessionDep, cliente=Depends(clienteActual)):
    # Verificar si existe el pago
    pagoDB = session.get(Pago, pagoID)
    if not pagoDB:
        raise HTTPException(404, "Pago no encontrado")
    
    # Verificar si existe el pedido
    pedidoDB = session.get(Pedido, pagoDB.pedidoID)
    if pedidoDB.clienteID != cliente.id:
        raise HTTPException(403, "No tienes permiso para ver este pago")
    
    return pagoDB




# CREATE - Webhook de Wompi
@router.post("/webhook")
def webhookWompi(cargaUtil: dict, session: SessionDep):
    datosTransaccion = cargaUtil.get("data", {}).get("transaction", {})
    referencia = datosTransaccion.get("reference")
    estado = datosTransaccion.get("status")

    # Si no hay referencia del pago
    if not referencia:
        return {"ok": False, "message": "Referencia no encontrada"}
    
    # Obtener el pago por referencia
    pago = session.exec(select(Pago).where(Pago.referencia == referencia)).first()
    if not pago:
        return {"ok": False, "message": "Pago no encontrado"}

    if estado == "APPROVED":
        pago.confirmado = True
        # Verificar si se pago el pedido
        pedido = session.get(Pedido, pago.pedidoID)
        if pedido:
            pedido.estado = "pagado"
        session.commit()

    return {"ok": True}



# READ - Obtener lista de pagos
@router.get("/", response_model=list[Pago])
def listaPagos(session: SessionDep):
    pagos = session.exec(select(Pago)).all()
    return pagos



# UPDATE - Confirmar el pago en caso de efectivo (admin)
@router.patch("/{pagoID}/confirmar", response_model=Pago)
def confirmarPago(pagoID: int, session: SessionDep, _=Depends(adminActual)):
    # Validar que el pago exista
    pagoDB = session.get(Pago, pagoID)
    # Caso en que no existe
    if not pagoDB:
        raise HTTPException(404, "Pago no encontrado")
    
    pagoDB.confirmarPago() # Confirmar que se hizo el pago
    session.add(pagoDB) # Agregar a la DB
    session.commit() # Guardar los cambios
    session.refresh(pagoDB)
    return pagoDB