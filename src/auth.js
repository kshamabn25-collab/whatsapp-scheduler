const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const http = require('http');

let latestQRDataUrl = null;

function startQRServer() {
  const port = process.env.PORT || 3000;
  const server = http.createServer(async (req, res) => {
    if (latestQRDataUrl) {
      const html = `<!DOCTYPE html><html><head><title>WhatsApp QR</title>
        <meta http-equiv="refresh" content="20">
        <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;background:#f0f0f0;}
        img{width:300px;height:300px;}p{color:#555;}</style></head>
        <body><h2>Scan with WhatsApp</h2><img src="${latestQRDataUrl}"/><p>Page refreshes every 20s for a new code</p></body></html>`;
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<html><body><p>Waiting for QR code... refresh in a few seconds.</p></body></html>');
    }
  });
  server.listen(port, () => console.log(`QR server running on port ${port}`));
}

function createClient() {
  const authPath = process.env.WWEBJS_AUTH_PATH || '.wwebjs_auth';
  return new Client({
    authStrategy: new LocalAuth({ dataPath: authPath }),
    puppeteer: {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  });
}

function initClient(client) {
  startQRServer();

  return new Promise((resolve, reject) => {
    client.on('qr', async (qr) => {
      console.log('New QR code generated — open your Railway URL in a browser to scan it.');
      qrcode.generate(qr, { small: true });
      latestQRDataUrl = await QRCode.toDataURL(qr);
    });

    client.on('ready', () => {
      console.log('WhatsApp client is ready.');
      resolve(client);
    });

    client.on('auth_failure', (msg) => {
      reject(new Error(`Authentication failed: ${msg}`));
    });

    client.on('disconnected', (reason) => {
      console.error(`Client disconnected: ${reason} — restarting to show new QR`);
      process.exit(1);
    });

    client.initialize();
  });
}

module.exports = { createClient, initClient };
