/* utils/msgCounter.js
   ────────────────────────────────────────────────
   Lightweight helper that:
   – keeps a { jid : totalMsgs } map in data/msgcount.json
   – exposes inc(jid)  and  top(n)
*/
const fs   = require('fs');
const path = require('path');

const FILE = path.join(process.cwd(), 'data', 'msgcount.json');
fs.mkdirSync(path.dirname(FILE), { recursive: true });

const load = () => {
  try   { return JSON.parse(fs.readFileSync(FILE, 'utf8')); }
  catch { return {}; }
};
let DATA = load();

const save = () =>
  fs.writeFileSync(FILE, JSON.stringify(DATA, null, 2));

function normalise(jid = '') { return jid.split(':')[0]; }

function inc(jid) {
  jid = normalise(jid);
  DATA[jid] = (DATA[jid] || 0) + 1;
  save();
}

function top(limit = 10) {
  return Object.entries(DATA)
    .sort((a, b) => b[1] - a[1])           // desc by count
    .slice(0, limit)                       // take first N
    .map(([jid, count]) => ({ jid, count }));
}

module.exports = { inc, top };
