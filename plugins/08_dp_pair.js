'use strict';

const axios  = require('axios');
const config = require('../config');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers,
  DisconnectReason,
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');
const fs   = require('fs');
const os   = require('os');

// ── .dp <number> ──────────────────────────────────────────────
module.exports = function(register) {

  register(['dp', 'getdp', 'dpview'], async (sock, msg, args, ctx) => {
    let num = args[0]?.replace(/[^0-9]/g, '');

    if (!num && msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
      num = msg.message.extendedTextMessage.contextInfo.mentionedJid[0].split('@')[0];
    }

    if (!num || num.length < 7) {
      return ctx.reply(
        `╭━━━「 🖼️ ᴅᴩ ᴠɪᴇᴡᴇʀ 」━━━\n│\n` +
        `│  ❌ *ᴇɴᴛᴇʀ ɴᴜᴍʙᴇʀ ғɪʀsᴛ!*\n│\n` +
        `│  📌 *ᴜsᴀɢᴇ:*\n` +
        `│  .dp 923001234567\n│\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━`
      );
    }

    await ctx.react('⏳');
    await ctx.reply(`🔍 ғᴇᴛᴄʜɪɴɢ ᴅᴘ...\n📞 *+${num}*`);

    try {
      const jid = num + '@s.whatsapp.net';
      let dpUrl = null;

      try { dpUrl = await sock.profilePictureUrl(jid, 'image'); } catch { dpUrl = null; }

      if (dpUrl) {
        const imgRes = await axios.get(dpUrl, { responseType: 'arraybuffer', timeout: 15000 });
        await sock.sendMessage(ctx.jid, {
          image   : Buffer.from(imgRes.data),
          caption :
            `╭━━━「 🖼️ ᴅᴩ ᴠɪᴇᴡᴇʀ 」━━━\n│\n` +
            `│  📞 *+${num}*\n` +
            `│  ✅ ᴅᴘ ғᴏᴜɴᴅ sᴜᴄᴇssғᴜʟʟʏ!\n│\n` +
            `│  _~ ᴜsᴍᴀɴ ᴍᴅ v1.0_\n` +
            `╰━━━━━━━━━━━━━━━━━━━━━━`,
        }, { quoted: msg });
        await ctx.react('✅');
      } else {
        const imgRes2 = await axios.get(`https://unavatar.io/whatsapp/${num}`, {
          responseType: 'arraybuffer', timeout: 15000,
          validateStatus: s => s < 500,
        });
        if (imgRes2.status === 200 && imgRes2.data.byteLength > 1000) {
          await sock.sendMessage(ctx.jid, {
            image   : Buffer.from(imgRes2.data),
            caption :
              `╭━━━「 🖼️ ᴅᴩ ᴠɪᴇᴡᴇʀ 」━━━\n│\n` +
              `│  📞 *+${num}*\n` +
              `│  ✅ ᴅᴘ ғᴏᴜɴᴅ sᴜᴄᴇssғᴜʟʟʏ!\n│\n` +
              `│  _~ ᴜsᴍᴀɴ ᴍᴅ v1.0_\n` +
              `╰━━━━━━━━━━━━━━━━━━━━━━`,
          }, { quoted: msg });
          await ctx.react('✅');
        } else {
          await ctx.reply(
            `╭━━━「 🖼️ ᴅᴩ ᴠɪᴇᴡᴇʀ 」━━━\n│\n` +
            `│  📞 *+${num}*\n` +
            `│  🔒 *ᴅᴘ ɴᴏᴛ ғᴏᴜɴᴅ!*\n│\n` +
            `│  ᴅᴘ ɪs ᴘʀɪᴠᴀᴛᴇ ᴏʀ ɴᴏʙᴏᴅʏ\n│\n` +
            `╰━━━━━━━━━━━━━━━━━━━━━━`
          );
          await ctx.react('❌');
        }
      }
    } catch (e) {
      await ctx.reply(`❌ *Error:* ${e.message}`);
      await ctx.react('❌');
    }
  });

  // ── .pair <number> ────────────────────────────────────────────
  // FIX: connected bot socket pe requestPairingCode call karne se
  // logout hota tha. Ab fresh temporary socket banta hai sirf
  // code generate karne ke liye — main bot disconnect NAHI hota.
  register(['pair', 'paircode', 'getpair'], async (sock, msg, args, ctx) => {

    let num = args[0]?.replace(/[^0-9]/g, '');
    if (!num || num.length < 7) {
      return ctx.reply(
        `╭━━━「 🔗 ᴘᴀɪʀ ᴄᴏᴅᴇ 」━━━\n│\n` +
        `│  ❌ *ᴇɴᴛᴇʀ ɴᴜᴍʙᴇʀ ғɪʀsᴛ!!*\n│\n` +
        `│  📌 *ᴜsᴀɢᴇ:*\n` +
        `│  .pair 923001234567\n│\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━`
      );
    }

    await ctx.react('⏳');
    await ctx.reply(`🔗 _ɢᴇɴᴇʀᴀᴛɪɴɢ ᴄᴏᴅᴇ..._\n📞 *+${num}*`);

    // Temporary auth folder (auto-deleted after use)
    const tmpDir = path.join(os.tmpdir(), 'usman_pair_' + num + '_' + Date.now());

    let tmpSock = null;

    try {
      fs.mkdirSync(tmpDir, { recursive: true });

      const { state, saveCreds } = await useMultiFileAuthState(tmpDir);
      const { version }          = await fetchLatestBaileysVersion();

      // Fresh unregistered socket — ispe requestPairingCode safe hai
      tmpSock = makeWASocket({
        version,
        auth: {
          creds : state.creds,
          keys  : makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
        },
        browser             : Browsers.ubuntu('Chrome'),
        printQRInTerminal   : false,
        logger              : pino({ level: 'silent' }),
        connectTimeoutMs    : 30_000,
        defaultQueryTimeoutMs: 30_000,
      });

      tmpSock.ev.on('creds.update', saveCreds);

      // Wait for socket to be ready for pairing
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Connection timeout (30s)')), 30_000);

        tmpSock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
          if (connection === 'open') {
            clearTimeout(timer);
            resolve();
          }
          if (connection === 'close') {
            clearTimeout(timer);
            // Already registered number — still try to get code
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            if (statusCode === DisconnectReason.loggedOut || statusCode === 405) {
              reject(new Error('Number already linked to another session'));
            } else {
              // Not connected but socket ready for pairing code
              resolve();
            }
          }
        });
      }).catch(() => {}); // Ignore — socket may not connect but can still pair

      // Small delay so socket stabilizes
      await new Promise(r => setTimeout(r, 1500));

      let code;
      try {
        code = await Promise.race([
          tmpSock.requestPairingCode(num),
          new Promise((_, rej) => setTimeout(() => rej(new Error('Pairing code timeout (20s)')), 20_000)),
        ]);
      } catch (pairErr) {
        throw pairErr;
      }

      if (!code) throw new Error('Empty code received — try again');

      const fmt = code.match(/.{1,4}/g)?.join('-') || code;

      await ctx.reply(
        `╭━━━「 🔗 ᴘᴀɪʀ ᴄᴏᴅᴇ 」━━━\n│\n` +
        `│  📞 *+${num}*\n│\n` +
        `│  🔑 *ᴘᴀɪʀɪɴɢ ᴄᴏᴅᴇ:*\n` +
        `│  ┌─────────────────┐\n` +
        `│  │  *${fmt}*  │\n` +
        `│  └─────────────────┘\n│\n` +
        `│  📋 *ʜᴏᴡ ᴛᴏ ʟɪɴᴋ:*\n` +
        `│  1️⃣ ᴏᴘᴇɴ ᴡʜᴀᴛsᴀᴘᴘ\n` +
        `│  2️⃣ ⋮ ᴍᴇɴᴜ → ʟɪɴᴋᴇᴅ ᴅᴇᴠɪᴄᴇs\n` +
        `│  3️⃣ ᴛᴀᴘ ʟɪɴᴋ ᴀ ᴅᴇᴠɪᴄᴇ\n` +
        `│  4️⃣ \"ʟɪɴᴋ ᴡɪᴛʜ ᴘʜᴏɴᴇ ɴᴜᴍʙᴇʀ\"\n` +
        `│  5️⃣ ᴇɴᴛᴇʀ ᴀʙᴏᴠᴇ ᴄᴏᴅᴇ ☝️\n│\n` +
        `│  ⏳ _ᴄᴏᴅᴇ ᴇxᴘɪʀᴇs ɪɴ 60s!_\n│\n` +
        `│  _~ ᴜsᴍᴀɴ ᴍᴅ v1.0_\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━`
      );
      await ctx.react('✅');

    } catch (e) {
      await ctx.reply(
        `╭━━━「 🔗 ᴘᴀɪʀ ᴄᴏᴅᴇ 」━━━\n│\n` +
        `│  ❌ *ᴄᴏᴅᴇ ɴᴏᴛ ɢᴇɴᴇʀᴀᴛᴇᴅ*\n│\n` +
        `│  _ᴇʀʀᴏʀ: ${e.message}_\n│\n` +
        `│  💡 *ᴛʀʏ ᴀɢᴀɪɴ ᴀ ʙɪᴛ ʟᴀᴛᴇʀ*\n│\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━`
      );
      await ctx.react('❌');
    } finally {
      // Always cleanup: close temp socket and delete temp auth folder
      try { tmpSock?.end(); } catch {}
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
    }
  });
};
