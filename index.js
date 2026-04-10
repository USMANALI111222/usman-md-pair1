'use strict';

const pino      = require('pino');
const { Boom }  = require('@hapi/boom');
const path      = require('path');
const fs        = require('fs');
const chalk     = require('chalk');
const readline  = require('readline');
const NodeCache = require('node-cache');
const http      = require('http');
const config    = require('./config');

// ── ESM BAILEYS (dynamic import fix) ─────────────────────────
let makeWASocket, useMultiFileAuthState, DisconnectReason,
    fetchLatestBaileysVersion, makeCacheableSignalKeyStore,
    getContentType, jidNormalizedUser, Browsers;

async function loadBaileys() {
  const B = await import('@whiskeysockets/baileys');
  makeWASocket               = B.default || B.makeWASocket;
  useMultiFileAuthState      = B.useMultiFileAuthState;
  DisconnectReason           = B.DisconnectReason;
  fetchLatestBaileysVersion  = B.fetchLatestBaileysVersion;
  makeCacheableSignalKeyStore = B.makeCacheableSignalKeyStore;
  getContentType             = B.getContentType;
  jidNormalizedUser          = B.jidNormalizedUser;
  Browsers                   = B.Browsers;
}

// ── WEB SERVER (Railway pairing site) ────────────────────────
const PORT = process.env.PORT || 3000;

let activeSock = null;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname === '/' || url.pathname === '/index.html') {
    const html = fs.readFileSync(path.join(__dirname, 'index.html'));
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(html);
  }

  if (url.pathname === '/pair') {
    const number = url.searchParams.get('number')?.replace(/\D/g, '');
    if (!number || number.length < 7) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Invalid number' }));
    }
    if (!activeSock) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Bot not ready yet, please wait a few seconds and retry' }));
    }
    if (activeSock.authState?.creds?.registered) {
      res.writeHead(409, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Bot is already paired. Restart to re-pair.' }));
    }
    activeSock.requestPairingCode(number)
      .then(code => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ code }));
      })
      .catch(e => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(chalk.cyan('  ✓ Web server : http://localhost:' + PORT));
});

// ── SILENT LOGGER ─────────────────────────────────────────────
const logger = pino({ level: 'silent' });

// ── MSG RETRY CACHE ───────────────────────────────────────────
const msgRetryCounterCache = new NodeCache();

// ── FAST IN-MEMORY STORE ─────────────────────────────────────
const store = {
  msgs: new Map(),
  save(jid, id, msg) {
    const key = jid + ':' + id;
    this.msgs.set(key, msg);
    if (this.msgs.size > 1000) {
      this.msgs.delete(this.msgs.keys().next().value);
    }
  },
  load(jid, id) {
    return this.msgs.get(jid + ':' + id) || null;
  },
};

// ── BOT STATE ────────────────────────────────────────────────
const botState = {
  antiLinkGroups : {},
  mutedGroups    : {},
  warnTracker    : {},
  spamTracker    : {},
  autoReact      : true,
};

// ── COMMAND REGISTRY ─────────────────────────────────────────
const commands = {};
function registerCommand(names, handler) {
  (Array.isArray(names) ? names : [names])
    .forEach(n => { commands[n.toLowerCase()] = handler; });
}

function loadPlugins() {
  const dir = path.join(__dirname, 'plugins');
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort().forEach(f => {
    try {
      require('./plugins/' + f)(registerCommand);
      console.log(chalk.green('  [+] ' + f));
    } catch (e) {
      console.log(chalk.red('  [x] ' + f + ': ' + e.message));
    }
  });
}

