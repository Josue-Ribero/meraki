from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select
from ..models.pago import Pago, PagoCreate
from ..models.pedido import Pedido
from ..auth.auth import clienteActual, adminActual
from ..db.db import SessionDep

router = APIRouter(prefix="/pagos", tags=["Pagos"])

# CREATE - Crear un pago
@router.post("/crear", response_model=Pago, status_code=201)
def crearPago(nuevoPago: PagoCreate, session: SessionDep, cliente=Depends(clienteActual)):
    # Validar que el pedido sea del cliente
    pedido = session.get(Pedido, nuevoPago.pedidoID)

    # Si no existe el pedido o no es el mismo
    if not pedido or pedido.clienteID != cliente.id:
        raise HTTPException(403, "Pedido no encontrado o no te pertenece")
    
    # Crear el pago
    pago = Pago.model_validate(nuevoPago)
    session.add(pago) # Agregar a la DB
    session.commit() # Guardar los cambios
    session.refresh(pago)
    return pago



# READ - Obtener lista de pagos
@router.get("/", response_model=list[Pago])
def listaPagos(session: SessionDep):
    pagos = session.exec(select(Pago)).all()
    return pagos



# UPDATE - Confirmar el pago (admin)
@router.patch("/{pagoID}/confirmar", response_model=Pago)
def confirmar_pago(pagoID: int, session: SessionDep, _=Depends(adminActual)):
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