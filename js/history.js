(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const escapeHTML = value => window.CourierUI.escapeHTML(value);

  let query = '';
  let payment = 'all';

  const formatDate = iso => {
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getFilteredInvoices = () => CourierStore.getInvoices().filter(invoice => {
    const haystack = [invoice.invoiceNumber, invoice.receiver?.name, invoice.receiver?.company, formatDate(invoice.createdAt), invoice.trackingNumber].join(' ').toLowerCase();
    const matchesQuery = haystack.includes(query.toLowerCase());
    const matchesPayment = payment === 'all' || invoice.payment?.status === payment;
    return matchesQuery && matchesPayment;
  });

  const render = () => {
    const tbody = $('#invoiceTableBody');
    if (!tbody) return;
    const invoices = getFilteredInvoices();
    $('#recordCount').textContent = `${invoices.length} record${invoices.length === 1 ? '' : 's'}`;
    $('#emptyState').classList.toggle('hidden', invoices.length > 0);
    $('.table-wrap').classList.toggle('hidden', invoices.length === 0);

    tbody.innerHTML = invoices.map(invoice => {
      const currency = invoice.payment?.currency || 'LKR';
      return `<tr>
        <td><a class="invoice-number-link" href="invoice.html?id=${encodeURIComponent(invoice.id)}">${escapeHTML(invoice.invoiceNumber)}</a><br><small>${escapeHTML(invoice.trackingNumber)}</small></td>
        <td class="customer-cell"><strong>${escapeHTML(invoice.receiver?.name)}</strong><small>${escapeHTML(invoice.receiver?.phone)}</small></td>
        <td><strong>${escapeHTML(CourierStore.money(invoice.payment?.total, currency))}</strong></td>
        <td><span class="status-pill ${invoice.payment?.status === 'Paid' ? 'status-paid' : 'status-cod'}">${escapeHTML(invoice.payment?.status)}</span></td>
        <td>${escapeHTML(formatDate(invoice.createdAt))}</td>
        <td><div class="action-buttons">
          <a class="table-action" title="View" href="invoice.html?id=${encodeURIComponent(invoice.id)}">↗</a>
          <a class="table-action" title="Print" href="invoice.html?id=${encodeURIComponent(invoice.id)}&print=1">⌁</a>
          <button class="table-action danger" title="Delete" data-delete-id="${escapeHTML(invoice.id)}">×</button>
        </div></td>
      </tr>`;
    }).join('');

    tbody.querySelectorAll('[data-delete-id]').forEach(button => button.addEventListener('click', () => {
      const invoice = CourierStore.getInvoice(button.dataset.deleteId);
      if (!invoice) return;
      if (window.confirm(`Delete ${invoice.invoiceNumber}? This action cannot be undone.`)) {
        CourierStore.deleteInvoice(invoice.id);
        window.CourierUI.refreshStats();
        window.CourierUI.showToast('Invoice deleted', `${invoice.invoiceNumber} was removed.`);
        render();
      }
    }));
  };

  document.addEventListener('DOMContentLoaded', () => {
    $('#historySearch')?.addEventListener('input', event => { query = event.target.value.trim(); render(); });
    $('#paymentFilter')?.addEventListener('change', event => { payment = event.target.value; render(); });
    render();
  });
})();
