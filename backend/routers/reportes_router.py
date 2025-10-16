from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlmodel import select
from sqlalchemy.orm import joinedload
import pandas as pd
import io
from datetime import datetime
from ..models.pedido import Pedido
from ..models.detallePedido import DetallePedido
from ..db.db import SessionDep
from ..auth.auth import adminActual

router = APIRouter(prefix="/reportes", tags=["Reportes"])

@router.get("/pedidos.csv")
def reportepedidosCsv(
    estado: str | None = None,
    fechaInicio: str | None = None,
    fechaFin: str | None = None,
    session: SessionDep = None,
    _=Depends(adminActual)
    ):

    # Informacion de pedido
    reporte = (
        select(DetallePedido).options(
            joinedload(DetallePedido.pedido)
            .joinedload(Pedido.cliente),
            joinedload(DetallePedido.producto)
        ). join(Pedido).where(Pedido.clienteEliminado == False)
    )

    if estado:
        reporte = reporte.where(Pedido.estado == estado)
    if fechaInicio:
        reporte = reporte.where(Pedido.fecha >= datetime.fromisoformat(fechaInicio))
    if fechaFin:
        reporte = reporte.where(Pedido.fecha <= datetime.fromisoformat(fechaFin))
    
    detalles = session.exec(reporte).all()

    filas = [
        {
            "Pedido ID": detalle.pedido.id,
            "Fecha": detalle.pedido.fecha.date(),
            "Cliente": detalle.pedido.cliente.nombre,
            "Producto": detalle.producto.nombre if detalle.producto else "Diseño personalizado",
            "Cantidad": detalle.cantidad,
            "Precio Unidad": detalle.precioUnidad,
            "Subtotal": detalle.subtotal,
            "Total Pedido": detalle.pedido.total,
            "Estado": detalle.pedido.estado,
        }
        for detalle in detalles
    ]

    # Creacion del DataFrame
    df = pd.DataFrame(filas)
    stream = io.StringIO() # Entradas y salidas
    df.to_csv(stream, index=False) # Conversion a CSV
    stream.seek(0)

    return StreamingResponse(
        io.BytesIO(stream.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=pedidos.csv"}
    )