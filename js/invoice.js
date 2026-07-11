(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);

  const text = (selector, value, fallback = '—') => {
    const element = $(selector);
    if (element) element.textContent = String(value || fallback);
  };

  const formatDateTime = iso => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('en-GB', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const fallbackMatrix = (container, source) => {
    container.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.width = 132;
    canvas.height = 132;
    const context = canvas.getContext('2d');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    let seed = [...source].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 2166136261);
    const size = 21;
    const cell = canvas.width / size;
    const isFinder = (x, y, ox, oy) => x >= ox && x < ox + 7 && y >= oy && y < oy + 7;
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const finder = isFinder(x,y,0,0) || isFinder(x,y,size-7,0) || isFinder(x,y,0,size-7);
        let dark;
        if (finder) {
          const localX = x < 7 ? x : x - (size - 7);
          const localY = y < 7 ? y : y - (size - 7);
          dark = localX === 0 || localY === 0 || localX === 6 || localY === 6 || (localX >= 2 && localX <= 4 && localY >= 2 && localY <= 4);
        } else {
          seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
          dark = (seed >>> 0) % 2 === 0;
        }
        if (dark) {
          context.fillStyle = '#111';
          context.fillRect(Math.floor(x * cell), Math.floor(y * cell), Math.ceil(cell), Math.ceil(cell));
        }
      }
    }
    container.appendChild(canvas);
  };

  const renderTrackingCodes = invoice => {
    const tracking = invoice.trackingNumber || invoice.invoiceNumber;
    const qrContainer = $('#qrCode');
    if (window.QRCode) {
      qrContainer.innerHTML = '';
      new window.QRCode(qrContainer, { text: tracking, width: 132, height: 132, correctLevel: window.QRCode.CorrectLevel?.M });
    } else fallbackMatrix(qrContainer, tracking);

    const barcode = $('#barcode');
    if (window.JsBarcode) {
      window.JsBarcode(barcode, tracking, { format: 'CODE128', displayValue: false, margin: 0, height: 48, width: 1.4 });
    } else {
      barcode.innerHTML = '';
      let x = 2;
      [...tracking].forEach((char, index) => {
        const count = (char.charCodeAt(0) + index) % 4 + 1;
        for (let i = 0; i < count; i += 1) {
          const width = ((char.charCodeAt(0) + i) % 3) + 1;
          const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          rect.setAttribute('x', String(x)); rect.setAttribute('y', '0'); rect.setAttribute('width', String(width)); rect.setAttribute('height', '48'); rect.setAttribute('fill', '#111');
          barcode.appendChild(rect); x += width + 2;
        }
      });
      barcode.setAttribute('viewBox', `0 0 ${Math.max(x, 180)} 48`);
    }
    text('#barcodeText', tracking);
  };

  const renderInvoice = invoice => {
    document.title = `${invoice.invoiceNumber} | ZenTriX CourierDesk`;
    const business = invoice.business || {};
    const sender = invoice.sender || {};
    const receiver = invoice.receiver || {};
    const parcel = invoice.package || {};
    const payment = invoice.payment || {};

    $('#invoicePaper').className = `invoice-paper template-${invoice.template || 'gold'}`;
    $('#invoiceLogo').src = business.logo || 'assets/company-logo.png';
    text('#companyName', business.companyName);
    text('#companyAddress', business.address);
    text('#companyPhone', business.phone, '');
    text('#companyEmail', business.email, '');
    text('#companyWebsite', business.website, '');

    text('#invoiceNumber', invoice.invoiceNumber);
    text('#trackingNumber', invoice.trackingNumber);
    text('#invoiceDate', formatDateTime(invoice.createdAt));
    text('#invoiceDeliveryStatus', parcel.deliveryStatus);

    text('#senderName', sender.name); text('#senderCompany', sender.company, ''); text('#senderAddress', sender.address); text('#senderPhone', sender.phone); text('#senderEmail', sender.email, '');
    text('#receiverName', receiver.name); text('#receiverCompany', receiver.company, ''); text('#receiverAddress', receiver.address); text('#receiverPhone', receiver.phone); text('#receiverEmail', receiver.email, '');

    text('#packageDescription', parcel.description);
    text('#packageWeight', `${Number(parcel.weight || 0).toFixed(2)} kg`);
    text('#packageQuantity', parcel.quantity);
    text('#packageReference', parcel.reference || '—');
    text('#deliveryType', parcel.deliveryType);

    text('#deliveryPrice', CourierStore.money(payment.price, payment.currency));
    text('#taxAmount', CourierStore.money(payment.tax, payment.currency));
    text('#grandTotal', CourierStore.money(payment.total, payment.currency));

    const isCod = payment.status === 'COD';
    $('#paymentBadge').textContent = isCod ? 'CASH ON DELIVERY' : 'PAYMENT COMPLETED';
    $('#paymentBadge').classList.toggle('cod', isCod);
    $('#codRow').classList.toggle('hidden', !isCod);
    if (isCod) text('#codAmount', CourierStore.money(payment.codAmount, payment.currency));
    text('#paymentMessage', isCod ? `Collect ${CourierStore.money(payment.codAmount, payment.currency)} from the receiver on delivery.` : 'Payment completed. No collection is required from the receiver.');
    text('#footerMessage', invoice.footer || CourierStore.getSettings().footer);
    renderTrackingCodes(invoice);
  };

  document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const invoice = CourierStore.getInvoice(params.get('id')) || CourierStore.getCurrentInvoice();
    if (!invoice) {
      $('#invoicePaper').classList.add('hidden');
      $('#invoiceNotFound').classList.remove('hidden');
      return;
    }
    renderInvoice(invoice);
    window.currentCourierInvoice = invoice;
    if (params.get('print') === '1') window.setTimeout(() => window.print(), 700);
  });
})();
