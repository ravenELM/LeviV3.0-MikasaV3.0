const fs = require('fs');
const path = require('path');

// --- User cards (collection) ---
const CARDS_FILE = path.join(__dirname, '../data/claimed.json');
let userCards = {};
try { userCards = JSON.parse(fs.readFileSync(CARDS_FILE)); } catch { userCards = {}; }

function getUserCards(userId) {
  return userCards[userId] || [];
}

function addCardToUser(userId, cardId) {
  if (!userCards[userId]) userCards[userId] = [];
  userCards[userId].push({ id: cardId });
  saveUserCards();
}

function removeCardFromUser(userId, cardId) {
  if (!userCards[userId]) return false;
  const idx = userCards[userId].findIndex(c => c.id === cardId);
  if (idx === -1) return false;
  userCards[userId].splice(idx, 1);
  saveUserCards();
  return true;
}

function saveUserCards() {
  fs.writeFileSync(CARDS_FILE, JSON.stringify(userCards, null, 2));
}

// --- User decks ---
const DECKS_FILE = path.join(__dirname, '../data/decks.json');
let userDecks = {};
try { userDecks = JSON.parse(fs.readFileSync(DECKS_FILE)); } catch { userDecks = {}; }

function getUserDeck(userId) {
  return userDecks[userId] || [];
}

function setUserDeck(userId, deckArr) {
  userDecks[userId] = deckArr;
  saveUserDecks();
}

function addToDeck(userId, cardId) {
  if (!userDecks[userId]) userDecks[userId] = [];
  if (!userDecks[userId].includes(cardId)) {
    userDecks[userId].push(cardId);
    saveUserDecks();
  }
}

function removeFromDeck(userId, cardId) {
  if (!userDecks[userId]) return false;
  const idx = userDecks[userId].indexOf(cardId);
  if (idx === -1) return false;
  userDecks[userId].splice(idx, 1);
  saveUserDecks();
  return true;
}

function saveUserDecks() {
  fs.writeFileSync(DECKS_FILE, JSON.stringify(userDecks, null, 2));
}

// --- Collection alias for compatibility ---
function getCollection(userId) {
  return getUserCards(userId);
}

module.exports = {
  getUserCards,
  addCardToUser,
  removeCardFromUser,
  getUserDeck,
  setUserDeck,
  addToDeck,
  removeFromDeck,
  getCollection
};