const { createClient, initClient } = require('./auth');
const { findGroup } = require('./scheduler');
const config = require('../config.json');

async function main() {
  const client = createClient();
  await initClient(client);

  const TEST_GROUP = 'Me only';
  console.log(`Sending test message to '${TEST_GROUP}'...`);
  try {
    const group = await findGroup(client, TEST_GROUP);
    await group.sendMessage('🧪 Test message from Pratibha scheduler — if you see this, it is working!');
    console.log(`Sent to '${TEST_GROUP}'`);
  } catch (err) {
    console.error(`Failed: ${err.message}`);
  }
  console.log('Done. You can stop the process now (Ctrl+C).');
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
