/* db/clans.js – very small helper for clan data (CommonJS) */
const fs   = require('fs');
const path = require('path');

const FILE = path.join(process.cwd(), 'data', 'clans.json');
fs.mkdirSync(path.dirname(FILE), { recursive: true });
if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, '{}', 'utf8');

const MAX_MEMBERS   = 15;
const CLAN_FEE      = 5_000_000;              // 50 mil to create
const load  = () => JSON.parse(fs.readFileSync(FILE, 'utf8'));
const save  = d => fs.writeFileSync(FILE, JSON.stringify(d, null, 2));

function _uid(len = 5) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = ''; while (id.length < len) id += chars[Math.floor(Math.random()*chars.length)];
  return id;
}

function createClan(owner, name, slogan = '') {
  const db = load();
  const id = _uid();
  db[id] = {
    id, name, slogan,
    owner, vice: null,
    members : [owner],
    logo    : null,
    requests: []
  };
  save(db);
  return db[id];
}

function getClan(id)                    { return load()[id]; }
function allClans()                     { return Object.values(load()); }
function saveClan(clan)                 { const db = load(); db[clan.id]=clan; save(db); }
function clanOf(user)                   {
  return allClans().find(c => c.members.includes(user) || c.owner === user);
}
function deleteRequest(clan, jid)       {
  clan.requests = clan.requests.filter(x => x!==jid);
  saveClan(clan);
}

module.exports = {
  MAX_MEMBERS, CLAN_FEE,
  createClan, getClan, allClans,
  saveClan, clanOf, deleteRequest
};
