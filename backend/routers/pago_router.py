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
    pagoDB = session.exec(select(Pago).where(Pago.pedidoID == pedido.id)).first()
    if pagoDB:
        raise HTTPException(400, "Este pedido ya tiene un pago asociado")
    
    # Manejar pago con puntos
    puntosUsados = 0
    confirmado = False
    
    # Si usa puntos validar que tenga suficientes
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
    
    session.add(pago)
    session.add(cliente)
    session.commit()
    session.refresh(pago)
    return pago



# READ - Lista de pagos del cliente
@router.get("/", response_model=list[Pago])
def listaPagos(session: SessionDep, cliente=Depends(clienteActual)):
    # Obtener la lista de pagos
    pagos = session.exec(select(Pago).join(Pedido).where(Pedido.clienteID == cliente.id)).all()
    return pagos



# READ - Obtener detalle de un pago
@router.get("/{pagoID}", response_model=Pago)
def pago(pagoID: int, session: SessionDep, cliente=Depends(clienteActual)):
    # Obtener el pago por ID
    pagoDB = session.get(Pago, pagoID)
    if not pagoDB:
        raise HTTPException(404, "Pago no encontrado")
    
    return pagoDB



# READ - Obtener pago por pedidoID (NUEVO ENDPOINT)
@router.get("/pedido/{pedidoID}", response_model=Pago)
def pagoPorPedidoID(pedidoID: int, session: SessionDep, _=Depends(adminActual)):
    # Verificar que exista el pago
    pagoDB = session.exec(select(Pago).where(Pago.pedidoID == pedidoID)).first()
    if not pagoDB:
        raise HTTPException(404, "Pago no encontrado para este pedido")
    return pagoDB



# READ - Obtener lista de pagos (admin)
@router.get("/admin/lista", response_model=list[Pago])
def listaPagosAdmin(session: SessionDep, _=Depends(adminActual)):
    # Obtener la lista de pagos
    pagos = session.exec(select(Pago)).all()
    return pagos



# UPDATE - Confirmar el pago (admin)
@router.patch("/{pagoID}/confirmar", response_model=Pago)
def confirmarPago(pagoID: int, session: SessionDep, _=Depends(adminActual)):
    print(f"Confirmando pago ID: {pagoID}")
    
    # Buscar el pago en la DB
    pagoDB = session.get(Pago, pagoID)
    if not pagoDB:
        print(f"Pago {pagoID} no encontrado")
        raise HTTPException(404, "Pago no encontrado")
    
    print(f"Pago encontrado: {pagoDB.id}, Confirmado: {pagoDB.confirmado}")
    
    # Verificar si ya está confirmado
    if pagoDB.confirmado:
        print("Pago ya estaba confirmado")
        return pagoDB
    
    # Se confirma el pago
    pagoDB.confirmado = True
    print("Marcar pago como confirmado")
    
    # Actualizar estado del pedido
    pedido = session.get(Pedido, pagoDB.pedidoID)
    if pedido:
        print(f"Pedido asociado: {pedido.id}, Estado actual: {pedido.estado}")
        pedido.estado = EstadoPedido.PAGADO
        print(f"Estado del pedido actualizado a: {pedido.estado}")
        
        # Otorgar 5% del total en puntos al cliente (SOLO si NO pagó con puntos)
        if not pedido.pagadoConPuntos:
            puntosGanados = int(pedido.total * 0.05)
            if puntosGanados > 0:
                cliente = session.get(Cliente, pedido.clienteID)
                if cliente:
                    print(f"Otorgando {puntosGanados} puntos al cliente {cliente.id}")
                    cliente.puntos += puntosGanados
                    
                    # Registrar transacción de puntos ganados
                    transaccion = TransaccionPuntos(
                        clienteID=cliente.id,
                        pedidoID=pedido.id,
                        tipo=TipoTransaccion.GANADOS,
                        cantidad=puntosGanados
                    )
                    session.add(transaccion) # Insertar la transacción en la DB
                    session.add(cliente) # Insertar el cliente en la DB
        else:
            print("No se otorgan puntos porque el pedido se pagó con puntos")
    
    # Probar si se puede guardar el pago en la DB
    try:
        session.add(pagoDB)
        session.commit()
        session.refresh(pagoDB)
        print("Pago confirmado y guardado correctamente")
        return pagoDB
    
    # Excepción si no se pudo guardar el pago
    except Exception as e:
        session.rollback()
        raise HTTPException(500, f"Error al confirmar pago: {str(e)}")