'use strict';

const { downloadContentFromMessage, getContentType } = require('@whiskeysockets/baileys');
const axios  = require('axios');
const config = require('../config');
const os     = require('os');

const up = () => { const s=process.uptime(); return `${Math.floor(s/3600)}ʜ ${Math.floor((s%3600)/60)}ᴍ ${Math.floor(s%60)}s`; };

module.exports = function(register) {

  register(['alive','online','bot'], async (sock, msg, args, ctx) => {
    await ctx.reply(
      `╭━━━「 🟢 ᴀʟɪᴠᴇ 」━━━\n│\n` +
      `│  🤖  *${config.botName}*\n` +
      `│  👨‍💻  *${config.ownerName}*\n` +
      `│  ⏱️  *${up()}*\n` +
      `│  💾  *${Math.round(process.memoryUsage().heapUsed/1024/1024)} ᴍʙ*\n` +
      `│  💻  *${process.version}*\n` +
      `│  📱  *${os.platform()}*\n` +
      `│\n╰━━━━━━━━━━━━━━━━━━━━━━`
    );
    await ctx.react('✅');
  });

  register(['ping'], async (sock, msg, args, ctx) => {
    const t = Date.now();
    await sock.sendMessage(ctx.jid, { text: '🏓 ᴘɪɴɢɪɴɢ...' }, { quoted: msg });
    await ctx.reply(`⚡ *ᴘᴏɴɢ!* — *${Date.now()-t}ms*`);
    await ctx.react('⚡');
  });

  register(['info','botinfo'], async (sock, msg, args, ctx) => {
    await ctx.reply(
      `╭━━━「 ℹ️ ɪɴꜰᴏ 」━━━\n│\n` +
      `│  🤖  *${config.botName}*\n` +
      `│  👨‍💻  *${config.ownerName}*\n` +
      `│  🌐  *${config.ownerContact}*\n` +
      `│  📚  Baileys CJS v6.5\n` +
      `│  💻  ${process.version}\n` +
      `│  ⏱️  ${up()}\n` +
      `│  ⚙️  Prefix: *${config.prefix}*\n` +
      `│\n╰━━━━━━━━━━━━━━━━━━━━━━`
    );
    await ctx.react('ℹ️');
  });

  register(['owner','dev'], async (sock, msg, args, ctx) => {
    await ctx.reply(`👑 *ᴏᴡɴᴇʀ*\n\n👤 *${config.ownerName}*\n📱 wa.me/${config.ownerNumber}\n🌐 ${config.ownerContact}`);
    await ctx.react('👑');
  });

  register(['uptime','runtime'], async (sock, msg, args, ctx) => {
    await ctx.reply(`⏱️ *ᴜᴘᴛɪᴍᴇ:* ${up()}`);
    await ctx.react('⏱️');
  });

  register(['ram','memory'], async (sock, msg, args, ctx) => {
    const u = process.memoryUsage();
    await ctx.reply(`💾 *ʀᴀᴍ*\n\nᴜsᴇᴅ  : ${Math.round(u.heapUsed/1024/1024)} MB\nᴛᴏᴛᴀʟ : ${Math.round(u.heapTotal/1024/1024)} MB\nʀss   : ${Math.round(u.rss/1024/1024)} MB`);
    await ctx.react('💾');
  });

  register(['sticker','s','stiker'], async (sock, msg, args, ctx) => {
    const allMsg = ctx.quoted ? ctx.quoted : msg.message;
    const type   = getContentType(allMsg);
    const media  = allMsg && allMsg[type];
    if (!media || !media.mimetype?.startsWith('image')) {
      return ctx.reply('❌ *ʀᴇᴘʟʏ ᴛᴏ ᴀɴ ɪᴍᴀɢᴇ!*');
    }
    try {
      await ctx.react('⏳');
      let sharp;
      try { sharp = require('sharp'); } catch { return ctx.reply('❌ sharp not installed. Run: npm install sharp'); }
      const stream = await downloadContentFromMessage(media, 'image');
      let buf = Buffer.alloc(0);
      for await (const c of stream) buf = Buffer.concat([buf, c]);
      const webp = await sharp(buf).resize(512,512,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).webp({quality:80}).toBuffer();
      await sock.sendMessage(ctx.jid, { sticker: webp }, { quoted: msg });
      await ctx.react('✅');
    } catch (e) {
      await ctx.reply('❌ ' + e.message);
      await ctx.react('❌');
    }
  });

  register(['toimg','stickertoimg'], async (sock, msg, args, ctx) => {
    const allMsg = ctx.quoted;
    if (!allMsg) return ctx.reply('❌ ʀᴇᴘʟʏ ᴛᴏ ᴀ sᴛɪᴄᴋᴇʀ!');
    const type  = getContentType(allMsg);
    const media = allMsg[type];
    if (!media?.mimetype?.includes('webp')) return ctx.reply('❌ sᴛɪᴄᴋᴇʀ ᴏɴʟʏ!');
    try {
      await ctx.react('⏳');
      const stream = await downloadContentFromMessage(media, 'sticker');
      let buf = Buffer.alloc(0);
      for await (const c of stream) buf = Buffer.concat([buf, c]);
      await ctx.rawSend({ image: buf, caption: '✅ *ᴄᴏɴᴠᴇʀᴛᴇᴅ ʙʏ ᴜsᴍᴀɴ ᴍᴅ*' });
      await ctx.react('✅');
    } catch (e) {
      await ctx.reply('❌ ' + e.message);
      await ctx.react('❌');
    }
  });

  register(['tagall','everyone','all'], async (sock, msg, args, ctx) => {
    if (!ctx.isGrp) return ctx.reply('❌ ɢʀᴏᴜᴘ ᴏɴʟʏ!');
    const meta = await sock.groupMetadata(ctx.jid).catch(() => null);
    if (!meta) return ctx.reply('❌ ᴇʀʀᴏʀ');
    const mentions = meta.participants.map(p => p.id);
    const text     = args.join(' ') || '📢 *ᴀᴛᴛᴇɴᴛɪᴏɴ ᴇᴠᴇʀʏᴏɴᴇ!*';
    await sock.sendMessage(ctx.jid, { text: `${text}\n\n${mentions.map(m=>'@'+m.split('@')[0]).join(' ')}`, mentions });
    await ctx.react('📢');
  });

  register(['tts','speak'], async (sock, msg, args, ctx) => {
    const text = args.join(' ');
    if (!text) return ctx.reply('❌ .tts <text>');
    try {
      await ctx.react('⏳');
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=tw-ob`;
      const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
      await ctx.rawSend({ audio: Buffer.from(res.data), mimetype: 'audio/mp4', ptt: true });
      await ctx.react('🔊');
    } catch (e) {
      await ctx.reply('❌ ᴛᴛs ꜰᴀɪʟᴇᴅ: ' + e.message);
      await ctx.react('❌');
    }
  });

  register(['q','quote'], async (sock, msg, args, ctx) => {
    const text = args.join(' ');
    if (!text) return ctx.reply('❌ .q <text>');
    await ctx.reply(`❝ _${text}_ ❞\n— *ᴀɴᴏɴʏᴍᴏᴜs*`);
    await ctx.react('💬');
  });
};
