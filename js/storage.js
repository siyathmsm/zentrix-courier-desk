(() => {
  'use strict';

  const KEYS = {
    invoices: 'zentrix_courier_invoices_v1',
    settings: 'zentrix_courier_settings_v1',
    counter: 'zentrix_courier_counter_v1',
    current: 'zentrix_current_invoice_v1',
    theme: 'zentrix_courier_theme_v1'
  };

  const currencyMap = {
    LKR: { symbol: 'Rs.', locale: 'en-LK' },
    USD: { symbol: '$', locale: 'en-US' },
    EUR: { symbol: '€', locale: 'en-IE' },
    GBP: { symbol: '£', locale: 'en-GB' },
    INR: { symbol: '₹', locale: 'en-IN' }
  };

  const defaults = {
    companyName: 'ZenTriX Courier Services',
    phone: '+94 77 000 0000',
    email: 'hello@zentrix.lk',
    website: 'www.zentrix.lk',
    address: 'Colombo, Sri Lanka',
    logo: 'assets/company-logo.png',
    currency: 'LKR',
    template: 'gold',
    footer: 'We appreciate your business and trust. Please keep this invoice for delivery and payment reference.'
  };

  const parse = (value, fallback) => {
    try { return value ? JSON.parse(value) : fallback; }
    catch (_) { return fallback; }
  };

  const getInvoices = () => {
    const invoices = parse(localStorage.getItem(KEYS.invoices), []);
    return Array.isArray(invoices) ? invoices : [];
  };

  const saveInvoices = invoices => localStorage.setItem(KEYS.invoices, JSON.stringify(invoices));

  const getSettings = () => ({ ...defaults, ...parse(localStorage.getItem(KEYS.settings), {}) });

  const saveSettings = settings => {
    const merged = { ...getSettings(), ...settings };
    localStorage.setItem(KEYS.settings, JSON.stringify(merged));
    return merged;
  };

  const createId = () => {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    return `inv-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const nextInvoiceNumber = () => {
    const year = new Date().getFullYear();
    const state = parse(localStorage.getItem(KEYS.counter), { year, value: 0 });
    const value = state.year === year ? Number(state.value || 0) + 1 : 1;
    localStorage.setItem(KEYS.counter, JSON.stringify({ year, value }));
    return `CR-${year}-${String(value).padStart(4, '0')}`;
  };

  const createTrackingNumber = () => `TRK-${Math.floor(100000 + Math.random() * 900000)}`;

  const saveInvoice = invoice => {
    const invoices = getInvoices();
    const normalized = { ...invoice, id: invoice.id || createId() };
    const existingIndex = invoices.findIndex(item => item.id === normalized.id);
    if (existingIndex >= 0) invoices[existingIndex] = normalized;
    else invoices.unshift(normalized);
    saveInvoices(invoices);
    localStorage.setItem(KEYS.current, normalized.id);
    return normalized;
  };

  const getInvoice = id => getInvoices().find(item => item.id === id) || null;
  const getCurrentInvoice = () => getInvoice(localStorage.getItem(KEYS.current));

  const deleteInvoice = id => {
    const remaining = getInvoices().filter(item => item.id !== id);
    saveInvoices(remaining);
    if (localStorage.getItem(KEYS.current) === id) localStorage.removeItem(KEYS.current);
    return remaining;
  };

  const clearAll = () => Object.values(KEYS).forEach(key => localStorage.removeItem(key));

  const money = (amount, currency = 'LKR') => {
    const code = currencyMap[currency] ? currency : 'LKR';
    const value = Number(amount || 0);
    try {
      return new Intl.NumberFormat(currencyMap[code].locale, {
        style: 'currency', currency: code, minimumFractionDigits: 2, maximumFractionDigits: 2
      }).format(value);
    } catch (_) {
      return `${currencyMap[code].symbol} ${value.toFixed(2)}`;
    }
  };

  const getStats = () => {
    const invoices = getInvoices();
    return invoices.reduce((stats, invoice) => {
      stats.count += 1;
      stats.revenue += Number(invoice.payment?.total || 0);
      if (invoice.payment?.status === 'COD') stats.cod += Number(invoice.payment?.codAmount || 0);
      if (invoice.payment?.status === 'Paid') stats.paid += 1;
      return stats;
    }, { count: 0, revenue: 0, cod: 0, paid: 0 });
  };

  window.CourierStore = {
    KEYS, defaults, currencyMap, getInvoices, getSettings, saveSettings,
    nextInvoiceNumber, createTrackingNumber, saveInvoice, getInvoice,
    getCurrentInvoice, deleteInvoice, clearAll, money, getStats
  };
})();
