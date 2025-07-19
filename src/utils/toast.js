const notyf = new Notyf({
  duration: 3000,
  position: {
    x: 'right',
    y: 'top'
  },
  types: [
    {
      type: 'info',
      background: '#007bff',
      icon: false
    },
    {
      type: 'warning',
      background: 'orange',
      icon: {
        className: 'material-icons',
        tagName: 'i',
        text: 'warning'
      }
    },
    {
      type: 'success',
      background: '#28a745',
      icon: false
    }
  ]
});
export function showToast(message, type = 'info') {
  notyf.open({
    type,
    message
  });
}
