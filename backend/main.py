from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from .routers import (
    administrador_router,
    carrito_router,
    categoria_router,
    cliente_router,
    detalleCarrito_router,
    detallePedido_router,
    direccionEnvio_router,
    disenoPersonalizado_router,
    pago_router,
    pedido_router, producto_router,
    solicitudRecuperacion_router,
    transaccionPuntos_router,
    wishlist_router,
    wishlistitem_router
)

from .db.db import createAllTables

app = FastAPI(title="Meraki", lifespan=createAllTables)

# Montar los archivos estáticos
app.mount("/static", StaticFiles(directory="frontend/static"), name="static")

# Indicar dónde están los templates
templates = Jinja2Templates(directory="frontend/templates")

# Routers de la app
from .routers import (
    administrador_router,
    carrito_router,
    categoria_router,
    cliente_router,
    detalleCarrito_router,
    detallePedido_router,
    direccionEnvio_router,
    disenoPersonalizado_router,
    pago_router,
    pedido_router,
    producto_router,
    solicitudRecuperacion_router,
    transaccionPuntos_router,
    wishlist_router,
    wishlistitem_router
)

# Inclusion de los routers en la app
app.include_router(administrador_router.router)
app.include_router(carrito_router.router)
app.include_router(categoria_router.router)
app.include_router(cliente_router.router)
app.include_router(detalleCarrito_router.router)
app.include_router(detallePedido_router.router)
app.include_router(direccionEnvio_router.router)
app.include_router(disenoPersonalizado_router.router)
app.include_router(pago_router.router)
app.include_router(pedido_router.router)
app.include_router(producto_router.router)
app.include_router(solicitudRecuperacion_router.router)
app.include_router(transaccionPuntos_router.router)
app.include_router(wishlist_router.router)
app.include_router(wishlistitem_router.router)

# Rutas Front-end
@app.get("/")
def inicio(request: Request):
    return templates.TemplateResponse("principal.html", {"request": request})

@app.get("/registrar")
def paginaAuth(request: Request):
    return templates.TemplateResponse("auth/login.html", {"request": request})

@app.get("/ingresar")
def paginaAbout(request: Request):
    return templates.TemplateResponse("auth/login.html.html", {"request": request})

@app.get("/about")
def paginaPrincipal(request: Request):
    return templates.TemplateResponse("about.html", {"request": request})

@app.get("/carrito")
def paginaCarrito(request: Request):
    return templates.TemplateResponse("carrito/carrito.html", {"request": request})