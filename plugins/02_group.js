'use strict';

const { downloadContentFromMessage, getContentType } = require('@whiskeysockets/baileys');
const config = require('../config');

function isAdmin(participants, jid) {
  const c = jid.replace(/:[0-9]+@/, '@');
  return participants.some(p => (p.id===jid||p.id===c) && (p.admin==='admin'||p.admin==='superadmin'));
}

module.exports = function(register) {

  async function checkAdmin(sock, ctx) {
    if (ctx.isOwner) return true;
    const meta = await sock.groupMetadata(ctx.jid).catch(() => null);
    return meta ? isAdmin(meta.participants, ctx.sender) : false;
  }

  register(['kick','remove','ban'], async (sock, msg, args, ctx) => {
    if (!ctx.isGrp) return ctx.reply('❌ ɢʀᴏᴜᴘ ᴏɴʟʏ!');
    if (!await checkAdmin(sock, ctx)) return ctx.reply('❌ ᴀᴅᴍɪɴs ᴏɴʟʏ!');
    const m = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!m.length) return ctx.reply('❌ .kick @user');
    for (const u of m) {
      await sock.groupParticipantsUpdate(ctx.jid, [u], 'remove')
        .then(() => ctx.reply(`✅ @${u.split('@')[0]} ᴋɪᴄᴋᴇᴅ.`))
        .catch(e => ctx.reply(`❌ ${e.message}`));
    }
    await ctx.react('🥾');
  });

  register(['add'], async (sock, msg, args, ctx) => {
    if (!ctx.isGrp) return ctx.reply('❌ ɢʀᴏᴜᴘ ᴏɴʟʏ!');
    if (!await checkAdmin(sock, ctx)) return ctx.reply('❌ ᴀᴅᴍɪɴs ᴏɴʟʏ!');
    const num = args[0]?.replace(/[^0-9]/g, '');
    if (!num) return ctx.reply('❌ .add <number>');
    await sock.groupParticipantsUpdate(ctx.jid, [num+'@s.whatsapp.net'], 'add')
      .then(() => { ctx.reply(`✅ *+${num}* ᴀᴅᴅᴇᴅ!`); ctx.react('➕'); })
      .catch(e => { ctx.reply('❌ '+e.message); ctx.react('❌'); });
  });

  register(['promote','admin'], async (sock, msg, args, ctx) => {
    if (!ctx.isGrp) return ctx.reply('❌ ɢʀᴏᴜᴘ ᴏɴʟʏ!');
    if (!await checkAdmin(sock, ctx)) return ctx.reply('❌ ᴀᴅᴍɪɴs ᴏɴʟʏ!');
    const m = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!m.length) return ctx.reply('❌ .promote @user');
    await sock.groupParticipantsUpdate(ctx.jid, m, 'promote')
      .then(() => { ctx.reply(`⬆️ @${m[0].split('@')[0]} ᴘʀᴏᴍᴏᴛᴇᴅ!`); ctx.react('⬆️'); })
      .catch(e => ctx.reply('❌ '+e.message));
  });

  register(['demote','unadmin'], async (sock, msg, args, ctx) => {
    if (!ctx.isGrp) return ctx.reply('❌ ɢʀᴏᴜᴘ ᴏɴʟʏ!');
    if (!await checkAdmin(sock, ctx)) return ctx.reply('❌ ᴀᴅᴍɪɴs ᴏɴʟʏ!');
    const m = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!m.length) return ctx.reply('❌ .demote @user');
    await sock.groupParticipantsUpdate(ctx.jid, m, 'demote')
      .then(() => { ctx.reply(`⬇️ @${m[0].split('@')[0]} ᴅᴇᴍᴏᴛᴇᴅ.`); ctx.react('⬇️'); })
      .catch(e => ctx.reply('❌ '+e.message));
  });

  register(['mute'], async (sock, msg, args, ctx) => {
    if (!ctx.isGrp) return ctx.reply('❌ ɢʀᴏᴜᴘ ᴏɴʟʏ!');
    await sock.groupSettingUpdate(ctx.jid, 'announcement')
      .then(() => { ctx.reply('🔇 *ɢʀᴏᴜᴘ ᴍᴜᴛᴇᴅ!*'); ctx.react('🔇'); })
      .catch(e => ctx.reply('❌ '+e.message));
  });

  register(['unmute','open'], async (sock, msg, args, ctx) => {
    if (!ctx.isGrp) return ctx.reply('❌ ɢʀᴏᴜᴘ ᴏɴʟʏ!');
    await sock.groupSettingUpdate(ctx.jid, 'not_announcement')
      .then(() => { ctx.reply('🔊 *ɢʀᴏᴜᴘ ᴜɴᴍᴜᴛᴇᴅ!*'); ctx.react('🔊'); })
      .catch(e => ctx.reply('❌ '+e.message));
  });

  register(['close','lock'], async (sock, msg, args, ctx) => {
    if (!ctx.isGrp) return ctx.reply('❌ ɢʀᴏᴜᴘ ᴏɴʟʏ!');
    await sock.groupSettingUpdate(ctx.jid, 'locked')
      .then(() => { ctx.reply('🔒 *ʟᴏᴄᴋᴇᴅ!*'); ctx.react('🔒'); })
      .catch(e => ctx.reply('❌ '+e.message));
  });

  register(['unlock'], async (sock, msg, args, ctx) => {
    if (!ctx.isGrp) return ctx.reply('❌ ɢʀᴏᴜᴘ ᴏɴʟʏ!');
    await sock.groupSettingUpdate(ctx.jid, 'unlocked')
      .then(() => { ctx.reply('🔓 *ᴜɴʟᴏᴄᴋᴇᴅ!*'); ctx.react('🔓'); })
      .catch(e => ctx.reply('❌ '+e.message));
  });

  register(['groupinfo','ginfo'], async (sock, msg, args, ctx) => {
    if (!ctx.isGrp) return ctx.reply('❌ ɢʀᴏᴜᴘ ᴏɴʟʏ!');
    const meta = await sock.groupMetadata(ctx.jid).catch(() => null);
    if (!meta) return ctx.reply('❌ ꜰᴀɪʟᴇᴅ');
    await ctx.reply(
      `╭━━━「 📊 ɢʀᴏᴜᴘ ɪɴꜰᴏ 」━━━\n│\n` +
      `│  📌 *${meta.subject}*\n` +
      `│  📝 ${meta.desc || 'ɴᴏ ᴅᴇsᴄ'}\n` +
      `│  👥 ᴍᴇᴍʙᴇʀs : *${meta.participants.length}*\n` +
      `│  👑 ᴀᴅᴍɪɴs  : *${meta.participants.filter(p=>p.admin).length}*\n` +
      `│  📅 ${new Date(meta.creation*1000).toLocaleDateString()}\n` +
      `│\n╰━━━━━━━━━━━━━━━━━━━━━━`
    );
    await ctx.react('📊');
  });

  register(['members','list'], async (sock, msg, args, ctx) => {
    if (!ctx.isGrp) return ctx.reply('❌ ɢʀᴏᴜᴘ ᴏɴʟʏ!');
    const meta = await sock.groupMetadata(ctx.jid).catch(() => null);
    if (!meta) return ctx.reply('❌ ᴇʀʀᴏʀ');
    const list = meta.participants.map((p,i) => `  ${i+1}. @${p.id.split('@')[0]}${p.admin?' 👑':''}`).join('\n');
    await sock.sendMessage(ctx.jid, { text: `╭━━━「 👥 ᴍᴇᴍʙᴇʀs (${meta.participants.length}) 」━━━\n│\n${list}\n│\n╰━━━━━━━━━━━━━━━━━━━━━━`, mentions: meta.participants.map(p=>p.id) });
    await ctx.react('👥');
  });

  register(['admins','adminlist'], async (sock, msg, args, ctx) => {
    if (!ctx.isGrp) return ctx.reply('❌ ɢʀᴏᴜᴘ ᴏɴʟʏ!');
    const meta   = await sock.groupMetadata(ctx.jid).catch(() => null);
    if (!meta) return ctx.reply('❌ ᴇʀʀᴏʀ');
    const admins = meta.participants.filter(p=>p.admin);
    const list   = admins.map((p,i) => `  ${i+1}. @${p.id.split('@')[0]}`).join('\n');
    await sock.sendMessage(ctx.jid, { text: `╭━━━「 👑 ᴀᴅᴍɪɴs (${admins.length}) 」━━━\n│\n${list}\n│\n╰━━━━━━━━━━━━━━━━━━━━━━`, mentions: admins.map(p=>p.id) });
    await ctx.react('👑');
  });

  register(['setname','rename'], async (sock, msg, args, ctx) => {
    if (!ctx.isGrp) return ctx.reply('❌ ɢʀᴏᴜᴘ ᴏɴʟʏ!');
    const name = args.join(' ');
    if (!name) return ctx.reply('❌ .setname <n>');
    await sock.groupUpdateSubject(ctx.jid, name)
      .then(() => { ctx.reply(`✅ → *${name}*`); ctx.react('✅'); })
      .catch(e => ctx.reply('❌ '+e.message));
  });

  register(['setdesc','desc'], async (sock, msg, args, ctx) => {
    if (!ctx.isGrp) return ctx.reply('❌ ɢʀᴏᴜᴘ ᴏɴʟʏ!');
    const desc = args.join(' ');
    if (!desc) return ctx.reply('❌ .setdesc <text>');
    await sock.groupUpdateDescription(ctx.jid, desc)
      .then(() => { ctx.reply('✅ ᴅᴇsᴄ ᴜᴘᴅᴀᴛᴇᴅ!'); ctx.react('✅'); })
      .catch(e => ctx.reply('❌ '+e.message));
  });

  register(['link','invitelink'], async (sock, msg, args, ctx) => {
    if (!ctx.isGrp) return ctx.reply('❌ ɢʀᴏᴜᴘ ᴏɴʟʏ!');
    await sock.groupInviteCode(ctx.jid)
      .then(c => { ctx.reply(`🔗 https://chat.whatsapp.com/${c}`); ctx.react('🔗'); })
      .catch(() => ctx.reply('❌ ɴᴇᴇᴅ ᴀᴅᴍɪɴ'));
  });

  register(['revoke','revokelink'], async (sock, msg, args, ctx) => {
    if (!ctx.isGrp) return ctx.reply('❌ ɢʀᴏᴜᴘ ᴏɴʟʏ!');
    await sock.groupRevokeInvite(ctx.jid)
      .then(() => { ctx.reply('♻️ ʀᴇᴠᴏᴋᴇᴅ!'); ctx.react('♻️'); })
      .catch(e => ctx.reply('❌ '+e.message));
  });

  register(['antilink','al'], async (sock, msg, args, ctx) => {
    if (!ctx.isGrp) return ctx.reply('❌ ɢʀᴏᴜᴘ ᴏɴʟʏ!');
    if (!await checkAdmin(sock, ctx)) return ctx.reply('❌ ᴀᴅᴍɪɴs ᴏɴʟʏ!');
    const opt = args[0]?.toLowerCase();
    if (opt === 'on') {
      ctx.antiLinkGroups[ctx.jid] = true;
      await ctx.reply(`🛡️ *ᴀɴᴛɪ-ʟɪɴᴋ ON!*\n├ ʟɪɴᴋs ᴅᴇʟᴇᴛᴇᴅ\n├ ${config.antiLinkWarn} ᴡᴀʀɴs → ᴋɪᴄᴋ\n└ ᴀᴅᴍɪɴs ᴇxᴇᴍᴘᴛ`);
    } else if (opt === 'off') {
      delete ctx.antiLinkGroups[ctx.jid];
      await ctx.reply('✅ *ᴀɴᴛɪ-ʟɪɴᴋ OFF*');
    } else {
      await ctx.reply(`🛡️ ᴀɴᴛɪ-ʟɪɴᴋ: ${ctx.antiLinkGroups[ctx.jid]?'🟢 ON':'🔴 OFF'}\n\n.antilink on / .antilink off`);
    }
    await ctx.react('🛡️');
  });

  register(['warn','warning'], async (sock, msg, args, ctx) => {
    if (!ctx.isGrp) return ctx.reply('❌ ɢʀᴏᴜᴘ ᴏɴʟʏ!');
    if (!await checkAdmin(sock, ctx)) return ctx.reply('❌ ᴀᴅᴍɪɴs ᴏɴʟʏ!');
    const m = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!m.length) return ctx.reply('❌ .warn @user [reason]');
    const user   = m[0];
    const reason = args.filter(a => !a.startsWith('@')).join(' ') || 'ʀᴜʟᴇ ᴠɪᴏʟᴀᴛɪᴏɴ';
    const key    = `${ctx.jid}_${user}`;
    ctx.warnTracker[key] = (ctx.warnTracker[key] || 0) + 1;
    const count  = ctx.warnTracker[key];
    if (count >= config.antiLinkWarn) {
      await sock.groupParticipantsUpdate(ctx.jid, [user], 'remove').catch(() => {});
      await sock.sendMessage(ctx.jid, { text: `🚫 @${user.split('@')[0]} ᴋɪᴄᴋᴇᴅ!`, mentions: [user] });
      delete ctx.warnTracker[key];
    } else {
      await sock.sendMessage(ctx.jid, { text: `⚠️ *ᴡᴀʀɴɪɴɢ ${count}/${config.antiLinkWarn}*\n@${user.split('@')[0]}\n📝 ${reason}`, mentions: [user] });
    }
    await ctx.react('⚠️');
  });

  register(['warnlist','warns'], async (sock, msg, args, ctx) => {
    const entries = Object.entries(ctx.warnTracker).filter(([k]) => k.startsWith(ctx.jid));
    if (!entries.length) return ctx.reply('✅ ɴᴏ ᴡᴀʀɴɪɴɢs.');
    await ctx.reply(`⚠️ *ᴡᴀʀɴs*\n\n${entries.map(([k,v]) => `• @${k.split('_')[1]?.split('@')[0]}: *${v}*`).join('\n')}`);
  });

  register(['clearwarn','resetwarn'], async (sock, msg, args, ctx) => {
    if (!await checkAdmin(sock, ctx)) return ctx.reply('❌ ᴀᴅᴍɪɴs ᴏɴʟʏ!');
    const m = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!m.length) return ctx.reply('❌ ᴛᴀɢ ᴀ ᴜsᴇʀ!');
    delete ctx.warnTracker[`${ctx.jid}_${m[0]}`];
    await ctx.reply(`✅ ᴡᴀʀɴs ᴄʟᴇᴀʀᴇᴅ ꜰᴏʀ @${m[0].split('@')[0]}`);
    await ctx.react('✅');
  });

  register(['botmute','mutebot'], async (sock, msg, args, ctx) => {
    if (!ctx.isGrp) return ctx.reply('❌ ɢʀᴏᴜᴘ ᴏɴʟʏ!');
    ctx.mutedGroups[ctx.jid] = true;
    await ctx.reply('🤫 ʙᴏᴛ ᴍᴜᴛᴇᴅ. .botunmute ᴛᴏ ʀᴇ-ᴇɴᴀʙʟᴇ');
    await ctx.react('🤫');
  });

  register(['botunmute','unmutebot'], async (sock, msg, args, ctx) => {
    if (!ctx.isGrp) return ctx.reply('❌ ɢʀᴏᴜᴘ ᴏɴʟʏ!');
    delete ctx.mutedGroups[ctx.jid];
    await ctx.reply('🔊 ʙᴏᴛ ᴜɴᴍᴜᴛᴇᴅ!');
    await ctx.react('🔊');
  });

  register(['seticon','setpp'], async (sock, msg, args, ctx) => {
    if (!ctx.isGrp) return ctx.reply('❌ ɢʀᴏᴜᴘ ᴏɴʟʏ!');
    const allMsg = ctx.quoted;
    if (!allMsg) return ctx.reply('❌ ʀᴇᴘʟʏ ᴛᴏ ɪᴍᴀɢᴇ!');
    const type  = getContentType(allMsg);
    const media = allMsg[type];
    if (!media?.mimetype?.startsWith('image')) return ctx.reply('❌ ɪᴍᴀɢᴇ ᴏɴʟʏ!');
    try {
      await ctx.react('⏳');
      const stream = await downloadContentFromMessage(media, 'image');
      let buf = Buffer.alloc(0);
      for await (const c of stream) buf = Buffer.concat([buf, c]);
      await sock.updateProfilePicture(ctx.jid, buf);
      await ctx.reply('✅ ɪᴄᴏɴ ᴜᴘᴅᴀᴛᴇᴅ!');
      await ctx.react('✅');
    } catch (e) {
      await ctx.reply('❌ '+e.message);
      await ctx.react('❌');
    }
  });
};
