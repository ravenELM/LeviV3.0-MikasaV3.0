// lib/id.js
const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, '..', 'data'); // adjust if your .jsons are in a different dir

function resolveId(rawId = '') {
  const base = rawId.split(':')[0];

  // Already a full s.whatsapp.net ID?
  if (base.endsWith('@s.whatsapp.net')) return base;

  // Attempt to find matching real ID from known DB files
  const files = fs.readdirSync(DB_DIR).filter(f => f.endsWith('.json'));
  for (const file of files) {
    try {
      const db = JSON.parse(fs.readFileSync(path.join(DB_DIR, file)));
      for (const key in db) {
        if (key.endsWith('@s.whatsapp.net') && key.includes(base.slice(-9))) {
          return key;
        }
      }
    } catch {}
  }

  // Default fallback
  return null;
}

module.exports = { resolveId };
