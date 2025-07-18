const fs = require('fs');
const path = require('path');
const txFile = path.join(__dirname, '..', 'data', 'transactions.json');

function logTransaction({ user, amount, type, note }) {
  let txs = [];
  try { txs = JSON.parse(fs.readFileSync(txFile)); } catch {}
  txs.push({
    user,
    amount,
    type, // e.g. 'daily', 'gamble', 'payday', etc
    note: note || '',
    timestamp: Date.now()
  });
  fs.writeFileSync(txFile, JSON.stringify(txs, null, 2));
}

module.exports = { logTransaction };