// ── BANNER ───────────────────────────────────────────────────
function printBanner() {
  console.clear();
  console.log(chalk.red.bold(
    '\n  ╔══════════════════════════════════════════╗\n' +
    '  ║  ██╗   ██╗███████╗███╗   ███╗ █████╗ ███╗  ║\n' +
    '  ║  ██║   ██║██╔════╝████╗ ████║██╔══██╗████╗ ║\n' +
    '  ║  ██║   ██║███████╗██╔████╔██║███████║██╔██╗ ║\n' +
    '  ║  ██║   ██║╚════██║██║╚██╔╝██║██╔══██║██║╚██╗║\n' +
    '  ║  ╚██████╔╝███████║██║ ╚═╝ ██║██║  ██║██║ ╚██║\n' +
    '  ║   ╚═════╝ ╚══════╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝║\n' +
    '  ╠══════════════════════════════════════════╣\n' +
    '  ║       ᴜsᴍᴀɴ ᴍᴅ v1.0  |  WhatsApp Bot ⚡   ║\n' +
    '  ║       ᴅᴇᴠ : ᴜsᴍᴀɴ  |  wa.me/923494730406 ║\n' +
    '  ╚══════════════════════════════════════════╝\n'
  ));
}

// ── HELPERS ──────────────────────────────────────────────────
const cleanJid  = jid => (jid || '').replace(/:[0-9]+@/, '@');
const getSender = msg  => cleanJid(msg.key.participant || msg.key.remoteJid || '');
const isGrpJid  = jid  => jid?.endsWith('@g.us');

function isOwnerCheck(msg) {
  if (msg.key.fromMe) return true;
  return getSender(msg).split('@')[0] === config.ownerNumber.replace(/[^0-9]/g, '');
}

// ── GETBODY ──────────────────────────────────────────────────
function getBody(msg) {
  if (!msg?.message) return '';
  const m = msg.message;
  const inner =
    m?.ephemeralMessage?.message ||
    m?.viewOnceMessage?.message ||
    m?.viewOnceMessageV2?.message ||
    m?.viewOnceMessageV2Extension?.message ||
    m?.documentWithCaptionMessage?.message ||
    m?.editedMessage?.message ||
    m?.interactiveResponseMessage ||
    m;
  const type = getContentType(inner);
  if (!type) return '';
  return (
    inner?.conversation ||
    inner?.extendedTextMessage?.text ||
    inner?.[type]?.text ||
    inner?.[type]?.caption ||
    m?.extendedTextMessage?.text ||
    m?.conversation ||
    m?.listResponseMessage?.singleSelectReply?.selectedRowId ||
    m?.buttonsResponseMessage?.selectedButtonId ||
    m?.templateButtonReplyMessage?.selectedId ||
    m?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson ||
    ''
  );
}

function getQuoted(msg) {
  const m = msg?.message;
  if (!m) return null;
  const inner =
    m?.ephemeralMessage?.message ||
    m?.viewOnceMessage?.message ||
    m?.viewOnceMessageV2?.message ||
    m;
  const type = getContentType(inner);
  return (type && inner?.[type]?.contextInfo?.quotedMessage) || null;
}

// ── SEND ─────────────────────────────────────────────────────
function sendReply(sock, jid, text, quotedMsg) {
  return sock.sendMessage(jid, { text: String(text) }, quotedMsg ? { quoted: quotedMsg } : {})
    .catch(e => console.log(chalk.red('  [SEND ERR] ' + e.message)));
}

// ── REACT MAP ────────────────────────────────────────────────
const reactMap = {
  ping:'🏓', alive:'🟢', info:'ℹ️', owner:'👑', uptime:'⏱️', ram:'💾',
  sticker:'🖼️', toimg:'🔄', tagall:'📢', tts:'🔊', q:'💬',
  kick:'🥾', add:'➕', promote:'⬆️', demote:'⬇️', mute:'🔇', unmute:'🔊',
  close:'🔒', unlock:'🔓', groupinfo:'📊', members:'👥', admins:'👑',
  antilink:'🛡️', warn:'⚠️', link:'🔗', revoke:'♻️',
  yta:'🎵', ytv:'🎬', play:'▶️', tiktok:'🎵', ig:'📸', fb:'📘',
  weather:'🌤️', translate:'🌐', wiki:'📖', qr:'📷', calc:'🧮', currency:'💱',
  joke:'😂', fact:'🤓', quote:'💡', '8ball':'🎱', truth:'🤫', dare:'🎯',
  ship:'💘', rate:'⭐', roast:'🔥', compliment:'💝', dice:'🎲', flip:'🪙',
  ai:'🤖', imagine:'🎨', lyrics:'🎵', movie:'🎬',
  broadcast:'📢', restart:'🔄', shutdown:'🛑', menu:'📋',
  gimage:'🖼️', tinyurl:'🔗', whois:'🔍', ss:'📸', ocr:'🔎',
  dp:'🖼️', pair:'🔗',
};

