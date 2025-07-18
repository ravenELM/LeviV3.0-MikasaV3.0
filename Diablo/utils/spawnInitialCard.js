const { spawnCard } = require('./utils/spawnCard');

async function spawnInitialCard(sock) {
  try {
    const groups = await sock.groupFetchAllParticipating();
    for (const groupId of Object.keys(groups)) {
      // Pass cardDataList here!
      await spawnCard(sock, groupId, activeCards, cardDataList);
    }
    console.log('📤 Card spawned on startup in all groups.');
  } catch (err) {
    console.error('Card spawn error:', err);
  }
}
