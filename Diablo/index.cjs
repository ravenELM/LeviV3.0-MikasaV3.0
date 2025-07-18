const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const { spawnCard } = require('./utils/spawnCard');
const pino = require('pino');
const path = require('path');
const fs = require('fs');
const { resolveId } = require('./lib/id');
const messageHandler = require('./messageHandler'); // <-- Add this
const handleBadwords = require('./listeners/badword-filter');




// Initialize global variables
const activeCards = {};
global.activeCards = activeCards;

// Card data management
const claimedCardsFile = path.join(__dirname, 'data', 'claimed.json');
if (!fs.existsSync(claimedCardsFile)) fs.writeFileSync(claimedCardsFile, '{}');
let claimedCards = JSON.parse(fs.readFileSync(claimedCardsFile));

// Load prefix
const PREFIX_FILE = path.join(__dirname, 'data', 'prefix.json');
let PREFIX = '.';
try {
  PREFIX = JSON.parse(fs.readFileSync(PREFIX_FILE)).prefix || '.';
} catch {}
global.BOT_PREFIX = PREFIX;

const logger = pino({ level: 'silent' });
const COOLDOWN_MS = 15_000;
const BOT_START_TIME = Date.now();

// Load card data
const cardDataList = JSON.parse(fs.readFileSync('./data/cards.json', 'utf-8'));

// Configuration
const config = require('./config');
const bans = require('./utils/bans');

const OWNER_IDS = (process.env.OWNER_IDS || '').split(',').map(x => x.trim()).filter(Boolean);
const ownerIDs = OWNER_IDS.length ? OWNER_IDS : (config.ownerIDs || []);
const MODS = (process.env.MODS || '').split(',').map(x => x.trim()).filter(Boolean);
const mods = MODS.length ? MODS : (config.mods || []);

const mutedUsers = {};
global.antilinkGroups = global.antilinkGroups || {};
const userWarns = {};
const WARN_LIMIT = 5;

const SONGS_DIR = path.join(__dirname, 'songs');

// Command loader
function loadCommands(dir, commandsMap) {
  if (!fs.existsSync(dir)) {
    console.error(`Commands directory not found: ${dir}`);
    return;
  }

  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      loadCommands(full, commandsMap);
      continue;
    }
    if (!file.endsWith('.js')) continue;
    
    try {
      const exp = require(full);
      let cmd = null;
      
      if (typeof exp === 'function') {
        cmd = { name: path.parse(file).name.toLowerCase(), run: exp };
      } else if (exp && typeof exp === 'object') {
        const fnKey = Object.keys(exp).find(k => typeof exp[k] === 'function');
        cmd = {
          name: exp.name || path.parse(file).name.toLowerCase(),
          run: exp.run || exp.execute || exp[fnKey],
          aliases: exp.aliases || []
        };
      }
      
      if (!cmd?.run) {
        console.warn('⚠️  Skip', full);
        continue;
      }
      
      commandsMap.set(cmd.name, cmd);
      (cmd.aliases || []).forEach(a => commandsMap.set(a.toLowerCase(), cmd));
      console.log(`✓ Loaded ${cmd.name} from ${file}`);
    } catch (e) {
      console.error(`Error loading command ${file}:`, e);
    }
  }
}

// Anti-link handler
async function handleAntiLink(m, sock) {
  const chatId = m.key.remoteJid;
  if (!global.antilinkGroups[chatId]) return;
  
  const senderId = (m.key.participant || chatId).split(':')[0];
  const textMsg =
    m.message.conversation ||
    m.message.extendedTextMessage?.text ||
    m.message.imageMessage?.caption ||
    m.message.videoMessage?.caption || '';
  
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(\w+\.\w{2,}\/?.*)/i;
  if (!urlRegex.test(textMsg)) return;
  
  try {
    await sock.sendMessage(chatId, { delete: m.key });
  } catch {}
  
  await sock.sendMessage(chatId, {
    text: `🚫 @${senderId.split('@')[0]} sent a link and will be kicked!`,
    mentions: [senderId]
  });
  
  if (sock.groupParticipantsUpdate) {
    setTimeout(() => sock.groupParticipantsUpdate(chatId, [senderId], "remove").catch(() => {}), 2000);
  } else if (sock.groupRemove) {
    setTimeout(() => sock.groupRemove(chatId, [senderId]).catch(() => {}), 2000);
  }
}

// Card spawning functions
async function spawnInitialCard(sock) {
  try {
    console.log('Spawning cards in groups, card data count:', cardDataList.length);
    const groups = await sock.groupFetchAllParticipating();
    for (const groupId of Object.keys(groups)) {
      await spawnCard(sock, groupId, activeCards, cardDataList);
    }
    console.log('📤 Cards spawned on startup in all groups.');
  } catch (err) {
    console.error('Card spawn error:', err);
  }
}

