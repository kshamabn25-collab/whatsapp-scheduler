const { createClient, initClient } = require('./auth');
const { runScheduler } = require('./scheduler');

async function main() {
  const client = createClient();
  await initClient(client);
  await runScheduler(client);
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
