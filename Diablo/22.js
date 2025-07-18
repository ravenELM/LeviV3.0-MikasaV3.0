const fs = require('fs');
const path = require('path');

const cardsPath = path.join(__dirname, 'data', 'cards.json');

if (!fs.existsSync(cardsPath)) {
  console.error('cards.json not found in data folder');
  process.exit(1);
}

const cards = JSON.parse(fs.readFileSync(cardsPath, 'utf-8'));

let changedCount = 0;

for (const cardId in cards) {
  const card = cards[cardId];
  if (card.img && card.img.endsWith('.mp4')) {
    card.img = card.img.replace(/\.mp4$/, '.gif');
    changedCount++;
  }
}

fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 2));
console.log(`Updated ${changedCount} card image URLs from .mp4 to .gif in cards.json.`);