// ── SOCKET OPTIONS ───────────────────────────────────────────
function buildSocket(state, version) {
  return makeWASocket({
    version,
    logger,
    browser                        : ['Ubuntu', 'Chrome', '20.0.04'],
    printQRInTerminal              : false,
    auth: {
      creds : state.creds,
      keys  : makeCacheableSignalKeyStore(state.keys, logger),
    },
    msgRetryCounterCache,
    generateHighQualityLinkPreview : false,
    syncFullHistory                : false,
    markOnlineOnConnect            : false,
    connectTimeoutMs               : 30_000,
    keepAliveIntervalMs            : 15_000,
    retryRequestDelayMs            : 250,
    maxMsgRetryCount               : 2,
    defaultQueryTimeoutMs          : 20_000,
    getMessage(key) {
      const m = store.load(key.remoteJid, key.id);
      return Promise.resolve(m?.message || { conversation: '' });
    },
  });
}

// ── BOOT ─────────────────────────────────────────────────────
let waVersion  = null;
let isBooting  = false;

async function startBot() {
  if (isBooting) return;
  isBooting = true;

  await loadBaileys();

  printBanner();
  loadPlugins();

  const authDir = path.join(__dirname, 'auth_info_baileys');
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(authDir);

  if (!waVersion) {
    const { version, isLatest } = await fetchLatestBaileysVersion();
    waVersion = version;
    console.log(chalk.green('\n  ✓ Node.js : ' + process.version));
    console.log(chalk.green('  ✓ WA ver  : ' + version.join('.') + (isLatest ? ' (latest)' : '')));
    console.log('');
  }

  const sock = buildSocket(state, waVersion);
  sock.ev.on('creds.update', saveCreds);

  activeSock = sock;
  if (!sock.authState.creds.registered) {
    console.log(chalk.yellow('\n  ⏳ Bot not yet paired.'));
    console.log(chalk.cyan('  Open the website and enter your number to get a pairing code.\n'));
  }

  isBooting = false;
  attachEvents(sock, saveCreds);
}

// ── RECONNECT ────────────────────────────────────────────────
let reconnecting = false;
let retries      = 0;

async function doReconnect() {
  if (reconnecting) return;
  reconnecting = true;
  retries++;
  const wait = Math.min(2000 * retries, 12_000);
  console.log(chalk.yellow('  ↻ Retry #' + retries + ' in ' + (wait / 1000) + 's...'));
  await new Promise(r => setTimeout(r, wait));
  reconnecting = false;
  try {
    const authDir = path.join(__dirname, 'auth_info_baileys');
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    const sock = buildSocket(state, waVersion);
    activeSock = sock;
    sock.ev.on('creds.update', saveCreds);
    attachEvents(sock, saveCreds);
  } catch (e) {
    console.log(chalk.red('  [!] Reconnect error: ' + e.message));
    reconnecting = false;
    doReconnect();
  }
}

