'use strict';

const config = require('../config');
const fs     = require('fs');
const path   = require('path');

module.exports = function(register) {

  register(['broadcast', 'bc'], async (sock, msg, args, ctx) => {
    if (!ctx.isOwner) return ctx.reply('❌ Owner only!');
    const text = args.join(' ');
    if (!text) return ctx.reply('❌ .broadcast <message>');
    let sent = 0, failed = 0;
    const allChats = Object.keys(ctx.store?.messages || {});
    if (!allChats.length) return ctx.reply('❌ No chats in store yet. Send a message first.');
    for (const jid of allChats) {
      try {
        await sock.sendMessage(jid, { text: `📢 *Broadcast*\n\n${text}\n\n— *${config.botName}*` });
        sent++;
        await new Promise(r => setTimeout(r, 1000));
      } catch { failed++; }
    }
    await ctx.reply(`✅ Broadcast done\n📤 Sent: *${sent}*\n❌ Failed: *${failed}*`);
  });

  register(['block'], async (sock, msg, args, ctx) => {
    if (!ctx.isOwner) return ctx.reply('❌ Owner only!');
    const m = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!m.length) return ctx.reply('❌ Tag a user!');
    await sock.updateBlockStatus(m[0], 'block')
      .then(() => ctx.reply(`🚫 @${m[0].split('@')[0]} blocked`))
      .catch(e => ctx.reply('❌ ' + e.message));
  });

  register(['unblock'], async (sock, msg, args, ctx) => {
    if (!ctx.isOwner) return ctx.reply('❌ Owner only!');
    const m = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!m.length) return ctx.reply('❌ Tag a user!');
    await sock.updateBlockStatus(m[0], 'unblock')
      .then(() => ctx.reply(`✅ @${m[0].split('@')[0]} unblocked`))
      .catch(e => ctx.reply('❌ ' + e.message));
  });

  register(['setmode', 'mode'], async (sock, msg, args, ctx) => {
    if (!ctx.isOwner) return ctx.reply('❌ Owner only!');
    const m = args[0]?.toLowerCase();
    if (m === 'public')       { config.publicMode = true;  await ctx.reply('✅ Mode: *PUBLIC*'); }
    else if (m === 'private') { config.publicMode = false; await ctx.reply('✅ Mode: *PRIVATE*'); }
    else await ctx.reply('❌ .setmode public / .setmode private');
  });

  register(['restart', 'reboot'], async (sock, msg, args, ctx) => {
    if (!ctx.isOwner) return ctx.reply('❌ Owner only!');
    await ctx.reply('🔄 *Restarting...*');
    setTimeout(() => process.exit(0), 2000);
  });

  register(['shutdown', 'stop', 'off'], async (sock, msg, args, ctx) => {
    if (!ctx.isOwner) return ctx.reply('❌ Owner only!');
    await ctx.reply('🛑 *Shutting down...*');
    setTimeout(() => process.exit(0), 2000);
  });

  register(['joingroup', 'join'], async (sock, msg, args, ctx) => {
    if (!ctx.isOwner) return ctx.reply('❌ Owner only!');
    const link = args[0];
    if (!link) return ctx.reply('❌ .joingroup <link>');
    const code = link.split('chat.whatsapp.com/')[1];
    if (!code) return ctx.reply('❌ Invalid link');
    await sock.groupAcceptInvite(code)
      .then(() => ctx.reply('✅ Joined!'))
      .catch(e => ctx.reply('❌ ' + e.message));
  });

  register(['leavegroup', 'leave'], async (sock, msg, args, ctx) => {
    if (!ctx.isOwner) return ctx.reply('❌ Owner only!');
    if (!ctx.isGrp) return ctx.reply('❌ Group only!');
    await ctx.reply('👋 Leaving...');
    await sock.groupLeave(ctx.jid).catch(() => {});
  });

  register(['getdb', 'backup'], async (sock, msg, args, ctx) => {
    if (!ctx.isOwner) return ctx.reply('❌ Owner only!');
    const p = path.join(__dirname, '..', 'auth_info_baileys', 'creds.json');
    if (!fs.existsSync(p)) return ctx.reply('❌ No creds file found');
    await ctx.rawSend({
      document : fs.readFileSync(p),
      mimetype : 'application/json',
      fileName : 'usman_md_creds.json',
      caption  : '✅ *Creds Backup*\nKeep this file safe!',
    });
  });

  register(['setbio', 'bio'], async (sock, msg, args, ctx) => {
    if (!ctx.isOwner) return ctx.reply('❌ Owner only!');
    const text = args.join(' ');
    if (!text) return ctx.reply('❌ .setbio <text>');
    await sock.updateProfileStatus(text)
      .then(() => ctx.reply('✅ Bio updated!'))
      .catch(e => ctx.reply('❌ ' + e.message));
  });

  register(['botname'], async (sock, msg, args, ctx) => {
    if (!ctx.isOwner) return ctx.reply('❌ Owner only!');
    const name = args.join(' ');
    if (!name) return ctx.reply('❌ .botname <name>');
    await sock.updateProfileName(name)
      .then(() => ctx.reply(`✅ Name → *${name}*`))
      .catch(e => ctx.reply('❌ ' + e.message));
  });

  register(['listgroups', 'groups'], async (sock, msg, args, ctx) => {
    if (!ctx.isOwner) return ctx.reply('❌ Owner only!');
    try {
      const groups = await sock.groupFetchAllParticipating();
      const list   = Object.values(groups);
      if (!list.length) return ctx.reply('❌ No groups');
      const text = list.map((g, i) => `${i + 1}. *${g.subject}* (${g.participants.length})`).join('\n');
      await ctx.reply(`🏘️ *Groups (${list.length})*\n\n${text}`);
    } catch (e) { await ctx.reply('❌ ' + e.message); }
  });

  register(['clearauth', 'logout'], async (sock, msg, args, ctx) => {
    if (!ctx.isOwner) return ctx.reply('❌ Owner only!');
    await ctx.reply('🔐 Logging out and clearing session...\nRestart with: node index.js');
    setTimeout(() => {
      const authDir = path.join(__dirname, '..', 'auth_info_baileys');
      if (fs.existsSync(authDir)) fs.rmSync(authDir, { recursive: true, force: true });
      process.exit(0);
    }, 3000);
  });

  // ── Auto React Toggle ──────────────────────────────────────
  register(['autoreact', 'ar'], async (sock, msg, args, ctx) => {
    if (!ctx.isOwner) return ctx.reply('❌ Owner only!');
    const opt = args[0]?.toLowerCase();
    if (opt === 'on') {
      ctx.botState.autoReact = true;
      await ctx.reply('✅ *Auto React: ON*\nBot will react to every command.');
    } else if (opt === 'off') {
      ctx.botState.autoReact = false;
      await ctx.reply('✅ *Auto React: OFF*\nBot reactions disabled.');
    } else {
      await ctx.reply(`🔔 *Auto React:* ${ctx.botState.autoReact ? '🟢 ON' : '🔴 OFF'}\n\n.autoreact on / .autoreact off`);
    }
  });

  // ── Tag + Message ──────────────────────────────────────────
  register(['tagmsg', 'announce'], async (sock, msg, args, ctx) => {
    if (!ctx.isOwner) return ctx.reply('❌ Owner only!');
    if (!ctx.isGrp) return ctx.reply('❌ Group only!');
    const text = args.join(' ');
    if (!text) return ctx.reply('❌ .tagmsg <message>');
    const meta     = await sock.groupMetadata(ctx.jid).catch(() => null);
    if (!meta) return ctx.reply('❌ Failed');
    const mentions = meta.participants.map(p => p.id);
    const tag      = mentions.map(m => '@' + m.split('@')[0]).join(' ');
    await sock.sendMessage(ctx.jid, {
      text: `📢 *${text}*\n\n${tag}`,
      mentions,
    });
  });

  // ── Delete message ─────────────────────────────────────────
  register(['del', 'delete'], async (sock, msg, args, ctx) => {
    if (!ctx.isOwner && !ctx.isGrp) return ctx.reply('❌ Owner/Admin only!');
    const quoted = msg.message?.extendedTextMessage?.contextInfo;
    if (!quoted?.stanzaId) return ctx.reply('❌ Reply to the message you want to delete!');
    const delKey = {
      remoteJid  : ctx.jid,
      fromMe     : quoted.participant === sock.user?.id,
      id         : quoted.stanzaId,
      participant: quoted.participant,
    };
    await sock.sendMessage(ctx.jid, { delete: delKey })
      .then(() => ctx.reply('🗑️ Deleted!'))
      .catch(e => ctx.reply('❌ ' + e.message));
  });

  // ── Status broadcast ───────────────────────────────────────
  register(['statusbc', 'setstatus'], async (sock, msg, args, ctx) => {
    if (!ctx.isOwner) return ctx.reply('❌ Owner only!');
    const text = args.join(' ');
    if (!text) return ctx.reply('❌ .setstatus <text>');
    await sock.sendMessage('status@broadcast', { text })
      .then(() => ctx.reply('✅ Status posted!'))
      .catch(e => ctx.reply('❌ ' + e.message));
  });
};
