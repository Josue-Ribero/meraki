<div align="center">
  <h1>🛍️ Meraki</h1>
  <p><em>Donde la creatividad se encuentra con la joyería.</em></p>

  [![Version](https://img.shields.io/badge/Version-0.0.1-blue.svg)](https://github.com/Josue-Ribero/meraki/releases)
  [![FastAPI](https://img.shields.io/badge/FastAPI-v0.118.3-green.svg)](https://github.com/fastapi/fastapi)
  [![SQLModel](https://img.shields.io/badge/SQLModel-v0.0.24-green.svg)](https://github.com/fastapi/sqlmodel)
  [![Python](https://img.shields.io/badge/Python-3.13.5-yellow.svg)](https://www.python.org/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v18.0-orange.svg)](https://github.com/postgres/postgres)

</div>

---

## 📖 ¿Qué es Meraki?

**Meraki** es una tienda en línea dedicada a la **bisutería**, pero con un toque especial. Nuestra plataforma permite a los clientes no solo comprar joyas hermosas ya disponibles, sino también **crear sus propios diseños personalizados**. Imagina poder diseñar ese collar, anillo o pulsera único que tienes en mente y poder adquirirlo tal cual lo soñaste.

Además, contamos con un detalle extra para ti: por cada compra **recibirás puntos para que puedas redimir en tus compras futuras**. Estos puntos equivaldrán al 5% del valor en COP de cada producto en tus pedidos, permitiendote acceder a: **descuentos, envío gratis o compra de productos con mismo valor en pesos de lo que tienes en puntos**, tú decides como te gustaría redimirlos.

## ✨ Características

*   <img src="https://cdn-icons-png.flaticon.com/512/1828/1828466.png" width="16" height="16"> **Compra Fácil:** Navega y compra entre una amplia variedad de bisutería ya diseñada.
*   <img src="https://cdn-icons-png.flaticon.com/512/4133/4133589.png" width="16" height="16"> **Diseño Personalizado:** Utiliza nuestra herramienta para crear joyas únicas según tus gustos.
*   <img src="https://cdn-icons-png.flaticon.com/512/18416/18416001.png" width="16" height="16"> **Seguimiento de Pedidos:** Mantente al tanto del estado de tus compras.
*   <img src="https://cdn-icons-png.flaticon.com/512/3685/3685453.png" width="16" height="16"> **Catálogo Variado:** Encuentra productos para todos los estilos.
*   <img src="https://cdn-icons-png.flaticon.com/512/4675/4675578.png" width="16" height="16"> **Programa de Fidelidad:** Gana puntos por tus compras y canjéalos por recompensas.
*   <img src="https://cdn-icons-png.flaticon.com/512/4675/4675542.png" width="16" height="16"> **Lista de Deseos:** Guarda tus productos favoritos para comprarlos más tarde.

## 🛠️ Tecnologías

Este proyecto está construido con tecnologías modernas: **FastAPI**, **SQLModel** y **PostgreSQL**, lo que garantiza una plataforma rápida, segura y escalable.

Así mismo está desplegado en **Render** y **Azure** utilizando contenerización con **Docker** y almacenamiento de bases de datos de información plana e imágenes en **Render** y **Supabase** respectivamente.

## 🚀 ¿Cómo funciona?

1. **Clientes:**
    * Explora nuestra colección de bisutería.
    * Utiliza la herramienta de diseño para crear tu joya personalizada.
    * Agrega productos a tu carrito y realiza tu compra de forma segura.
    * Sigue el estado de tu pedido y acumula puntos.
2. **Administradora:**
    * Gestiona la creación y soporte de productos en la plataforma.
    * Revisa de métricas para aseguramiento de calidad.
    * Realiza descuentos por temporada.

---

## Cómo usar en tu local 🚀

### Requisitos Previos
* Tener **Git** instalado y configurado en tu sistema.
* Tener **Python 3.13+** instalado.
* Tener **PostgreSQL** instalado.
* Tener **archivo .env** con tus credenciales de supabase y render:  
    Esto debe tener tu .env:
    ```bash
    DB_URL=tu url de db en render
    SUPABASE_URL=Tu url al bucket de supabase
    SUPABASE_KEY=Tu llave de supabase
    SUPABASE_BUCKET=imagenes (el nombre de tu bucket)
    ```
* Tener **Dockerfile** si deseas desplegar en Azure usando docker:  
    Esto debe tener tu dockerfile:
    ```bash
    FROM python:3.13-slim

    WORKDIR /app

    COPY requirements.txt .

    RUN pip install --no-cache-dir -r requirements.txt

    COPY . .

    EXPOSE 8000

    CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
    ```

### Pasos de Instalación y Ejecución

1.  **Clonar el repositorio:**
    Abre tu terminal y ejecuta el comando:
    ```bash
    git clone https://github.com/Josue-Ribero/meraki.git
    ```

2.  **Crear un entorno virtual:**
    El comando que debes ejecutar es:
    ```bash
    python3 -m venv entorno # En Mac/Linux
    python -m venv entorno # En Windows
    ```

3.  **Activar entorno virtual:**
    El comando que debes ejecutar es:
    ```bash
    source entorno/bin/activate # En Mac/Linux
    entorno\Scripts\activate # En Windows
    ```

4.  **Instalar dependencias** (El `requirements.txt` contiene `fastapi`, `uvicorn`, `sqlmodel`, etc.).
    El comando que debes ejecutar es:
    ```bash
    pip install -r requirements.txt
    ```


5.  **Ejecutar el servidor**:
    Este es el comando que debes usar para iniciar la aplicación:
    ```bash
    fastapi dev backend/main.py
    ```

6.  Accede a la página principal de la App: **http://127.0.0.1:8000/**

7.  Registro en Docker y Azure.

8.  Creación de un Azure Container Registry.

9.  **Creación de imagen docker (Opcional):**
    Los comandos que debes ejecutar son:
    1. Creación de la imagen de docker.
    ```bash
    docker build -t meraki-backend:latest .
    ```

    2. Taggueo de la imagen en el Azure Container Registry.
    ```bash
    docker tag meraki-backend:latest merakiacr.azurecr.io/meraki-backend:latest
    ```

    3. Subida de la imagen al Azure Container Registry listo para desplegar.
    ```bash
    docker push merakiacr.azurecr.io/meraki-backend:latest
    ```

10.  Creación de una App Web Azure con la imagen de Docker.

11.  Despliegue de la App Web.

---

## 🤝 ¿Quieres contribuir?

¡Toda contribución es bienvenida! Si tienes ideas, sugerencias o quieres ayudar con el código, no dudes en contactarnos o abrir un *issue* o *pull request*.

<div align="center">
  <sub>Hecho con ❤️ para amantes de la joyería y la creatividad.</sub>
</div>