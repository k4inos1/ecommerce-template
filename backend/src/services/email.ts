import nodemailer from 'nodemailer';

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

interface OrderEmailData {
  to: string;
  customerName: string;
  orderId: string;
  items: { name: string; quantity: number; price: number }[];
  totalAmount: number;
  shippingAddress?: { street?: string; city?: string; country?: string };
}

// Estilos corporativos base
const corporateStyle = `
  body { font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px; color: #1f2937; line-height: 1.6; }
  .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
  .banner { width: 100%; height: 180px; object-fit: cover; display: block; border-bottom: 4px solid #4f46e5; }
  .header { padding: 30px; text-align: center; background-color: #ffffff; }
  .logo { font-size: 28px; font-weight: 800; color: #111827; letter-spacing: -0.5px; margin: 0 0 10px; }
  .logo span { color: #4f46e5; }
  .content { padding: 0 40px 40px; }
  .greeting { font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 15px; }
  .text { font-size: 15px; color: #4b5563; margin-bottom: 25px; }
  .button { display: inline-block; background-color: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px; }
  .footer { background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb; }
  .footer p { font-size: 12px; color: #9ca3af; margin: 0; padding: 0; }
  .table { width: 100%; border-collapse: collapse; margin-top: 20px; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; }
  .table th { background-color: #f9fafb; text-align: left; padding: 12px 15px; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
  .table td { padding: 15px; border-top: 1px solid #e5e7eb; font-size: 14px; }
  .total-row { background-color: #f9fafb; font-weight: 700; color: #111827; }
  .address-box { background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-top: 25px; }
  .address-box strong { display: block; margin-bottom: 5px; color: #374151; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;}
`;

export async function sendOrderConfirmation(data: OrderEmailData) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('📧 Email skipped — EMAIL_USER/EMAIL_PASS not configured');
    return;
  }

  const itemRows = data.items.map(i =>
    `<tr>
      <td style="color:#374151">${escapeHtml(String(i.name))} <span style="color:#9ca3af;font-size:12px">×${i.quantity}</span></td>
      <td style="text-align:right;color:#111827;font-weight:500">$${(i.price * i.quantity).toFixed(2)}</td>
    </tr>`
  ).join('');

  const safeClientUrl = escapeHtml(String(process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, ''));

  const html = `
  <!DOCTYPE html><html><head><meta charset="UTF-8"><style>${corporateStyle}</style></head>
  <body>
    <div class="container">
      <!-- Banner Premium Corporativo (Unsplash Tech) -->
      <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=600&h=180" class="banner" alt="TechStore Banner" />
      <div class="header">
        <div class="logo">Tech<span>Store</span></div>
        <div style="font-size:14px;color:#6b7280;letter-spacing:1px;text-transform:uppercase;font-weight:600">Comprobante de Orden</div>
      </div>
      <div class="content">
        <div class="greeting">¡Gracias por tu compra, ${escapeHtml(String(data.customerName))}!</div>
        <p class="text">Hemos recibido tu orden y ya estamos preparándola para el envío. A continuación encontrarás el resumen detallado de tu transacción corporativa.</p>
        
        <p style="font-size:13px;color:#6b7280;margin:0 0 10px">ID de Orden Ref: <strong style="color:#4f46e5">#${String(data.orderId).slice(-8).toUpperCase()}</strong></p>
        
        <table class="table">
          <thead><tr><th>Descripción</th><th style="text-align:right">Subtotal</th></tr></thead>
          <tbody>${itemRows}</tbody>
          <tfoot><tr class="total-row"><td>Total a Pagar</td><td style="text-align:right;color:#4f46e5;font-size:16px">$${data.totalAmount.toFixed(2)}</td></tr></tfoot>
        </table>

        ${data.shippingAddress ? `<div class="address-box">
          <strong>Dirección de Despacho Logístico</strong>
          <span style="color:#4b5563;font-size:14px">${escapeHtml(String(data.shippingAddress.street || ''))}, ${escapeHtml(String(data.shippingAddress.city || ''))}, ${escapeHtml(String(data.shippingAddress.country || ''))}</span>
        </div>` : ''}
        
        <div style="text-align:center;margin-top:35px">
          <a href="${safeClientUrl}/mis-ordenes" class="button">Rastrear mi orden</a>
        </div>
      </div>
      <div class="footer">
        <p>TechStore Retail Group | Av. Providencia 1234, Santiago, Chile</p>
        <p style="margin-top:8px">Este es un correo automático oficial. Por favor no responder a este mensaje.</p>
      </div>
    </div>
  </body></html>`;

  await transporter.sendMail({
    from: `"TechStore Corporativo" <${process.env.EMAIL_USER}>`,
    to: data.to,
    subject: `Recibo Oficial - Orden #${String(data.orderId).slice(-8).toUpperCase()} | TechStore`,
    html,
  });
  console.log(`📧 Corporate confirmation email sent to ${data.to}`);
}

