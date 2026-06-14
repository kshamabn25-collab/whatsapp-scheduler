const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

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
  return new Promise((resolve, reject) => {
    client.on('qr', (qr) => {
      console.log('Scan this QR code with WhatsApp on your phone:');
      qrcode.generate(qr, { small: true });
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
