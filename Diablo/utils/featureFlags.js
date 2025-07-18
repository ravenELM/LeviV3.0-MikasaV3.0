/* utils/featureFlags.js  – simple persistent flag store */
const fs   = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

const FILE = path.join(__dirname, '..', 'data', 'featureFlags.json');
fs.mkdirSync(path.dirname(FILE), { recursive: true });

class FlagStore extends EventEmitter {
  constructor () {
    super();
    this.flags = this._load();
  }

  _load () {
    try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); }
    catch { return {}; }
  }
  _save () {
    fs.writeFileSync(FILE, JSON.stringify(this.flags, null, 2));
  }

  /** get current value (boolean ‑ default false) */
  get (key) {
    return !!this.flags[key];
  }

  /** set flag & emit change */
  set (key, value) {
    const val = !!value;
    if (this.flags[key] === val) return;
    this.flags[key] = val;
    this._save();
    this.emit('change', key, val);
  }

  /** flip flag & return new value */
  toggle (key) {
    const v = !this.get(key);
    this.set(key, v);
    return v;
  }
}

module.exports = new FlagStore();
