import nodemailer from 'nodemailer';

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
    }
});

export interface OrderDetailsParams {
    to: string;
    customerName: string;
    orderId: string;
    productName: string;
    quantity: number;
    totalPrice: number;
    address?: {
        houseBuilding?: string | null;
        town?: string | null;
        post?: string | null;
        city?: string | null;
        district?: string | null;
        state?: string | null;
        pincode?: string | null;
    };
    customerAddress?: string;
    paymentMethod: string;
}

export async function sendCustomOrderConfirmation(params: OrderDetailsParams) {
    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
        console.warn('Nodemailer service skipped: SMTP_EMAIL or SMTP_PASSWORD not configured');
        return { success: false, error: new Error('Email service not configured') };
    }

    const { to, customerName, orderId, productName, quantity, totalPrice, address, customerAddress, paymentMethod } = params;

    let formattedAddress = 'Address details unavailable';
    if (customerAddress) {
        formattedAddress = customerAddress.replace(/\n, /g, '<br>');
    } else if (address) {
        const formattedAddressArray = [
            address.houseBuilding,
            address.town,
            [address.post, address.city].filter(Boolean).join(', '),
            [address.district, address.state].filter(Boolean).join(', '),
            address.pincode ? `PIN: ${address.pincode}` : null
        ].filter(Boolean);
        if (formattedAddressArray.length > 0) {
            formattedAddress = formattedAddressArray.join('<br>');
        }
    }

    const displayPaymentMethod =
        paymentMethod === 'qr'       ? 'QR Code (UPI)' :
        paymentMethod === 'razorpay' ? 'Razorpay'       :
        paymentMethod;

    // ── Design tokens · dark mode ───────────────────────────────
    const gold       = '#f59e0b';
    const goldBright = '#fbbf24';
    const goldDim    = '#92400e';
    const emerald    = '#10b981';
    const bg         = '#09090b';   // zinc-950
    const card       = '#0f0f12';
    const surface    = '#18181b';   // zinc-900
    const surfaceAlt = '#1c1c21';
    const border     = '#27272a';   // zinc-800
    const borderGold = '#3b2a0e';
    const textPrimary = '#fafafa';
    const textSub    = '#a1a1aa';   // zinc-400
    const textMuted  = '#52525b';   // zinc-600

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Order Confirmed – Attar Al Jannah</title>
  <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background-color: ${bg};
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      color: ${textPrimary};
      -webkit-font-smoothing: antialiased;
    }

    /* ── WRAPPER ──────────────────────────────── */
    .wrapper {
      padding: 36px 16px 56px;
      background-color: ${bg};
      background-image:
        radial-gradient(ellipse at 15% 15%, rgba(16,185,129,0.05) 0%, transparent 55%),
        radial-gradient(ellipse at 85% 85%, rgba(245,158,11,0.07) 0%, transparent 55%);
    }

    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: ${card};
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid ${border};
      box-shadow:
        0 0 0 1px rgba(245,158,11,0.06),
        0 20px 60px rgba(0,0,0,0.6),
        0 4px 12px rgba(0,0,0,0.4);
    }

    /* ── HEADER ───────────────────────────────── */
    .header {
      background: linear-gradient(175deg, #0a0a0d 0%, #111108 50%, #0d0d0a 100%);
      padding: 44px 40px 32px;
      text-align: center;
      position: relative;
      overflow: hidden;
      border-bottom: 1px solid ${border};
    }

    .header::before {
      content: '';
      position: absolute;
      top: -30px; left: 50%;
      transform: translateX(-50%);
      width: 340px; height: 200px;
      background: radial-gradient(ellipse, rgba(245,158,11,0.13) 0%, transparent 70%);
      pointer-events: none;
    }

    .header::after {
      content: '';
      position: absolute;
      bottom: 0; right: 0;
      width: 180px; height: 100px;
      background: radial-gradient(ellipse at bottom right, rgba(16,185,129,0.07) 0%, transparent 70%);
      pointer-events: none;
    }

    .header-logo {
      display: block;
      width: 220px;
      height: auto;
      margin: 0 auto 18px;
      position: relative;
      z-index: 1;
    }

    .ornament {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      position: relative;
      z-index: 1;
    }

    .ornament-line {
      width: 60px; height: 1px;
      background: linear-gradient(90deg, transparent, ${goldDim});
    }
    .ornament-line.right {
      background: linear-gradient(90deg, ${goldDim}, transparent);
    }

    .ornament-gem {
      font-size: 7px;
      color: ${gold};
      letter-spacing: 4px;
    }

    .header-tagline {
      font-family: 'Amiri', serif;
      font-size: 12px;
      font-style: italic;
      color: rgba(245,158,11,0.4);
      margin-top: 14px;
      letter-spacing: 0.04em;
      position: relative;
      z-index: 1;
    }

    /* ── GOLD BANNER ──────────────────────────── */
    .gold-banner {
      background: linear-gradient(90deg, #78350f, ${gold} 40%, ${goldBright} 60%, #78350f);
      padding: 9px 0;
      text-align: center;
    }
    .gold-banner span {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: #000;
    }

    /* ── CONTENT ──────────────────────────────── */
    .content {
      padding: 36px 40px 40px;
    }

    .greeting {
      font-family: 'Amiri', serif;
      font-size: 28px;
      font-weight: 700;
      color: ${textPrimary};
      margin-bottom: 8px;
      line-height: 1.25;
    }

    .greeting em {
      color: ${gold};
      font-style: normal;
    }

    .intro {
      font-size: 14px;
      line-height: 1.75;
      color: ${textSub};
      margin-bottom: 30px;
    }

    /* ── ORDER META ───────────────────────────── */
    .meta-row {
      display: table;
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      background: ${surface};
      border: 1px solid ${borderGold};
      border-radius: 14px;
      overflow: hidden;
      margin-bottom: 32px;
    }

    .meta-cell {
      display: table-cell;
      width: 33.33%;
      padding: 16px 12px;
      text-align: center;
      vertical-align: middle;
      border-right: 1px solid ${borderGold};
    }

    .meta-cell:last-child { border-right: none; }

    .meta-label {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: ${textMuted};
      margin-bottom: 5px;
    }

    .meta-value {
      font-size: 14px;
      font-weight: 700;
      color: ${textPrimary};
    }
    .meta-value.gold  { color: ${gold}; }
    .meta-value.green { color: ${emerald}; }

    /* ── SECTION LABEL ────────────────────────── */
    .section-label {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 14px;
    }

    .section-label-text {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: ${textMuted};
      white-space: nowrap;
    }

    .section-label-line {
      flex: 1;
      height: 1px;
      background: ${border};
    }

    /* ── ORDER TABLE ──────────────────────────── */
    .order-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }

    .order-table th {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: ${textMuted};
      padding: 0 0 10px;
      text-align: left;
      border-bottom: 1px solid ${border};
    }

    .order-table th.right, .order-table td.right { text-align: right; }
    .order-table th.center, .order-table td.center { text-align: center; }

    .order-table td {
      padding: 14px 0;
      font-size: 14px;
      color: ${textSub};
      border-bottom: 1px solid ${border};
    }

    .item-name {
      font-size: 15px;
      font-weight: 600;
      color: ${textPrimary};
    }

    .qty-pill {
      display: inline-block;
      background: ${borderGold};
      color: ${gold};
      font-size: 11px;
      font-weight: 700;
      padding: 3px 11px;
      border-radius: 20px;
      border: 1px solid rgba(245,158,11,0.2);
    }

    .total-row td {
      border-bottom: none;
      padding-top: 20px;
    }

    .total-label-cell {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: ${textMuted};
    }

    .total-amount-cell {
      font-size: 24px;
      font-weight: 700;
      color: ${gold};
      text-align: right;
      letter-spacing: -0.02em;
    }

    /* ── ADDRESS BOX ──────────────────────────── */
    .address-box {
      background: ${surface};
      border: 1px solid ${border};
      border-left: 3px solid ${gold};
      border-radius: 10px;
      padding: 18px 20px;
      font-size: 13px;
      line-height: 1.9;
      color: ${textSub};
      margin-bottom: 36px;
    }

    /* ── DIVIDER ──────────────────────────────── */
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, ${border}, transparent);
      margin-bottom: 32px;
    }

    /* ── CTA BLOCK ────────────────────────────── */
    .cta-wrapper {
      background: ${surface};
      border: 1px solid ${border};
      border-radius: 16px;
      padding: 28px 24px;
      text-align: center;
    }

    .cta-eyebrow {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: ${textMuted};
      margin-bottom: 6px;
    }

    .cta-heading {
      font-family: 'Amiri', serif;
      font-size: 20px;
      color: ${textPrimary};
      margin-bottom: 20px;
    }

    /* Primary full-width button */
    .btn-track {
      display: block;
      width: 100%;
      background: linear-gradient(135deg, #b45309 0%, ${gold} 50%, ${goldBright} 100%);
      color: #000000 !important;
      text-decoration: none;
      border-radius: 10px;
      padding: 15px 24px;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-align: center;
      margin-bottom: 12px;
      box-shadow: 0 4px 20px rgba(245,158,11,0.25), 0 1px 3px rgba(0,0,0,0.3);
    }

    /* 2-up secondary buttons using a table for max email-client compatibility */
    .btn-row-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 10px 0;
      margin-left: -10px;
      width: calc(100% + 20px);
    }

    .btn-secondary {
      display: block;
      width: 100%;
      background: ${surfaceAlt};
      color: ${textSub} !important;
      text-decoration: none;
      border-radius: 10px;
      padding: 13px 14px;
      font-size: 12px;
      font-weight: 600;
      border: 1px solid ${border};
      text-align: center;
      letter-spacing: 0.02em;
    }

    /* ── FOOTER ───────────────────────────────── */
    .footer {
      background: #050507;
      border-top: 1px solid ${border};
      padding: 30px 40px;
      text-align: center;
    }

    .footer-phrase {
      font-family: 'Amiri', serif;
      font-size: 20px;
      color: ${gold};
      direction: rtl;
      margin-bottom: 14px;
      opacity: 0.8;
    }

    .footer p {
      font-size: 12px;
      color: ${textMuted};
      line-height: 1.7;
      margin-bottom: 3px;
    }

    .footer a { color: ${gold}; text-decoration: none; font-weight: 600; }

    .footer-hr {
      height: 1px;
      background: ${border};
      margin: 16px 0;
    }

    .footer-fine {
      font-size: 10px;
      color: #3f3f46;
      letter-spacing: 0.05em;
    }

    /* ── RESPONSIVE ───────────────────────────── */
    @media only screen and (max-width: 480px) {
      .content  { padding: 28px 24px 32px; }
      .header   { padding: 36px 24px 28px; }
      .footer   { padding: 24px; }
      .header-logo { width: 170px; }
      .meta-row, .meta-cell { display: block; width: 100%; }
      .meta-cell { border-right: none; border-bottom: 1px solid ${borderGold}; }
      .meta-cell:last-child { border-bottom: none; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">

      <!-- ══ HEADER ══ -->
      <div class="header">
        <div class="header">
            <h1>عطر الجنّة</h1>
            <p>Attar Al Jannah</p>
        </div>
        <div class="ornament">
          <span class="ornament-line"></span>
          <span class="ornament-gem">◆ ◆ ◆</span>
          <span class="ornament-line right"></span>
        </div>
        <div class="header-tagline">Essense of Minhajul Janna</div>
      </div>

      <!-- ══ GOLD BANNER ══ -->
      <div class="gold-banner">
        <span>✦ &nbsp; Order Confirmed &nbsp; ✦</span>
      </div>

      <!-- ══ CONTENT ══ -->
      <div class="content">

        <div class="greeting">Assalamu Alaykum, <em>${customerName}</em></div>
        <p class="intro">
          Alhamdulillah — your order has been received and is being carefully prepared.
          We are honoured to bring the finest attar(s) to your door.
        </p>

        <!-- Meta strip -->
        <div class="meta-row">
          <div class="meta-cell">
            <div class="meta-label">Order ID</div>
            <div class="meta-value gold">#${orderId.slice(0, 8).toUpperCase()}</div>
          </div>
          <div class="meta-cell">
            <div class="meta-label">Payment</div>
            <div class="meta-value" style="font-size:12px;">${displayPaymentMethod}</div>
          </div>
          <div class="meta-cell">
            <div class="meta-label">Status</div>
            <div class="meta-value green" style="font-size:12px;">● Processing</div>
          </div>
        </div>

        <!-- Order Details -->
        <div class="section-label">
          <span class="section-label-text">Order Details</span>
          <span class="section-label-line"></span>
        </div>

        <table class="order-table">
          <thead>
            <tr>
              <th>Item</th>
              <th class="center">Qty</th>
              <th class="right">Price</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span class="item-name">${productName}</span></td>
              <td class="center"><span class="qty-pill">${quantity}</span></td>
              <td class="right">₹${totalPrice.toLocaleString('en-IN')}</td>
            </tr>
            <tr class="total-row">
              <td colspan="2" class="total-label-cell">Total Amount</td>
              <td class="total-amount-cell">₹${totalPrice.toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>

        <!-- Delivery Address -->
        <div class="section-label">
          <span class="section-label-text">Delivery Address</span>
          <span class="section-label-line"></span>
        </div>

        <div class="address-box">
          ${formattedAddress}
        </div>

        <div class="divider"></div>

        <!-- ── CTA BLOCK ── -->
        <div class="cta-wrapper">
          <div class="cta-eyebrow">What would you like to do?</div>
          <div class="cta-heading">Your order is on its way ✦</div>

          <a href="${appUrl}/track/${orderId}" class="btn-track">
            Track Your Order &nbsp;→
          </a>

          <a href="${appUrl}/customer/orders/${orderId}" class="btn-secondary">
            Invoice and Thanks Poster &nbsp;→
          </a>

        </div>

      </div><!-- /content -->

      <!-- ══ FOOTER ══ -->
      <div class="footer">
        <div class="footer-phrase">جزاك الله خيراً</div>
        <p>Thank you for choosing <strong style="color:#a1a1aa;">Attar Al Jannah</strong>.</p>
        <p>Questions? <a href="https://wa.me/919072358001">Chat with us on WhatsApp</a></p>
        <div class="footer-hr"></div>
        <p class="footer-fine">© Attar Al Jannah &nbsp;·&nbsp; ${to}</p>
      </div>

    </div><!-- /container -->
  </div><!-- /wrapper -->
</body>
</html>
    `;

    try {
        const info = await transporter.sendMail({
            from: '"Attar Al Jannah" <' + process.env.SMTP_EMAIL + '>',
            to,
            subject: '✦ Order Confirmed! – #' + orderId.slice(0, 8).toUpperCase(),
            html,
        });

        console.log("✉️ Order confirmation email sent to %s (Message ID: %s)", to, info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("❌ Error sending email via Nodemailer:", error);
        return { success: false, error };
    }
}