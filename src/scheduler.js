const fs = require('fs');
const path = require('path');

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

function validateConfig(config) {
  if (!config.startAt || isNaN(new Date(config.startAt).getTime())) {
    throw new Error('startAt is missing or not a valid date');
  }
  if (!config.stopAt || isNaN(new Date(config.stopAt).getTime())) {
    throw new Error('stopAt is missing or not a valid date');
  }
  if (new Date(config.stopAt) <= new Date(config.startAt)) {
    throw new Error('stopAt must be after startAt');
  }
  if (!Array.isArray(config.groups) || config.groups.length === 0) {
    throw new Error('groups must be a non-empty array');
  }
  if (!Array.isArray(config.messages) || config.messages.length === 0) {
    throw new Error('messages must be a non-empty array');
  }
}

function buildSchedule(config) {
  const startAt = new Date(config.startAt);
  const stopAt = new Date(config.stopAt);
  return config.messages
    .map((message, i) => ({
      message,
      sendAt: new Date(startAt.getTime() + i * TWO_HOURS_MS),
    }))
    .filter(({ sendAt }) => sendAt <= stopAt);
}

async function findGroups(client, nameOrId) {
  const chats = await client.getChats();
  const isId = nameOrId.includes('@g.us');
  const groups = chats.filter((c) =>
    c.isGroup && (isId ? c.id._serialized === nameOrId : c.name === nameOrId)
  );
  if (groups.length === 0) {
    throw new Error(`Group '${nameOrId}' not found — check spelling or ID in config.json`);
  }
  return groups;
}

async function sendWithRetry(group, message) {
  try {
    await group.sendMessage(message);
    console.log(`[${new Date().toISOString()}] Sent to '${group.name}': ${message.substring(0, 60)}`);
  } catch (err) {
    console.error(`Failed to send to '${group.name}': ${err.message} — retrying in 30s`);
    await new Promise((resolve) => setTimeout(resolve, 30000));
    try {
      await group.sendMessage(message);
      console.log(`[${new Date().toISOString()}] Retry succeeded for '${group.name}'`);
    } catch (retryErr) {
      console.error(`Retry failed for '${group.name}': ${retryErr.message} — skipping`);
    }
  }
}

async function runScheduler(client) {
  const configPath = path.join(process.cwd(), 'config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  validateConfig(config);

  const groups = [];
  for (const name of config.groups) {
    try {
      const matched = await findGroups(client, name);
      groups.push(...matched);
      console.log(`Found ${matched.length} group(s) named '${name}'`);
    } catch (err) {
      console.error(err.message);
    }
  }

  if (groups.length === 0) {
    console.error('No valid groups found. Check group names in config.json.');
    return;
  }

  const schedule = buildSchedule(config);
  console.log(`Scheduling ${schedule.length} message(s) to ${groups.length} group(s)`);

  const now = Date.now();
  const pending = schedule.filter(({ sendAt }) => sendAt.getTime() >= now);
  const pastCount = schedule.length - pending.length;

  if (pastCount > 0) {
    console.log(`Skipping ${pastCount} message(s) whose scheduled time has already passed.`);
  }

  if (pending.length === 0) {
    console.log('All done.');
    return;
  }

  let sent = 0;
  for (const { message, sendAt } of pending) {
    const delay = sendAt.getTime() - Date.now();
    setTimeout(async () => {
      for (const group of groups) {
        await sendWithRetry(group, message);
      }
      sent++;
      if (sent === pending.length) console.log('All done.');
    }, delay);
  }
}

module.exports = { validateConfig, buildSchedule, findGroups, runScheduler };