function startSpawnLoop(sock) {
  setInterval(() => spawnInitialCard(sock), 55 * 60 * 1000);
}

// Enhanced connection handler
async function handleConnection(botNumber, sock, retryCount = 0) {
  const MAX_RETRIES = 5;
  const RETRY_DELAY = Math.min(30000, 5000 * (retryCount + 1));

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr) {
      console.log(`\n[Bot ${botNumber}] Scan this QR code with WhatsApp:`);
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'open') {
      console.log(`[Bot ${botNumber}] ✅ Connected to WhatsApp`);
      try {
        await spawnInitialCard(sock);
        startSpawnLoop(sock);
      } catch (err) {
        console.error(`[Bot ${botNumber}] Initialization error:`, err);
      }
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      
      console.log(`[Bot ${botNumber}] Connection closed`, 
        `Status: ${statusCode || 'unknown'}`,
        `Reason: ${lastDisconnect?.error?.message || 'unknown'}`);
      
      if (shouldReconnect && retryCount < MAX_RETRIES) {
        console.log(`[Bot ${botNumber}] Attempting reconnect (${retryCount + 1}/${MAX_RETRIES})...`);
        setTimeout(() => startBot(botNumber, retryCount + 1), RETRY_DELAY);
      } else {
        console.error(`[Bot ${botNumber}] Max reconnection attempts reached or logged out`);
      }
    }
  });
}

