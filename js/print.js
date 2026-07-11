(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);

  document.addEventListener('DOMContentLoaded', () => {
    $('#printInvoiceButton')?.addEventListener('click', () => window.print());
    $('#downloadPdfButton')?.addEventListener('click', async () => {
      const invoice = window.currentCourierInvoice;
      const paper = $('#invoicePaper');
      if (!invoice || !paper) return;
      if (typeof window.html2pdf === 'function') {
        const button = $('#downloadPdfButton');
        const original = button.textContent;
        button.disabled = true;
        button.textContent = 'Preparing PDF…';
        try {
          await window.html2pdf().set({
            margin: 0,
            filename: `${invoice.invoiceNumber}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all'] }
          }).from(paper).save();
          window.CourierUI.showToast('PDF downloaded', `${invoice.invoiceNumber}.pdf is ready.`);
        } catch (error) {
          window.CourierUI.showToast('PDF export unavailable', 'Opening print dialog. Choose Save as PDF.', 'error');
          window.print();
        } finally {
          button.disabled = false;
          button.textContent = original;
        }
      } else {
        window.CourierUI.showToast('Use browser PDF', 'Choose Save as PDF in the print dialog.');
        window.print();
      }
    });
  });
})();
