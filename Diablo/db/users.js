const fs = require('fs');
const path = require('path');

const USERS_FILE = path.join(__dirname, 'users.json');
let users = {};
try {
  users = JSON.parse(fs.readFileSync(USERS_FILE));
} catch {
  users = {};
}

function getBalance(id) {
  return users[id]?.balance || 0;
}

function addBalance(id, amount) {
  if (!users[id]) users[id] = { balance: 0 };
  users[id].balance += amount;
  save();
}

function save() {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

module.exports = { getBalance, addBalance };