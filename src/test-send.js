const { createClient, initClient } = require('./auth');
const { findGroup } = require('./scheduler');
const config = require('../config.json');

async function main() {
  const client = createClient();
  await initClient(client);

  console.log('Sending test message to groups...');
  for (const name of config.groups) {
    try {
      const group = await findGroup(client, name);
      await group.sendMessage('🧪 Test message from Pratibha scheduler — if you see this, it is working!');
      console.log(`Sent to '${name}'`);
    } catch (err) {
      console.error(`Failed for '${name}': ${err.message}`);
    }
  }
  console.log('Done. You can stop the process now (Ctrl+C).');
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
