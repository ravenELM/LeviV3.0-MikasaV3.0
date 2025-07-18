const fs = require('fs');
const path = require('path');

const premiumFile = path.join(__dirname,  'premium.json');


/**
 * Read the premium.json file and return the list of premium users.
 * Returns empty array if file not found or invalid.
 */
function getPremiumList() {
  try {
    const data = fs.readFileSync(premiumFile, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist or invalid JSON
    return [];
  }
}

/**
 * Save the updated premium user list back to premium.json.
 */
function savePremiumList(list) {
  fs.writeFileSync(premiumFile, JSON.stringify(list, null, 2));
}

/**
 * Check if a userId (JID) is premium.
 * @param {string} userId - WhatsApp JID like '1234567890@s.whatsapp.net'
 * @returns {boolean}
 */
function isPremium(userId) {
  const list = getPremiumList();
  return list.includes(userId);
}

/**
 * Add a userId to the premium list and save.
 * @param {string} userId - WhatsApp JID
 * @returns {boolean} - true if added, false if already premium
 */
function addPremium(userId) {
  const list = getPremiumList();
  if (!list.includes(userId)) {
    list.push(userId);
    savePremiumList(list);
    return true;
  }
  return false;
}

/**
 * Remove a userId from the premium list and save.
 * @param {string} userId - WhatsApp JID
 * @returns {boolean} - true if removed, false if not found
 */
function delPremium(userId) {
  let list = getPremiumList();
  if (list.includes(userId)) {
    list = list.filter(id => id !== userId);
    savePremiumList(list);
    return true;
  }
  return false;
}

module.exports = { isPremium, addPremium, delPremium };