export async function sendWelcomeEmail(to: string, name: string) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('📧 Welcome email skipped — EMAIL_USER/EMAIL_PASS not configured');
    return;
  }

  const safeName = escapeHtml(name);

  const html = `
  <!DOCTYPE html><html><head><meta charset="UTF-8"><style>${corporateStyle}</style></head>
  <body>
    <div class="container">
      <!-- Banner Premium Corporativo (Unsplash Setup/Setup) -->
      <img src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=600&h=180" class="banner" alt="TechStore Welcome Banner" />
      <div class="header">
        <div class="logo">Tech<span>Store</span></div>
        <div style="font-size:14px;color:#6b7280;letter-spacing:1px;text-transform:uppercase;font-weight:600">Tecnología de Vanguardia</div>
      </div>
      <div class="content" style="text-align:center">
        <div class="greeting" style="font-size:26px">¡Bienvenido a TechStore, ${safeName}!</div>
        <p class="text" style="font-size:16px;line-height:1.7;margin:25px 0 35px">
          Queremos darte la bienvenida oficial a nuestra plataforma. Tu cuenta ha sido validada y ya formas parte de nuestra red de clientes preferenciales. 
          <br><br>Prepárate para explorar la mejor tecnología del mercado con procesos de compra seguros y garantizados.
        </p>
        <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/products" class="button">Explorar el Catálogo</a>
      </div>
      <div class="footer">
        <p>TechStore Retail Group | Innovación y Tecnología 2026</p>
        <p style="margin-top:8px">¿Necesitas ayuda comercial? Contáctanos a nuestro canal oficial de soporte.</p>
      </div>
    </div>
  </body></html>`;

  await transporter.sendMail({
    from: `"TechStore Corporativo" <${process.env.EMAIL_USER}>`,
    to,
    subject: `¡Tu cuenta oficial ha sido activada, ${safeName}! | TechStore`,
    html,
  });
  console.log(`📧 Corporate welcome email sent to ${to}`);
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('📧 Password reset email skipped — EMAIL_USER/EMAIL_PASS not configured');
    return;
  }

  const html = `
  <!DOCTYPE html><html><head><meta charset="UTF-8"><style>${corporateStyle}</style></head>
  <body>
    <div class="container">
      <!-- Banner Premium Corporativo (Unsplash Security) -->
      <img src="https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&q=80&w=600&h=180" class="banner" alt="Security Banner" />
      <div class="header">
        <div class="logo">Tech<span>Store</span></div>
        <div style="font-size:14px;color:#6b7280;letter-spacing:1px;text-transform:uppercase;font-weight:600">Sistema de Seguridad</div>
      </div>
      <div class="content" style="text-align:center">
        <div class="greeting" style="font-size:26px">Recuperación de Contraseña</div>
        <p class="text" style="font-size:16px;line-height:1.7;margin:25px 0 35px">
          Hemos recibido una solicitud oficial para restablecer la contraseña de tu cuenta.
          <br><br>Si fuiste tú, haz clic en el siguiente botón seguro. Este enlace caducará en 15 minutos por protocolos de seguridad.
        </p>
        <a href="${resetUrl}" class="button">Restablecer mi Contraseña</a>
      </div>
      <div class="footer">
        <p>TechStore Security Operations Center | Innovación 2026</p>
        <p style="margin-top:8px">Si no solicitaste este cambio, ignora este correo. Tus datos permanecen asegurados.</p>
      </div>
    </div>
  </body></html>`;

  await transporter.sendMail({
    from: `"TechStore Seguridad" <${process.env.EMAIL_USER}>`,
    to,
    subject: `🔐 Restablecer contraseña | TechStore`,
    html,
  });
  console.log(`📧 Corporate password reset email sent to ${to}`);
}

export async function sendOrderShippedEmail(to: string, customerName: string, orderId: string) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('📧 Shipping email skipped — EMAIL_USER/EMAIL_PASS not configured');
    return;
  }

  const html = `
  <!DOCTYPE html><html><head><meta charset="UTF-8"><style>${corporateStyle}</style></head>
  <body>
    <div class="container">
      <!-- Banner Premium Corporativo (Unsplash Shipping/Logistics) -->
      <img src="https://images.unsplash.com/photo-1566576721346-d4a3b4eaad5b?auto=format&fit=crop&q=80&w=600&h=180" class="banner" alt="Shipping Banner" />
      <div class="header">
        <div class="logo">Tech<span>Store</span></div>
        <div style="font-size:14px;color:#6b7280;letter-spacing:1px;text-transform:uppercase;font-weight:600">Despacho Logístico</div>
      </div>
      <div class="content" style="text-align:center">
        <div class="greeting" style="font-size:26px">¡Tu pedido va en camino, ${customerName}!</div>
        <p class="text" style="font-size:16px;line-height:1.7;margin:25px 0 35px">
          Excelentes noticias. Tu orden <strong style="color:#4f46e5">#${String(orderId).slice(-8).toUpperCase()}</strong> ha sido procesada por nuestro centro de distribución y ya se encuentra en manos de nuestro courier asociado.
          <br><br>Pronto recibirás la tecnología de vanguardia que seleccionaste en la puerta de tu hogar.
        </p>
        <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/mis-ordenes" class="button">Ver tracking en tiempo real</a>
      </div>
      <div class="footer">
        <p>TechStore Logistics Dept. | Eficiencia y Rapidez 2026</p>
        <p style="margin-top:8px">Gracias por confiar en TechStore. La tecnología nos conecta.</p>
      </div>
    </div>
  </body></html>`;

  await transporter.sendMail({
    from: `"TechStore Logística" <${process.env.EMAIL_USER}>`,
    to,
    subject: `🚚 ¡Tu pedido #${String(orderId).slice(-8).toUpperCase()} ha sido enviado! | TechStore`,
    html,
  });
  console.log(`📧 Shipping notification email sent to ${to}`);
}