// Main bot function with enhanced error handling
async function startBot(botNumber, retryCount = 0) {
  const authFolder = `./auth_info_${botNumber}`;
  const commandsFolder = botNumber === 1 ? './commands' : './commands2';
  
  try {
    // Ensure auth directory exists
    if (!fs.existsSync(authFolder)) {
      fs.mkdirSync(authFolder, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    
    const commands = new Map();
    const cooldowns = new Map();
    
    const sock = makeWASocket({
      logger,
      auth: state,
      printQRInTerminal: false,
      browser: [`Bot-${botNumber}`, 'Safari', '3.0'],
      syncFullHistory: false,
      getMessage: async () => {},
      shouldIgnoreJid: jid => false,
      connectTimeoutMs: 3000000,
      keepAliveIntervalMs: 1500000
    });
    // Setup welcome and leave event handlers
try {
  const welcomeHandler = botNumber === 1 
    ? require('./commands/setwelcome2') 
    : require('./commands2/setwelcome');

  const leaveHandler = botNumber === 1 
    ? require('./commands/setleave2') 
    : require('./commands2/setleave');

  if (typeof welcomeHandler.setup === 'function') welcomeHandler.setup(sock);
  if (typeof leaveHandler.setup === 'function') leaveHandler.setup(sock);
} catch (e) {
  console.error(`[Bot ${botNumber}] ❌ Failed to setup welcome/leave logic:`, e.message);
}


    // Handle connection events
    await handleConnection(botNumber, sock, retryCount);

    sock.ev.on('creds.update', saveCreds);
    
    // Load commands with delay to prevent overlap
    setTimeout(() => {
      loadCommands(path.join(__dirname, commandsFolder), commands);
    }, botNumber * 1000);

    // Group join event
    sock.ev.on('group-participants.update', async ({ id, participants, action }) => {
      if (action === 'add' && participants.includes(sock.user.id)) {
        await sock.sendMessage(id, {
          video: { url: 'https://media.tenor.com/a2ckSILufD4AAAPo/attack-on-titan-aot.mp4' },
          gifPlayback: true,
          caption: `🌸 Arigato for inviting me! 🌸\n\nI'm your new group assistant~\nType *.menu* to see all my powers!\nLet's make this group even more fun together! (≧◡≦) ♡`
        });
      }
    });

    // Message handler
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;
      const m = messages[0];
      if (!m.message || m.key.fromMe || m.key.remoteJid === 'status@broadcast') return;

      const msgTimestamp = (m.messageTimestamp || m.messageTimestampMs || 0) * 1000;
      if (msgTimestamp && msgTimestamp < BOT_START_TIME) return;

      const chatId = m.key.remoteJid;
      const messageText = (m.message?.conversation || m.message?.extendedTextMessage?.text || '').toLowerCase();
      const command = messageText.split(' ')[0];

      // DM handling
      if (!chatId.endsWith('@g.us')) {
        if (command.startsWith('owner-')) {
          // Allow owner commands in DMsa
        } else {
          await sock.sendMessage(chatId, { text: '⚠️ Commands only work in groups!' }, { quoted: m });
          return;
        }
      }

      const senderId = (m.key.participant || chatId).split(':')[0];
      
      // Mute check
      if (mutedUsers[chatId]?.[senderId] > Date.now()) {
        try {
          await sock.sendMessage(chatId, { delete: m.key });
        } catch {}
        return;
      }

      // Anti-link
      try {
        await handleAntiLink(m, sock);
      } catch (e) {
        console.error('Anti-link error', e);
      }

      // Message body processing
     // After this line:
const body = m.message.conversation ||
    m.message.extendedTextMessage?.text ||
    m.message.imageMessage?.caption ||
    m.message.videoMessage?.caption || '';

// Add bad word filter check:
try {
  const badwordResult = await handleBadwords(m, sock, body);
  if (badwordResult) {
    // If badword filter handled the message (e.g., deleted or warned),
    // stop further processing to prevent commands running on bad messages
    return;
  }
} catch (err) {
  console.error('Bad word filter error:', err);
}


      // Owner mention response
      const ownerMentions = ownerIDs.map(id => '@' + id.split('@')[0]);
      if (ownerMentions.some(tag => body.includes(tag))) {
        const files = fs.existsSync(SONGS_DIR) ? fs.readdirSync(SONGS_DIR).filter(f => f.endsWith('.mp3')) : [];
        if (files.length > 0) {
          const randomSong = files[Math.floor(Math.random() * files.length)];
          const songPath = path.join(SONGS_DIR, randomSong);
          await sock.sendMessage(chatId, {
            audio: { url: songPath },
            mimetype: 'audio/mp4',
            ptt: false,
            contextInfo: {
              externalAdReply: {
                title: "𝕄𝕀𝕂𝔸𝕊𝔸",
                body: 'That Is Lord Raven Number...!',
                thumbnailUrl: 'https://pbs.twimg.com/media/E_P8bKGXMAADPWp.jpg',
                mediaType: 1,
                renderLargerThumbnail: false,
                showAdAttribution: false,
                sourceUrl: ''
              }
            }
          }, { quoted: m });
          return;
        }
      }

      // Command processing
      if (!body.startsWith(global.BOT_PREFIX)) return;

      if (bans.isBanned(senderId)) {
        await sock.sendMessage(chatId, { text: '🚫 You are *banned* from commands, contact mods to unban you!' }, { quoted: m });
        return;
      }

      const [cmdName, ...args] = body.slice(global.BOT_PREFIX.length).trim().split(/\s+/);
      const cmd = commands.get(cmdName.toLowerCase());
      if (!cmd) {
        await sock.sendMessage(chatId, { text: '❌ Invalid command. Type *.menu* to see all commands.' }, { quoted: m });
        return;
      }

      // Cooldown handling
      const isOwner = ownerIDs.includes(senderId);
      const cdKey = `${senderId}:${cmdName.toLowerCase()}`;
      const gambleAliases = ['gamble', 'g', 'gb'];
      
      if (!isOwner) {
        if (!gambleAliases.includes(cmdName.toLowerCase())) {
          if (cooldowns.has(cdKey) && Date.now() - cooldowns.get(cdKey) < COOLDOWN_MS) {
            const wait = Math.ceil((COOLDOWN_MS - (Date.now() - cooldowns.get(cdKey))) / 1000);
            await sock.sendMessage(chatId, { text: `⏳ Wait ${wait}s before using commands again.` }, { quoted: m });
            return;
          }
          cooldowns.set(cdKey, Date.now());
        }
      } else {
        userWarns[senderId] = 0;
      }

      // Execute command
        // 🔒 Custom message handler for anti-link etc
      try {
        await messageHandler(m, sock);
      } catch (err) {
        console.error('MessageHandler error:', err);
      }

      // Execute command
      try {
        await cmd.run(m, { 
          conn: sock, 
          args, 
          prefix: global.BOT_PREFIX, 
          ownerIDs, 
          mods,
          botNumber
        });

      } catch (e) {
        console.error(`❌ [Bot ${botNumber}] ${cmdName} error:`, e);
        await sock.sendMessage(chatId, { 
          text: '```⚠️ Something Went Wrong, Try Again!```' 
        }, { quoted: m });
      }
    });

  } catch (err) {
    console.error(`[Bot ${botNumber}] Initialization error:`, err);
    if (retryCount < 5) {
      const delay = Math.min(30000, 5000 * (retryCount + 1));
      console.log(`[Bot ${botNumber}] Retrying in ${delay/1000} seconds...`);
      setTimeout(() => startBot(botNumber, retryCount + 1), delay);
    }
  }
}

// Initialize bots sequentially with proper error handling
async function initializeBots() {
  console.log('Starting bot initialization...');
  
  try {
    // Start Bot 1
    console.log('Initializing Bot 1...');
    await startBot(1);
    
    // Wait before starting Bot 2
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Start Bot 2
    console.log('Initializing Bot 2...');
    await startBot(2);
    
    console.log('Both bots initialized successfully');
  } catch (err) {
    console.error('Bot initialization failed:', err);
    process.exit(1);
  }
}

// Start the bots
initializeBots().catch(err => {
  console.error('Fatal error during initialization:', err);
  process.exit(1);
});