// ── EVENTS ───────────────────────────────────────────────────
function attachEvents(sock, saveCreds) {

  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {

    if (connection === 'connecting') {
      console.log(chalk.yellow('  🔄 Connecting...'));
    }

    if (connection === 'open') {
      retries      = 0;
      reconnecting = false;
      console.log('');
      console.log(chalk.bgRed.white.bold('  ✅  ᴜsᴍᴀɴ ᴍᴅ v1.0 CONNECTED!  '));
      console.log('');
      console.log(chalk.cyan('  JID   : ' + sock.user?.id));
      console.log(chalk.cyan('  Name  : ' + (sock.user?.name || '-')));
      console.log(chalk.cyan('  Prefix: ' + config.prefix));
      console.log(chalk.cyan('  Mode  : ' + (config.publicMode ? 'PUBLIC' : 'PRIVATE')));
      console.log(chalk.cyan('  Cmds  : ' + Object.keys(commands).length));
      console.log('');

      const ownerJid = config.ownerNumber.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
      sock.sendMessage(ownerJid, {
        text:
          '╭━━━━━━━━━━━━━━━━━━━━━━╮\n' +
          '│  ✅ *ᴜsᴍᴀɴ ᴍᴅ v1.0 ONLINE* │\n' +
          '╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n' +
          '⚙️ Prefix: *' + config.prefix + '*\n' +
          '📋 Commands: *' + Object.keys(commands).length + '*\n\n' +
          '_Type ' + config.prefix + 'menu for commands_\n~ ᴜsᴍᴀɴ ᴍᴅ v1.0',
      }).catch(() => {});

      setImmediate(() => sock.newsletterFollow(config.channelJid).catch(() => {}));
    }

    if (connection === 'close') {
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
      if (code === DisconnectReason.loggedOut || code === DisconnectReason.badSession) {
        console.log(chalk.red('\n  ✗ Logged out (code ' + code + ') — delete auth_info_baileys/ and restart\n'));
        process.exit(1);
      }
      if (code === 405 || code === DisconnectReason.connectionReplaced) {
        console.log(chalk.red('\n  ✗ Session conflict (405) — close other sessions and restart\n'));
        process.exit(1);
      }
      console.log(chalk.yellow('  ✗ Connection closed (code ' + code + ')'));
      doReconnect();
    }
  });

  sock.ev.on('messages.upsert', ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const m of messages) {
      if (m.key?.remoteJid && m.key?.id) store.save(m.key.remoteJid, m.key.id, m);
      if (!m.message) continue;
      setImmediate(() =>
        handleMessage(sock, m).catch(e =>
          console.log(chalk.red('  [ERR] ' + e.message))
        )
      );
    }
  });

  sock.ev.on('group-participants.update', update => {
    handleGroupUpdate(sock, update).catch(() => {});
  });
}

