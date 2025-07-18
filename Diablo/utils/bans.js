const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'data', 'bannedUsers.json');
fs.mkdirSync(path.dirname(FILE), { recursive: true });
if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, '{}', 'utf8');

const load = () => JSON.parse(fs.readFileSync(FILE, 'utf8'));
const save = (data) => fs.writeFileSync(FILE, JSON.stringify(data, null, 2));

// Check if user is banned
function isBanned(id) {
  return !!load()[id];
}

// Ban user with reason and who banned
function banUser(id, reason = 'No reason provided', bannedBy = 'Unknown') {
  const data = load();
  data[id] = {
    reason,
    bannedBy,
    timestamp: new Date().toISOString()
  };
  save(data);
}

// Unban user
function unbanUser(id) {
  const data = load();
  delete data[id];
  save(data);
}

// Get all banned users
function getAll() {
  return load(); // returns object with { jid: { reason, bannedBy, timestamp } }
}

module.exports = {
  isBanned,
  banUser,
  unbanUser,
  getAll
};
