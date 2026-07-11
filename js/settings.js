(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  let logoData = '';

  const setActiveTemplate = template => {
    document.querySelectorAll('.template-preview').forEach(button => button.classList.toggle('active', button.dataset.template === template));
    $('#settingsTemplate').value = template;
  };

  const populate = () => {
    const settings = CourierStore.getSettings();
    logoData = settings.logo;
    $('#settingsLogoPreview').src = settings.logo;
    $('#settingsCompanyName').value = settings.companyName;
    $('#settingsPhone').value = settings.phone;
    $('#settingsEmail').value = settings.email;
    $('#settingsWebsite').value = settings.website;
    $('#settingsAddress').value = settings.address;
    $('#settingsCurrency').value = settings.currency;
    $('#settingsTemplate').value = settings.template;
    $('#settingsFooter').value = settings.footer;
    setActiveTemplate(settings.template);
  };

  document.addEventListener('DOMContentLoaded', () => {
    populate();
    $('#settingsLogo')?.addEventListener('change', event => CourierUI.readImage(event.target.files[0], dataUrl => {
      logoData = dataUrl;
      $('#settingsLogoPreview').src = dataUrl;
      CourierUI.showToast('Logo ready', 'Save settings to apply it to new invoices.');
    }));
    document.querySelectorAll('.template-preview').forEach(button => button.addEventListener('click', () => setActiveTemplate(button.dataset.template)));
    $('#settingsTemplate')?.addEventListener('change', event => setActiveTemplate(event.target.value));

    $('#settingsForm')?.addEventListener('submit', event => {
      event.preventDefault();
      if (!event.currentTarget.reportValidity()) return;
      CourierStore.saveSettings({
        companyName: $('#settingsCompanyName').value.trim(), phone: $('#settingsPhone').value.trim(),
        email: $('#settingsEmail').value.trim(), website: $('#settingsWebsite').value.trim(),
        address: $('#settingsAddress').value.trim(), logo: logoData || 'assets/company-logo.png',
        currency: $('#settingsCurrency').value, template: $('#settingsTemplate').value,
        footer: $('#settingsFooter').value.trim()
      });
      CourierUI.showToast('Settings saved', 'New invoices will use the updated company profile.');
    });

    $('#resetDataButton')?.addEventListener('click', () => {
      if (!window.confirm('Reset all app data? This will delete every saved invoice and setting.')) return;
      CourierStore.clearAll();
      populate();
      CourierUI.refreshStats();
      CourierUI.showToast('App data reset', 'All local invoices and settings were removed.');
    });
  });
})();