// ── MESSAGE HANDLER ──────────────────────────────────────────
async function handleMessage(sock, msg) {
  const jid  = msg.key.remoteJid;
  const body = getBody(msg);
  if (!jid || !body) return;

  const isOwner = isOwnerCheck(msg);
  if (msg.key.fromMe && !body.startsWith(config.prefix)) return;

  const sender = getSender(msg);
  if (config.antiSpam && !isOwner) {
    const now = Date.now();
    if (!botState.spamTracker[sender]) botState.spamTracker[sender] = [];
    const arr = botState.spamTracker[sender];
    let i = 0;
    while (i < arr.length && now - arr[i] >= 5000) i++;
    if (i > 0) arr.splice(0, i);
    arr.push(now);
    if (arr.length > config.antiSpamLimit) return;
  }

  const isGrp = isGrpJid(jid);
  if (isGrp && botState.mutedGroups[jid] && !isOwner) return;

  if (isGrp && botState.antiLinkGroups[jid] && !isOwner) {
    const linkRx = /(https?:\/\/\S+|wa\.me\/\S+|chat\.whatsapp\.com\/\S+)/i;
    if (linkRx.test(body)) {
      sock.sendMessage(jid, { delete: msg.key }).catch(() => {});
      const wkey = jid + '_' + sender;
      botState.warnTracker[wkey] = (botState.warnTracker[wkey] || 0) + 1;
      const w = botState.warnTracker[wkey];
      if (w >= config.antiLinkWarn) {
        sock.groupParticipantsUpdate(jid, [sender], 'remove').catch(() => {});
        sock.sendMessage(jid, {
          text: '🚫 *@' + sender.split('@')[0] + '* kicked after ' + config.antiLinkWarn + ' warnings.',
          mentions: [sender],
        }).catch(() => {});
        delete botState.warnTracker[wkey];
      } else {
        sock.sendMessage(jid, {
          text: '⚠️ *Anti-link ' + w + '/' + config.antiLinkWarn + '*\n@' + sender.split('@')[0] + ' no links!',
          mentions: [sender],
        }).catch(() => {});
      }
      return;
    }
  }

  if (!body.startsWith(config.prefix)) return;
  if (!config.publicMode && !isOwner) return;

  const parts = body.slice(config.prefix.length).trim().split(/\s+/);
  const cmd   = parts.shift().toLowerCase();
  const args  = parts;

  console.log(
    chalk.red('  ▶ ' + config.prefix + cmd) +
    chalk.gray(' | ' + sender.split('@')[0]) +
    chalk.gray(' | ' + (isGrp ? 'Group' : 'DM')) +
    (isOwner ? chalk.yellow(' | OWNER') : '')
  );

  const ctx = {
    jid, sender, isGrp, isOwner, body, args,
    botState,
    quoted         : getQuoted(msg),
    antiLinkGroups : botState.antiLinkGroups,
    mutedGroups    : botState.mutedGroups,
    warnTracker    : botState.warnTracker,
    channelLink    : config.channelLink,
    channelJid     : config.channelJid,
    animeImg       : config.animeImg,
    store,
    reply   : text            => sendReply(sock, jid, text, msg),
    send    : text            => sendReply(sock, jid, text, null),
    react   : emoji           => sock.sendMessage(jid, { react: { text: emoji, key: msg.key } }).catch(() => {}),
    rawSend : (content, opts) => sock.sendMessage(jid, content, { quoted: msg, ...(opts || {}) }),
  };

  const handler = commands[cmd];
  if (handler) {
    if (botState.autoReact) ctx.react(reactMap[cmd] || '✅');
    try {
      await handler(sock, msg, args, ctx);
    } catch (e) {
      console.log(chalk.red('  [ERR] ' + config.prefix + cmd + ': ' + e.message));
      sendReply(sock, jid, '❌ *Error:* ' + e.message, msg);
      ctx.react('❌');
    }
  } else {
    sendReply(sock, jid, '❌ *' + config.prefix + cmd + '* not found\n\nType *' + config.prefix + 'menu* for commands.', msg);
  }
}

// ── GROUP HANDLER ─────────────────────────────────────────────
async function handleGroupUpdate(sock, update) {
  const { id, participants, action } = update;
  let meta;
  try { meta = await sock.groupMetadata(id); } catch { return; }
  for (const p of participants) {
    const num = p.split('@')[0];
    if (action === 'add' && config.welcomeMsg) {
      sendReply(sock, id,
        '╭━━━━━━━━━━━━━━━━━━━━━━━━╮\n' +
        '│  👋 *WELCOME!*           │\n' +
        '╰━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n' +
        '🎉 Welcome @' + num + '!\n' +
        '📌 Group: *' + meta.subject + '*\n' +
        '👥 Members: *' + meta.participants.length + '*\n\n' +
        '_Read the rules and enjoy!_\n~ ᴜsᴍᴀɴ ᴍᴅ v1.0', null
      ).catch(() => {});
    }
    if (action === 'remove' && config.goodbyeMsg) {
      sock.sendMessage(id, {
        text     : '👋 *@' + num + '* left *' + meta.subject + '*\n~ ᴜsᴍᴀɴ ᴍᴅ v1.0',
        mentions : [p],
      }).catch(() => {});
    }
  }
}

// ── GLOBAL HANDLERS ───────────────────────────────────────────
process.on('uncaughtException',  e => console.log(chalk.red('  [!] ' + e.message)));
process.on('unhandledRejection', e => console.log(chalk.red('  [!] ' + String(e))));

// ── START ─────────────────────────────────────────────────────
startBot().catch(e => {
  console.log(chalk.red('  [FATAL] ' + e.message));
  setTimeout(startBot, 5000);
});
                              
