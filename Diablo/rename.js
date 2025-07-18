const fs = require('fs');
const path = require('path');

// Path to carnest.json
const carnestPath = path.join(__dirname, 'data', 'carnest.json');

// Load and parse the card array
const raw = fs.readFileSync(carnestPath, 'utf-8');
let cards;

try {
  cards = JSON.parse(raw);
  if (!Array.isArray(cards)) throw new Error('Expected an array of cards.');
} catch (e) {
  console.error('❌ Failed to parse carnest.json:', e.message);
  process.exit(1);
}

// Generate random key
function generateId(length = 10) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < length; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

// Convert array to object with new keys
const renamedCards = {};
for (const card of cards) {
  const key = `card_${generateId()}`;
  renamedCards[key] = card;
}

// Write back to carnest.json
fs.writeFileSync(carnestPath, JSON.stringify(renamedCards, null, 2));
console.log('✅ carnest.json updated with renamed keys.');
