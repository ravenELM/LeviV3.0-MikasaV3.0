const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(process.cwd(), 'datamoney', 'economy.json');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

let DATA;
try {
  DATA = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
} catch {
  DATA = {};
}

const save = () => fs.writeFileSync(DB_PATH, JSON.stringify(DATA, null, 2));

const LID_MAP_FILE = path.join(process.cwd(), 'datamoney', 'idmap.json');
let LID_MAP = {};
try {
  LID_MAP = JSON.parse(fs.readFileSync(LID_MAP_FILE, 'utf8'));
} catch {}

function normalise(id = '') {
  const bare = id.split(':')[0];
  if (bare.endsWith('@lid') && LID_MAP[bare]) return LID_MAP[bare];
  return bare;
}

function ensure(id) {
  id = normalise(id);
  if (!DATA[id]) {
    DATA[id] = {
      wallet: 0,
      lastDaily: 0,
      lastPayday: 0,
      lottery: { count: 0, lastUsed: 0 },
      slot: { count: 0, lastUsed: 0 },
      inventory: {},
      fridge: {}, // 🧊 Add fridge for food
    };
  } else {
    if (!DATA[id].inventory) DATA[id].inventory = {};
    if (!DATA[id].fridge) DATA[id].fridge = {}; // 🧊 Ensure fridge exists
    if (!DATA[id].lottery) DATA[id].lottery = { count: 0, lastUsed: 0 };
    if (!DATA[id].slot) DATA[id].slot = { count: 0, lastUsed: 0 };
  }
  return id;
}

// ─── Wallet Functions ──────────────────────────────
function getUser(id) {
  id = ensure(id);
  return { ...DATA[id] };
}
function setUser(id, obj) {
  DATA[ensure(id)] = obj;
  save();
}
function getBalance(id) {
  return DATA[ensure(id)].wallet;
}
function setBalance(id, n) {
  DATA[ensure(id)].wallet = n;
  save();
}
function addBalance(id, n) {
  DATA[ensure(id)].wallet += n;
  save();
}

// Aliases
function getMoney(id) {
  return getBalance(id);
}
function addMoney(id, n) {
  return addBalance(id, n);
}

// ─── Timers ─────────────────────────────────────────
function getDaily(id) {
  return DATA[ensure(id)].lastDaily;
}
function setDaily(id, ts) {
  DATA[ensure(id)].lastDaily = ts;
  save();
}
function getPayday(id) {
  return DATA[ensure(id)].lastPayday;
}
function setPayday(id, ts) {
  DATA[ensure(id)].lastPayday = ts;
  save();
}

// ─── Game Stats ─────────────────────────────────────
function getLottery(id) {
  return DATA[ensure(id)].lottery;
}
function setLottery(id, lottery) {
  DATA[ensure(id)].lottery = lottery;
  save();
}
function getSlot(id) {
  return DATA[ensure(id)].slot;
}
function setSlot(id, slot) {
  DATA[ensure(id)].slot = slot;
  save();
}

// ─── Inventory ──────────────────────────────────────
function addItem(id, itemID, qty = 1) {
  id = ensure(id);
  if (!DATA[id].inventory[itemID]) DATA[id].inventory[itemID] = 0;
  DATA[id].inventory[itemID] += qty;
  save();
}
function getInventory(id) {
  id = ensure(id);
  return DATA[id].inventory || {};
}
function setInventory(id, inventory) {
  id = ensure(id);
  DATA[id].inventory = inventory;
  save();
}

// ─── Fridge (Food Inventory) ────────────────────────
function getFridge(id) {
  id = ensure(id);
  return DATA[id].fridge || {};
}
function addFridgeItem(id, itemName, qty = 1) {
  id = ensure(id);
  if (!DATA[id].fridge[itemName]) DATA[id].fridge[itemName] = 0;
  DATA[id].fridge[itemName] += qty;
  save();
}
function setFridge(id, fridge) {
  id = ensure(id);
  DATA[id].fridge = fridge;
  save();
}

// ─── Leaderboard ────────────────────────────────────
function getTop(limit = 10) {
  return Object.entries(DATA)
    .sort((a, b) => b[1].wallet - a[1].wallet)
    .slice(0, limit)
    .map(([id, d]) => ({ id, ...d }));
}

// ─── ID Map ─────────────────────────────────────────
function reloadIdMap() {
  try {
    LID_MAP = JSON.parse(fs.readFileSync(LID_MAP_FILE, 'utf8'));
  } catch {
    LID_MAP = {};
  }
}

// ─── Export ─────────────────────────────────────────
module.exports = {
  getUser, setUser,
  getBalance, setBalance, addBalance,
  getMoney, addMoney,
  getDaily, setDaily,
  getPayday, setPayday,
  getLottery, setLottery,
  getSlot, setSlot,
  addItem,
  getInventory,
  setInventory,
  getFridge,
  addFridgeItem,
  setFridge,
  getTop,
  reloadIdMap,
};
