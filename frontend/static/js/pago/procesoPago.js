function formatearMoneda(valor) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(valor);
}

function checkoutApp() {
  return {
    step: 'shipping',
    methods: ['Transferencia', 'Nequi', 'Daviplata', 'Efectivo', 'Puntos'],
    paymentMethod: '',
    puntos: 0,
    items: [],
    addresses: [],
    form: {
      nombre: '',
      calle: '',
      localidad: '',
      codigoPostal: '',
      esPredeterminada: false,
      direccionSeleccionada: null
    },
    editIndex: null,
    costoEnvio: 8900,
    subtotal: 0,
    totalConEnvio: 0,

    // Calcular subtotal y total con envío
    calcularTotales() {
      this.subtotal = this.items.reduce((acc, item) => acc + (item.price * item.qty), 0);
      // Aplicar envío si el subtotal es menor a 30,000
      const envio = this.subtotal < 30000 ? this.costoEnvio : 0;
      this.totalConEnvio = this.subtotal + envio;
    },

    async fetchCarrito() {
      try {
        const response = await fetch('/carrito/mi-carrito');
        if (!response.ok) throw new Error('No se pudo obtener el carrito');
        const data = await response.json();
        console.log('Respuesta carrito:', data);

        const itemsConProducto = await Promise.all(data.map(async item => {
          let producto = {
            nombre: 'Producto',
            imagen: 'https://via.placeholder.com/60',
            precio: 0
          };

          if (item.productoID) {
            try {
              const respProd = await fetch(`/productos/${item.productoID}`);
              if (respProd.ok) {
                const prodData = await respProd.json();
                producto.nombre = prodData.nombre || producto.nombre;
                producto.imagen = prodData.imagenURL || producto.imagen;
                producto.precio = prodData.precio || 0;
              }
            } catch (e) {
              console.error('Error al obtener producto', item.productoID, e);
            }
          }

          return {
            name: producto.nombre,
            qty: item.cantidad,
            price: item.precioUnidad || producto.precio,
            img: producto.imagen,
            subtotal: item.subtotal
          };
        }));

        this.items = itemsConProducto;
        this.calcularTotales();

      } catch (error) {
        console.error('Error al obtener el carrito:', error);
      }
    },

    saveAddress() {
      if (!this.form.nombre || !this.form.calle || !this.form.localidad || !this.form.codigoPostal) {
        alert('Por favor completa todos los campos de la dirección');
        return;
      }

      const formData = new FormData();
      formData.append('nombre', this.form.nombre);
      formData.append('calle', this.form.calle);
      formData.append('localidad', this.form.localidad);
      formData.append('codigoPostal', this.form.codigoPostal);
      formData.append('esPredeterminada', this.form.esPredeterminada.toString());

      fetch('/direcciones/crear', {
        method: 'POST',
        body: formData
      })
        .then(response => {
          if (!response.ok) throw new Error('No se pudo crear la dirección');
          return response.json();
        })
        .then(() => {
          return fetch('/direcciones/mis-direcciones');
        })
        .then(response => {
          if (!response.ok) throw new Error('No se pudo obtener las direcciones');
          return response.json();
        })
        .then(direcciones => {
          this.addresses = direcciones;
          this.resetForm();
          alert('Dirección guardada correctamente');
        })
        .catch(error => {
          console.error('Error al crear la dirección:', error);
          alert('Error al guardar la dirección: ' + error.message);
        });
    },

    editAddress(index) {
      this.editIndex = index;
      const address = this.addresses[index];
      this.form = {
        nombre: address.nombre,
        calle: address.calle,
        localidad: address.localidad,
        codigoPostal: address.codigoPostal,
        esPredeterminada: address.esPredeterminada,
        direccionSeleccionada: this.form.direccionSeleccionada
      };
    },

    deleteAddress(index) {
      if (confirm('¿Estás seguro de que quieres eliminar esta dirección?')) {
        const addressId = this.addresses[index].id;

        fetch(`/direcciones/eliminar/${addressId}`, {
          method: 'DELETE'
        })
          .then(response => {
            if (!response.ok) throw new Error('No se pudo eliminar la dirección');
            return response.json();
          })
          .then(() => {
            this.addresses.splice(index, 1);
            if (this.editIndex === index) this.resetForm();
            alert('Dirección eliminada correctamente');
          })
          .catch(error => {
            console.error('Error al eliminar dirección:', error);
            alert('Error al eliminar la dirección');
          });
      }
    },

    resetForm() {
      this.form = {
        nombre: '',
        calle: '',
        localidad: '',
        codigoPostal: '',
        esPredeterminada: false,
        direccionSeleccionada: this.form.direccionSeleccionada
      };
      this.editIndex = null;
    },

    init() {
      this.fetchCarrito();

      fetch('/direcciones/mis-direcciones')
        .then(response => {
          if (!response.ok) throw new Error('No se pudo obtener las direcciones');
          return response.json();
        })
        .then(direcciones => {
          this.addresses = direcciones;
          // Seleccionar automáticamente la dirección predeterminada si existe
          const predeterminada = direcciones.find(dir => dir.esPredeterminada);
          if (predeterminada) {
            this.form.direccionSeleccionada = predeterminada.id;
          }
        })
        .catch(error => {
          console.error('Error al obtener las direcciones:', error);
        });
    },

    crearPedido() {
      if (!this.form.direccionSeleccionada) {
        alert('Por favor selecciona una dirección de envío');
        return;
      }

      const formData = new FormData();
      formData.append('direccion', this.form.direccionSeleccionada);

      // Incluir información del envío en el pedido
      const envioAplicado = this.subtotal < 30000;
      formData.append('aplicarEnvio', envioAplicado.toString());

      fetch('/carrito/pedir', {
        method: 'POST',
        body: formData
      })
        .then(response => {
          if (!response.ok) throw new Error('No se pudo crear el pedido');
          return response.json();
        })
        .then(data => {
          alert('Pedido creado correctamente');
          // Redirigir a la página de detalles del pedido
          window.location.href = `/proceso-pago-detalles?pedidoId=${data.id}`;
        })
        .catch(error => {
          console.error('Error al crear el pedido:', error);
          alert('Error al crear el pedido: ' + error.message);
        });
    }
  };
}