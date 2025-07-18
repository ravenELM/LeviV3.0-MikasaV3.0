const fs = require('fs');
const path = require('path');
const CARDS_ACTIVATION_FILE = path.join(__dirname, '../data/cards-activation.json');

function isCardSpawningActive() {
  try {
    return JSON.parse(fs.readFileSync(CARDS_ACTIVATION_FILE)).active;
  } catch {
    return false;
  }
}
function setCardSpawningActive(state) {
  fs.writeFileSync(CARDS_ACTIVATION_FILE, JSON.stringify({ active: !!state }, null, 2));
}

module.exports = { isCardSpawningActive, setCardSpawningActive };