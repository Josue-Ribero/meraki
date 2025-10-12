function checkoutApp() {
  return {
    step: 'shipping',
    methods: ['Transferencia', 'Nequi', 'Daviplata', 'Efectivo', 'Puntos'],
    paymentMethod: '',
    puntos: 0,
    items: [
      { name: 'Pendientes de Aro "Amanecer"', qty: 1, price: 65, img: 'https://via.placeholder.com/60' },
      { name: 'Collar "Solsticio"', qty: 1, price: 120, img: 'https://via.placeholder.com/60' }
    ],
    addresses: [],
    // Ciudad fija
    form: { name: '', street: '', city: 'Bogotá D.C', postal: '', default: false },
    editIndex: null,
    saveAddress() {
      if (this.editIndex === null) {
        if (this.form.default) this.addresses.forEach(a => a.default = false);
        this.addresses.push({ ...this.form });
      } else {
        if (this.form.default) this.addresses.forEach(a => a.default = false);
        this.addresses[this.editIndex] = { ...this.form };
      }
      this.resetForm();
    },
    editAddress(index) {
      this.editIndex = index;
      this.form = { ...this.addresses[index] };
    },
    deleteAddress(index) {
      this.addresses.splice(index, 1);
      if (this.editIndex === index) this.resetForm();
    },
    resetForm() {
      // Ciudad siempre fija
      this.form = { name: '', street: '', city: 'Bogotá D.C', postal: '', default: false };
      this.editIndex = null;
    }
  };
}