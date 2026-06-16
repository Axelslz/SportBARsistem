import LOGO_BAR from '../assets/Logo.png'; 

const convertImageToBase64 = async (url) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error cargando logo:", error);
    return null; 
  }
};

const getTicketHTML = (logoBase64, saleData, customerInfo, copyLabel) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  };

  const clientName = customerInfo?.name || "PÚBLICO EN GENERAL";
  const clientAddress = customerInfo?.address || "CONSUMO LOCAL";
  const paymentType = saleData.paymentMethod || "EFECTIVO";
  const sellerName = saleData.seller || "BARRA"; 
  const folioDisplay = saleData.ticketNumber ? `${saleData.ticketNumber}` : `F-${saleData.id || '---'}`;
  
  const isSplit = saleData.isSplit || false;
  const splitTotal = saleData.splitTotal || saleData.total;

  const tipAmount = saleData.tip ? parseFloat(saleData.tip) : 0;
  const grandTotal = isSplit ? (splitTotal + tipAmount) : (saleData.total + tipAmount);
  
  const amountPaidDisplay = saleData.amountPaid !== undefined ? formatCurrency(saleData.amountPaid) : formatCurrency(grandTotal);
  const changeDisplay = saleData.change !== undefined ? formatCurrency(saleData.change) : formatCurrency(0);
  const isPreAccount = copyLabel === "PRE-CUENTA";
  const baseAmountForTip = isSplit ? splitTotal : saleData.total;
  
  let preAccountTipAmount = 0;
  let preAccountTipLabel = "";

  if (tipAmount > 0) {
    preAccountTipAmount = tipAmount;
    preAccountTipLabel = "PROPINA SELECCIONADA:";
  } else {
    preAccountTipAmount = baseAmountForTip * 0.10;
    preAccountTipLabel = "PROPINA OPCIONAL (10%):";
  }
  
  const totalWithPreAccountTip = baseAmountForTip + preAccountTipAmount;

  return `
    <html>
      <head>
        <title>Ticket Cazadores Sport Bar</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          @page { size: 80mm auto; margin: 0mm; }
          body { 
            font-family: 'Arial', sans-serif; font-size: 11px; width: 74mm; 
            margin: 0 auto; padding: 2mm; color: black; 
            text-transform: uppercase; line-height: 1.2; background-color: #fff; 
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .header { margin-bottom: 5px; width: 100%; }
          .logo-img { width: 80px; height: auto; display: block; margin: 0 auto 5px auto; filter: grayscale(100%); }
          .title { font-size: 14px; font-weight: 900; margin: 2px 0; }
          .address-shop { font-size: 9px; margin-bottom: 5px;}
          .divider-double { border-top: 1px double #000; border-bottom: 1px solid #000; height: 3px; margin: 5px 0; }
          .divider-dashed { border-top: 1px dashed #000; margin: 5px 0; }
          .client-info { margin: 8px 0; font-size: 11px; text-align: center; }
          .client-details { font-weight: bold; font-size: 12px; display: block; margin-top: 2px;}
          .folio-row { display: flex; justify-content: space-between; margin: 5px 0; font-size: 12px; }
          .meta-info { font-size: 9px; margin-bottom: 5px; display: flex; justify-content: space-between; }
          table { width: 100%; border-collapse: collapse; margin-top: 5px; table-layout: fixed; }
          th { border-top: 1px solid #000; border-bottom: 1px solid #000; font-size: 9px; padding: 2px 0; text-align: left;}
          td { padding: 4px 0 2px 0; vertical-align: top; font-size: 10px; border-bottom: 1px dotted #ccc; }
          tr:last-child td { border-bottom: none; }
          .col-qty { width: 15%; text-align: center; font-weight: bold; font-size: 11px; }
          .col-desc { width: 55%; text-align: left; padding-right: 2px; white-space: normal; overflow-wrap: break-word; }
          .col-price { width: 30%; text-align: right; font-weight: bold; font-size: 11px; }
          .unit-price { display: block; font-size: 9px; font-weight: normal; color: #333; margin-top: 2px; }
          .total-section { text-align: right; margin-top: 10px; border-top: 1px solid #000; padding-top: 5px;}
          .total-amount { font-size: 15px; font-weight: 900; margin-top: 3px; }
          .payment-details { font-size: 10px; font-weight: bold; margin-top: 4px; }
          .footer { margin-top: 15px; font-size: 11px; }
          .copy-label { font-size: 12px; font-weight: bold; margin-bottom: 5px; }
        </style>
      </head>
      <body>
        <div class="header center">
          ${logoBase64 ? `<img src="${logoBase64}" class="logo-img" />` : ''}
          <div class="title">CAZADORES SPORT BAR</div>
          <div class="address-shop">Rosario Sabinal 60, Terán<br>29057 Tuxtla Gutiérrez, Chis.</div>
        </div>
        
        <div class="divider-double"></div>
        <div class="copy-label center">*** ${copyLabel} ***</div>
        
        <div class="client-info center">
          MESA / DETALLE:
          <span class="client-details">${clientName}</span>
          <span style="font-size: 10px;">${clientAddress}</span>
        </div>
        
        <div class="divider-dashed"></div>
        
        <div class="folio-row bold">
          <span>NOTA</span>
          <span>FOLIO: ${folioDisplay}</span>
        </div>
        
        <div class="meta-info">
          <span>${new Date(saleData.date).toLocaleDateString('es-MX')} ${new Date(saleData.date).toLocaleTimeString('es-MX', {hour: '2-digit', minute:'2-digit'})}</span>
          <span>ATENDIÓ: ${sellerName}</span>
        </div>
        
        <table>
          <thead>
            <tr>
              <th class="col-qty">CANT</th>
              <th class="col-desc">PRODUCTO</th>
              <th class="col-price">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${saleData.items.map(item => `
              <tr>
                <td class="col-qty">${item.quantity}</td>
                <td class="col-desc">
                  ${item.name}
                  <span class="unit-price">${formatCurrency(item.price)} c/u</span>
                </td>
                <td class="col-price">${formatCurrency(item.price * item.quantity)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="total-section">
          ${isPreAccount ? `
            ${isSplit ? `
              <div style="font-size: 11px; font-weight: bold; color: #555;">TOTAL ENTERO MESA: ${formatCurrency(saleData.total)}</div>
              <div class="total-amount" style="font-size: 13px; margin-top: 4px; border-top: 1px dashed #ccc; padding-top: 4px;">TOTAL DIVIDIDO: ${formatCurrency(splitTotal)}</div>
              <div style="font-size: 11px; font-weight: bold; margin-top: 6px;">${preAccountTipLabel} ${formatCurrency(preAccountTipAmount)}</div>
              <div class="total-amount" style="font-size: 16px; margin-top: 2px; color: #000;">TOTAL CON PROPINA: ${formatCurrency(totalWithPreAccountTip)}</div>
            ` : `
              <div class="total-amount" style="font-size: 14px;">TOTAL MESA: ${formatCurrency(saleData.total)}</div>
              <div style="font-size: 12px; font-weight: bold; margin-top: 8px;">${preAccountTipLabel} ${formatCurrency(preAccountTipAmount)}</div>
              <div class="total-amount" style="font-size: 16px; margin-top: 2px;">TOTAL CON PROPINA: ${formatCurrency(totalWithPreAccountTip)}</div>
            `}
            <div class="payment-details center" style="margin-top: 12px; border-top: 1px dashed #ccc; padding-top: 5px;">ESTE DOCUMENTO NO ES UN COMPROBANTE DE PAGO</div>
          ` : `
            ${isSplit ? `
              <div style="font-size: 11px; font-weight: bold; color: #555;">TOTAL ENTERO MESA: ${formatCurrency(saleData.total)}</div>
              <div class="total-amount" style="font-size: 13px; margin-top: 4px; border-top: 1px dashed #ccc; padding-top: 4px;">TOTAL DIVIDIDO: ${formatCurrency(splitTotal)}</div>
              ${tipAmount > 0 ? `<div style="font-size: 11px; font-weight: bold; margin-top: 4px;">PROPINA OPCIONAL: ${formatCurrency(tipAmount)}</div>` : ''}
              <div class="total-amount" style="font-size: 16px; margin-top: 2px;">TOTAL PAGADO: ${formatCurrency(grandTotal)}</div>
            ` : `
              ${tipAmount > 0 ? `
                <div style="font-size: 12px; font-weight: bold;">CONSUMO: ${formatCurrency(saleData.total)}</div>
                <div style="font-size: 12px; font-weight: bold;">PROPINA: ${formatCurrency(tipAmount)}</div>
              ` : ''}
              <div class="total-amount">TOTAL: ${formatCurrency(grandTotal)}</div>
            `}
            <div class="payment-details">MÉTODO: ${paymentType}</div>
            <div class="payment-details">PAGÓ CON: ${amountPaidDisplay}</div>
            <div class="payment-details">CAMBIO: ${changeDisplay}</div>
          `}
        </div>
        
        <div class="footer center bold">
          <div style="margin-bottom: 5px;">*** GRACIAS POR SU VISITA ***</div>
        </div>
      </body>
    </html>
  `;
};

const triggerPrintJob = (htmlContent) => {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    iframe.onload = function() {
        try {
            iframe.contentWindow.focus();
            iframe.contentWindow.print(); 
        } catch (e) {
            console.error("Error al imprimir:", e);
        }
        setTimeout(() => {
            document.body.removeChild(iframe);
            resolve();
        }, 500);
    };
  });
};

export const printTicket = async (saleData, customerInfo) => {
  const logoBase64 = await convertImageToBase64(LOGO_BAR);
  const htmlCliente = getTicketHTML(logoBase64, saleData, customerInfo, "TICKET DE CONSUMO");
  await triggerPrintJob(htmlCliente);
};

export const printPreAccount = async (saleData, customerInfo) => {
  const logoBase64 = await convertImageToBase64(LOGO_BAR);
  const htmlPre = getTicketHTML(logoBase64, saleData, customerInfo, "PRE-CUENTA");
  await triggerPrintJob(htmlPre);
};

export const printCashDrawerClosing = async (totalsData, username = "CAJERO") => {
  const logoBase64 = await convertImageToBase64(LOGO_BAR);
  const formatCurrency = (amount) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  const fondo = parseFloat(totalsData.initialCash) || 0;
  const efectivo = parseFloat(totalsData.efectivo) || 0;
  const tarjeta = parseFloat(totalsData.tarjeta) || 0;
  const transferencia = parseFloat(totalsData.transferencia) || 0;
  const propinas = parseFloat(totalsData.totalPropinas) || 0;
  const consumos = parseFloat(totalsData.totalConsumo) || 0;

  const totalVentas = efectivo + tarjeta + transferencia;
  const granTotalConFondo = fondo + totalVentas; 

  const htmlContent = `
    <html>
      <head>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          @page { size: 80mm auto; margin: 0mm; }
          body { font-family: 'Arial', sans-serif; font-size: 12px; width: 74mm; margin: 0 auto; padding: 2mm; color: black; text-transform: uppercase; line-height: 1.4; background-color: #fff; }
          .center { text-align: center; }
          .logo-img { width: 80px; height: auto; display: block; margin: 0 auto 5px auto; filter: grayscale(100%); }
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
          .divider-bold { border-top: 2px solid #000; margin: 10px 0; }
          .bold { font-weight: bold; }
          .row { display: flex; justify-content: space-between; margin-bottom: 3px; }
        </style>
      </head>
      <body>
        <div class="center">
          ${logoBase64 ? `<img src="${logoBase64}" class="logo-img" />` : ''}
          <h2 style="margin: 0;">CAZADORES SPORT BAR</h2>
          <h3 style="margin: 5px 0;">*** CORTE DE CAJA ***</h3>
          <p style="font-size: 10px;">FECHA: ${new Date().toLocaleString('es-MX')}</p>
          <p style="font-size: 10px;">REALIZADO POR: ${username}</p>
        </div>
        
        <div class="divider"></div>
        
        <div class="row bold" style="font-size: 14px;">
          <span>FONDO INICIAL:</span>
          <span>${formatCurrency(fondo)}</span>
        </div>
        
        <div class="divider"></div>
        
        <div class="bold" style="margin-bottom: 5px;">INGRESOS EN TURNOS:</div>
        <div class="row">
          <span>EFECTIVO:</span>
          <span>${formatCurrency(efectivo)}</span>
        </div>
        <div class="row">
          <span>TARJETA:</span>
          <span>${formatCurrency(tarjeta)}</span>
        </div>
        <div class="row">
          <span>TRANSFERENCIA:</span>
          <span>${formatCurrency(transferencia)}</span>
        </div>

        <div class="divider-bold"></div>
        
        <div class="row bold" style="font-size: 16px;">
          <span>GRAN TOTAL (CON FONDO):</span>
          <span>${formatCurrency(granTotalConFondo)}</span>
        </div>

        <div class="divider-bold"></div>
        
        <div class="row bold" style="font-size: 13px; color: #333;">
          <span>TOTAL PROPINAS:</span>
          <span>${formatCurrency(propinas)}</span>
        </div>
        <div class="row bold" style="font-size: 13px;">
          <span>TOTAL CONSUMOS (SIN PROP):</span>
          <span>${formatCurrency(consumos)}</span>
        </div>
        
        <div class="divider-bold"></div>
        
        <div class="center" style="margin-top: 15px; padding: 10px; border: 1px dashed #000;">
          <div style="font-size: 12px; margin-bottom: 5px; font-weight: bold;">EFECTIVO ESPERADO EN CAJÓN:</div>
          <div style="font-size: 22px; font-weight: 900;">${formatCurrency(fondo + efectivo)}</div>
          <div style="font-size: 9px; margin-top: 2px;">(Fondo Inicial + Ingresos en Efectivo)</div>
        </div>
        
        <br/><br/><br/>
        <div class="center">
          <p>___________________________________</p>
          <p style="font-size: 10px; margin-top: 3px;">FIRMA ENCARGADO / CAJERO</p>
        </div>
      </body>
    </html>
  `;
  await triggerPrintJob(htmlContent);
};

export const generateTicketHTML = async (saleData, customerInfo) => {
  const logoBase64 = await convertImageToBase64(LOGO_BAR);
  return getTicketHTML(logoBase64, saleData, customerInfo, "VISTA PREVIA");
};