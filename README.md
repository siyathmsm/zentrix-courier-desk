# ZenTriX Courier Invoice System

A responsive, browser-based courier invoice generator built with HTML5, CSS3, and Vanilla JavaScript.

## Run

Open `index.html` in a modern browser. For the best experience, serve the folder with a simple local server:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Features

- Courier invoice creation and validation
- Sender, receiver, package, delivery and payment details
- Automatic invoice and tracking numbers
- Business logo upload stored in browser storage
- A4 invoice preview and print layout
- Invoice history, search, filters, view, print and delete
- Revenue and payment statistics
- Dark/light mode
- Company settings, currency and invoice template selection
- QR code, barcode and PDF buttons with graceful offline fallbacks

## Browser Storage

All data is stored in `localStorage` on the current browser/device. Clearing browser site data will remove saved invoices and settings.

## Optional CDN helpers

The invoice preview attempts to load small client-side libraries from jsDelivr for QR, barcode and direct PDF export. If they are unavailable, the invoice remains fully usable and the PDF button opens the browser print dialog, where **Save as PDF** can be selected.
