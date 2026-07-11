(() => {
  'use strict';

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

  const escapeHTML = value => String(value ?? '').replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[char]);

  const showToast = (title, message = '', type = 'success') => {
    const region = $('#toastRegion');
    if (!region) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${type === 'success' ? '✓' : '!'}</span><div><strong>${escapeHTML(title)}</strong><p>${escapeHTML(message)}</p></div>`;
    region.appendChild(toast);
    window.setTimeout(() => {
      toast.classList.add('removing');
      window.setTimeout(() => toast.remove(), 260);
    }, 3300);
  };

  const setTheme = theme => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(CourierStore.KEYS.theme, theme);
    const button = $('#themeToggle');
    if (button) button.textContent = theme === 'dark' ? '☀' : '☾';
  };

  const initTheme = () => {
    const saved = localStorage.getItem(CourierStore.KEYS.theme);
    const preferred = window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    setTheme(saved || preferred);
    $('#themeToggle')?.addEventListener('click', () => {
      setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
    });
  };

  const initNavigation = () => {
    const sidebar = $('#sidebar');
    const overlay = $('#sidebarOverlay');
    const close = () => { sidebar?.classList.remove('open'); overlay?.classList.remove('open'); };
    $('#menuButton')?.addEventListener('click', () => { sidebar?.classList.toggle('open'); overlay?.classList.toggle('open'); });
    overlay?.addEventListener('click', close);
    $$('.nav-link').forEach(link => link.addEventListener('click', close));
  };

  const refreshStats = () => {
    const stats = CourierStore.getStats();
    const currency = CourierStore.getSettings().currency;
    if ($('#statInvoices')) $('#statInvoices').textContent = stats.count;
    if ($('#statRevenue')) $('#statRevenue').textContent = CourierStore.money(stats.revenue, currency);
    if ($('#statCod')) $('#statCod').textContent = CourierStore.money(stats.cod, currency);
    if ($('#statPaid')) $('#statPaid').textContent = stats.paid;
  };

  const readImage = (file, callback) => {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/i.test(file.type)) {
      showToast('Unsupported image', 'Use a PNG, JPG or WEBP file.', 'error');
      return;
    }
    if (file.size > 1_400_000) {
      showToast('Image is too large', 'Please upload a logo smaller than 1.4 MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => callback(String(reader.result));
    reader.onerror = () => showToast('Upload failed', 'The selected logo could not be read.', 'error');
    reader.readAsDataURL(file);
  };

  const fieldValue = id => $(`#${id}`)?.value.trim() || '';
  const numberValue = id => Number($(`#${id}`)?.value || 0);

  const clearErrors = form => {
    $$('.invalid', form).forEach(el => el.classList.remove('invalid'));
    $$('.error-text', form).forEach(el => el.remove());
  };

  const showFieldError = (field, message) => {
    field.classList.add('invalid');
    const error = document.createElement('span');
    error.className = 'error-text';
    error.textContent = message;
    field.parentElement.appendChild(error);
  };

  const validateCreateForm = form => {
    clearErrors(form);
    let valid = true;
    $$('[required]', form).forEach(field => {
      if (field.type === 'radio') return;
      if (!String(field.value).trim()) { showFieldError(field, 'This field is required.'); valid = false; }
    });

    const phonePattern = /^[+]?\d[\d\s().-]{6,18}$/;
    ['courierPhone', 'senderPhone', 'receiverPhone'].forEach(id => {
      const field = $(`#${id}`);
      if (field?.value && !phonePattern.test(field.value.trim())) { showFieldError(field, 'Enter a valid phone number.'); valid = false; }
    });

    ['courierEmail', 'senderEmail', 'receiverEmail'].forEach(id => {
      const field = $(`#${id}`);
      if (field?.value && !field.validity.valid) { showFieldError(field, 'Enter a valid email address.'); valid = false; }
    });

    const weight = $('#packageWeight');
    if (weight?.value && Number(weight.value) <= 0) { showFieldError(weight, 'Weight must be greater than zero.'); valid = false; }
    const quantity = $('#quantity');
    if (quantity?.value && Number(quantity.value) < 1) { showFieldError(quantity, 'Quantity must be at least 1.'); valid = false; }
    const price = $('#deliveryPrice');
    if (price?.value && Number(price.value) < 0) { showFieldError(price, 'Price cannot be negative.'); valid = false; }

    const payment = $('input[name="paymentStatus"]:checked', form);
    if (!payment) { showToast('Payment status required', 'Choose Paid or Cash on Delivery.', 'error'); valid = false; }
    if (payment?.value === 'COD') {
      const cod = $('#codAmount');
      if (!cod.value || Number(cod.value) <= 0) { showFieldError(cod, 'Enter the COD amount to collect.'); valid = false; }
    }

    if (!valid) {
      form.querySelector('.invalid')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showToast('Please check the form', 'Correct the highlighted fields before generating the invoice.', 'error');
    }
    return valid;
  };

  const populateBusinessFields = () => {
    const settings = CourierStore.getSettings();
    const map = {
      courierCompany: settings.companyName,
      courierPhone: settings.phone,
      courierEmail: settings.email,
      courierWebsite: settings.website,
      courierAddress: settings.address,
      currency: settings.currency
    };
    Object.entries(map).forEach(([id, value]) => { if ($(`#${id}`)) $(`#${id}`).value = value || ''; });
    if ($('#logoPreview')) $('#logoPreview').src = settings.logo || 'assets/company-logo.png';
  };

  const initCreatePage = () => {
    const form = $('#invoiceForm');
    if (!form) return;
    populateBusinessFields();
    let uploadedLogo = CourierStore.getSettings().logo;

    $('#businessLogo')?.addEventListener('change', event => readImage(event.target.files[0], dataUrl => {
      uploadedLogo = dataUrl;
      $('#logoPreview').src = dataUrl;
      showToast('Logo ready', 'The logo will appear on the generated invoice.');
    }));

    $$('input[name="paymentStatus"]').forEach(input => input.addEventListener('change', () => {
      const isCod = input.value === 'COD' && input.checked;
      $('#codField').classList.toggle('hidden', !isCod);
      $('#codAmount').required = isCod;
      if (isCod && !$('#codAmount').value) $('#codAmount').value = $('#deliveryPrice').value || '';
    }));

    $('#deliveryPrice')?.addEventListener('input', () => {
      if ($('input[name="paymentStatus"]:checked')?.value === 'COD' && !$('#codAmount').dataset.edited) {
        $('#codAmount').value = $('#deliveryPrice').value;
      }
    });
    $('#codAmount')?.addEventListener('input', () => { $('#codAmount').dataset.edited = 'true'; });

    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!validateCreateForm(form)) return;

      const now = new Date();
      const paymentStatus = $('input[name="paymentStatus"]:checked').value;
      const price = numberValue('deliveryPrice');
      const tax = numberValue('taxAmount');
      const settings = CourierStore.saveSettings({
        companyName: fieldValue('courierCompany'), phone: fieldValue('courierPhone'),
        email: fieldValue('courierEmail'), website: fieldValue('courierWebsite'),
        address: fieldValue('courierAddress'), logo: uploadedLogo || 'assets/company-logo.png',
        currency: $('#currency').value
      });

      const invoice = CourierStore.saveInvoice({
        invoiceNumber: CourierStore.nextInvoiceNumber(),
        trackingNumber: CourierStore.createTrackingNumber(),
        createdAt: now.toISOString(),
        business: {
          companyName: fieldValue('courierCompany'), phone: fieldValue('courierPhone'),
          email: fieldValue('courierEmail'), website: fieldValue('courierWebsite'),
          address: fieldValue('courierAddress'), logo: uploadedLogo || settings.logo
        },
        sender: { name: fieldValue('senderName'), company: fieldValue('senderCompany'), address: fieldValue('senderAddress'), phone: fieldValue('senderPhone'), email: fieldValue('senderEmail') },
        receiver: { name: fieldValue('receiverName'), company: fieldValue('receiverCompany'), address: fieldValue('receiverAddress'), phone: fieldValue('receiverPhone'), email: fieldValue('receiverEmail') },
        package: {
          description: fieldValue('packageDescription'), weight: numberValue('packageWeight'),
          quantity: numberValue('quantity'), deliveryType: $('#deliveryType').value,
          deliveryStatus: $('#deliveryStatus').value, reference: fieldValue('reference')
        },
        payment: {
          currency: $('#currency').value, price, tax, total: price + tax,
          status: paymentStatus, codAmount: paymentStatus === 'COD' ? numberValue('codAmount') : 0
        },
        template: settings.template,
        footer: settings.footer
      });

      refreshStats();
      showToast('Invoice created', `${invoice.invoiceNumber} was saved successfully.`);
      window.setTimeout(() => { window.location.href = `invoice.html?id=${encodeURIComponent(invoice.id)}`; }, 650);
    });

    $('#resetButton')?.addEventListener('click', () => window.setTimeout(() => {
      uploadedLogo = CourierStore.getSettings().logo;
      populateBusinessFields();
      $('#codField').classList.add('hidden');
      clearErrors(form);
    }, 0));
  };

  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNavigation();
    refreshStats();
    initCreatePage();
    window.setTimeout(() => $('#pageLoader')?.classList.add('loaded'), 280);
  });

  window.CourierUI = { showToast, escapeHTML, refreshStats, readImage, setTheme };
})();
