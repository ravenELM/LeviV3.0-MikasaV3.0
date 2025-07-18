// db/economy.js  (CommonJS, ONE file only)
const fs   = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'datamoney', 'economy.json');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

/* ---------- singleton cache ---------- */
let DATA = loadFile();

/* ---------- helpers ---------- */
function loadFile() {
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
  catch { return {}; }
}
function saveFile() {
  fs.writeFileSync(DB_PATH, JSON.stringify(DATA, null, 2));
}
const norm = jid => jid.split(':')[0];

/* ---------- public API ---------- */
function ensure(id) {
  id = norm(id);
  if (!DATA[id]) DATA[id] = { wallet: 0, lastDaily: 0, lastPayday: 0 };
  return id;
}

function getUser(id)        { id = ensure(id); return { ...DATA[id] }; }
function setUser(id, obj)   { DATA[ensure(id)] = obj; saveFile(); }
function getBalance(id)     { return DATA[ensure(id)].wallet; }
function setBalance(id, n)  { DATA[ensure(id)].wallet = n; saveFile(); }
function addBalance(id, n)  { DATA[ensure(id)].wallet += n; saveFile(); }

function getDaily(id)       { return DATA[ensure(id)].lastDaily; }
function setDaily(id, ts)   { DATA[ensure(id)].lastDaily  = ts; saveFile(); }
function getPayday(id)      { return DATA[ensure(id)].lastPayday; }
function setPayday(id, ts)  { DATA[ensure(id)].lastPayday = ts; saveFile(); }

/* optional: reload if you *manually* edited the JSON while bot is running */
function reload()           { DATA = loadFile(); }

module.exports = {
  getUser, setUser,
  getBalance, setBalance, addBalance,
  getDaily,  setDaily,
  getPayday, setPayday,
  reload
};
