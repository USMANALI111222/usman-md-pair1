'use strict';

const config = require('../config');
const fs     = require('fs');
const path   = require('path');

const up  = () => { const s = process.uptime(); return `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m ${Math.floor(s%60)}s`; };
const ram = () => `${Math.round(process.memoryUsage().heapUsed/1024/1024)} MB`;
const R   = (ic, cmd, desc) => `│  ${ic}  *${config.prefix}${cmd}*\n│       ↳ _${desc}_\n`;
const HDR = (t) => `╭━━━━「 ${t} 」━━━━\n│\n`;
const FTR = `│\n╰━━━━━━━━━━━━━━━━━━━━━━`;
const DIV = (t) => `│\n│  ◈━━ ${t} ━━◈\n│\n`;

module.exports = function(register) {

  // ── .menu — SEEDHA SARI COMMANDS EK SAATH ──────────────────
  register(['menu', 'help', 'm', 'start'], async (sock, msg, args, ctx) => {
    const now = new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' });

    const cap =
      `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
      `│  𝗨𝗦𝗠𝗔𝗡 𝗠𝗗 𝗩𝟭.0  ⚡  𝗪𝗛𝗔𝗧𝗦𝗔𝗣𝗣 𝗕𝗢𝗧  │\n` +
      `│  ᴅᴇᴠ : ᴜsᴍᴀɴ                 │\n` +
      `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +

      `◈━━━ 𝗦𝗬𝗦𝗧𝗘𝗠 ━━━◈\n` +
      `│ 🕐  ${now}\n` +
      `│ ⏱️  ᴜᴘᴛɪᴍᴇ : *${up()}*\n` +
      `│ 💾  ʀᴀᴍ    : *${ram()}*\n` +
      `│ ⚙️  ᴘʀᴇꜰɪx : *${config.prefix}*\n` +
      `│ 🌍  ᴍᴏᴅᴇ   : *${config.publicMode ? 'PUBLIC' : 'PRIVATE'}*\n` +
      `│ 👑  ᴏᴡɴᴇʀ  : *${config.ownerName}*\n` +
      `◈━━━━━━━━━━━━━━━━━━━━━━━━◈\n\n` +

      // ── GENERAL ──
      HDR('📋 ɢᴇɴᴇʀᴀʟ') +
      R('🟢','alive','ʙᴏᴛ sᴛᴀᴛᴜs') +
      R('⚡','ping','sᴘᴇᴇᴅ ᴛᴇsᴛ') +
      R('ℹ️','info','ʙᴏᴛ ɪɴꜰᴏ') +
      R('👑','owner','ᴄᴏɴᴛᴀᴄᴛ ᴏᴡɴᴇʀ') +
      R('⏱️','uptime','ʙᴏᴛ ᴜᴘᴛɪᴍᴇ') +
      R('💾','ram','ᴍᴇᴍᴏʀʏ ᴜsᴀɢᴇ') +
      R('🖼️','sticker','ɪᴍᴀɢᴇ → sᴛɪᴄᴋᴇʀ') +
      R('🔄','toimg','sᴛɪᴄᴋᴇʀ → ɪᴍᴀɢᴇ') +
      R('💬','q <text>','ꜰᴀᴋᴇ ǫᴜᴏᴛᴇ ᴄᴀʀᴅ') +
      R('🔊','tts <text>','ᴛᴇxᴛ ᴛᴏ sᴘᴇᴇᴄʜ') +
      R('📢','tagall [msg]','ᴛᴀɢ ᴀʟʟ ᴍᴇᴍʙᴇʀs') +
      R('👤','whois @user','ᴜsᴇʀ ᴘʀᴏꜰɪʟᴇ') +
      R('🖼️','dp <number>','sᴇᴇ ᴅᴘ') +
      R('🔗','pair <number>','ɢᴇɴᴇʀᴀᴛᴇ ᴘᴀɪʀ ᴄᴏᴅᴇ') +
      FTR + '\n\n' +

      // ── GROUP ──
      HDR('👥 ɢʀᴏᴜᴘ') +
      R('🥾','kick @user','ᴋɪᴄᴋ ᴍᴇᴍʙᴇʀ') +
      R('➕','add <num>','ᴀᴅᴅ ᴍᴇᴍʙᴇʀ') +
      R('⬆️','promote @user','ᴍᴀᴋᴇ ᴀᴅᴍɪɴ') +
      R('⬇️','demote @user','ʀᴇᴍᴏᴠᴇ ᴀᴅᴍɪɴ') +
      R('🔇','mute','ᴍᴜᴛᴇ ɢʀᴏᴜᴘ') +
      R('🔊','unmute','ᴜɴᴍᴜᴛᴇ ɢʀᴏᴜᴘ') +
      R('🔒','close','ʟᴏᴄᴋ ɢʀᴏᴜᴘ') +
      R('🔓','unlock','ᴜɴʟᴏᴄᴋ ɢʀᴏᴜᴘ') +
      R('📊','groupinfo','ɢʀᴏᴜᴘ ɪɴꜰᴏ') +
      R('👥','members','ᴍᴇᴍʙᴇʀ ʟɪsᴛ') +
      R('👑','admins','ᴀᴅᴍɪɴ ʟɪsᴛ') +
      R('✏️','setname <n>','ʀᴇɴᴀᴍᴇ ɢʀᴏᴜᴘ') +
      R('📝','setdesc <t>','sᴇᴛ ᴅᴇsᴄʀɪᴘᴛɪᴏɴ') +
      R('🔗','link','ɪɴᴠɪᴛᴇ ʟɪɴᴋ') +
      R('♻️','revoke','ʀᴇsᴇᴛ ɪɴᴠɪᴛᴇ ʟɪɴᴋ') +
      R('🛡️','antilink on/off','ᴀɴᴛɪ-ʟɪɴᴋ') +
      R('⚠️','warn @user','ᴡᴀʀɴ ᴜsᴇʀ') +
      R('📋','warnlist','ᴡᴀʀɴ ʟɪsᴛ') +
      R('✅','clearwarn @user','ᴄʟᴇᴀʀ ᴡᴀʀɴɪɴɢs') +
      R('🖼️','seticon','sᴇᴛ ɢʀᴏᴜᴘ ɪᴄᴏɴ') +
      FTR + '\n\n' +

      // ── DOWNLOADER ──
      HDR('📥 ᴅᴏᴡɴʟᴏᴀᴅᴇʀ') +
      DIV('🎵 ʏᴏᴜᴛᴜʙᴇ') +
      R('🎵','yta <url>','ʏᴛ ᴀᴜᴅɪᴏ ᴍᴘ3') +
      R('🎬','ytv <url>','ʏᴛ ᴠɪᴅᴇᴏ ᴍᴘ4') +
      R('▶️','play <title>','sᴏɴɢ ʙʏ ɴᴀᴍᴇ') +
      R('🎞️','playvid <title>','ᴠɪᴅᴇᴏ ʙʏ ɴᴀᴍᴇ') +
      DIV('📱 sᴏᴄɪᴀʟ ᴍᴇᴅɪᴀ') +
      R('🎵','tiktok <url>','ᴛɪᴋᴛᴏᴋ ᴠɪᴅᴇᴏ') +
      R('📸','ig <url>','ɪɴsᴛᴀɢʀᴀᴍ') +
      R('📘','fb <url>','ꜰᴀᴄᴇʙᴏᴏᴋ') +
      R('🐦','twitter <url>','ᴛᴡɪᴛᴛᴇʀ/x') +
      R('📌','pinterest <url>','ᴘɪɴᴛᴇʀᴇsᴛ') +
      FTR + '\n\n' +

      // ── TOOLS ──
      HDR('🔧 ᴛᴏᴏʟs') +
      R('🌤️','weather <city>','ʟɪᴠᴇ ᴡᴇᴀᴛʜᴇʀ') +
      R('🌐','translate [l] <t>','ᴛʀᴀɴsʟᴀᴛᴇ ᴛᴇxᴛ') +
      R('🔗','tinyurl <url>','sʜᴏʀᴛᴇɴ ᴜʀʟ') +
      R('📖','wiki <q>','ᴡɪᴋɪᴘᴇᴅɪᴀ') +
      R('📷','qr <text>','ɢᴇɴ ǫʀ ᴄᴏᴅᴇ') +
      R('🧮','calc <expr>','ᴄᴀʟᴄᴜʟᴀᴛᴏʀ') +
      R('💱','currency <a> <F> <T>','ᴄᴜʀʀᴇɴᴄʏ ᴄᴏɴᴠᴇʀᴛ') +
      R('🖼️','gimage <q>','ɢᴏᴏɢʟᴇ ɪᴍᴀɢᴇ') +
      R('🔍','ocr','ɪᴍᴀɢᴇ ᴛᴏ ᴛᴇxᴛ') +
      R('📸','ss <url>','ᴡᴇʙsɪᴛᴇ sᴄʀᴇᴇɴsʜᴏᴛ') +
      FTR + '\n\n' +

      // ── FUN ──
      HDR('🎮 ꜰᴜɴ & ɢᴀᴍᴇs') +
      R('😂','joke','ʀᴀɴᴅᴏᴍ ᴊᴏᴋᴇ') +
      R('🤓','fact','ɪɴᴛᴇʀᴇsᴛɪɴɢ ꜰᴀᴄᴛ') +
      R('💡','quote','ɪɴsᴘɪʀᴀᴛɪᴏɴ') +
      R('🎱','8ball <q>','ᴀsᴋ 8-ʙᴀʟʟ') +
      R('🤫','truth','ᴛʀᴜᴛʜ ǫᴜᴇsᴛɪᴏɴ') +
      R('🎯','dare','ᴅᴀʀᴇ ᴄʜᴀʟʟᴇɴɢᴇ') +
      R('💘','ship @u1 @u2','ʟᴏᴠᴇ sʜɪᴘ') +
      R('⭐','rate @user','ʀᴀᴛᴇ ᴜsᴇʀ') +
      R('🔥','roast @user','ʀᴏᴀsᴛ ᴜsᴇʀ') +
      R('💝','compliment @user','ᴄᴏᴍᴘʟɪᴍᴇɴᴛ') +
      R('✊','rps r/p/s','ʀᴏᴄᴋ ᴘᴀᴘᴇʀ sᴄɪssᴏʀs') +
      R('🎲','dice','ʀᴏʟʟ ᴅɪᴄᴇ') +
      R('🪙','flip','ᴄᴏɪɴ ꜰʟɪᴘ') +
      R('🔮','predict <q>','ᴘʀᴇᴅɪᴄᴛɪᴏɴ') +
      FTR + '\n\n' +

      // ── AI ──
      HDR('🤖 ᴀɪ & ᴇxᴛʀᴀ') +
      R('🤖','ai <question>','ᴀsᴋ ᴀɪ ᴀɴʏᴛʜɪɴɢ') +
      R('🎨','imagine <desc>','ᴀɪ ɪᴍᴀɢᴇ ɢᴇɴ') +
      R('🎵','lyrics <song>','sᴏɴɢ ʟʏʀɪᴄs') +
      R('🎬','movie <title>','ɪᴍᴅʙ ɪɴꜰᴏ') +
      R('📖','urban <word>','ᴜʀʙᴀɴ ᴅɪᴄᴛ') +
      R('📱','numinfo <num>','ᴡᴀ ɴᴜᴍ ᴄʜᴇᴄᴋ') +
      R('🔠','gpt4 <q>','GPT ᴀɴsᴡᴇʀ') +
      R('🌅','aimg <desc>','ᴀɪ ᴀʀᴛ') +
      FTR + '\n\n' +

      `🔔 *ᴄʜᴀɴɴᴇʟ:* ${ctx.channelLink}\n\n` +
      `_✦ ᴜsᴍᴀɴ ᴍᴅ v1.0  |  ᴜsᴍᴀɴ_`;

    const videoPath = path.join(__dirname, '..', 'menu.mp4');
    if (fs.existsSync(videoPath)) {
      try {
        await sock.sendMessage(ctx.jid, {
          video   : fs.readFileSync(videoPath),
          caption : cap,
          gifPlayback: false,
          contextInfo: {
            externalAdReply: {
              title       : '🔔 ᴜsᴍᴀɴ ᴄʜᴀɴɴᴇʟ',
              body        : 'ᴛᴀᴘ ᴛᴏ ꜰᴏʟʟᴏᴡ!',
              thumbnailUrl: ctx.animeImg,
              sourceUrl   : ctx.channelLink,
              mediaType   : 1,
            },
          },
        }, { quoted: msg });
        await ctx.react('✅');
        return;
      } catch (e) {}
    }
    await ctx.reply(cap);
    await ctx.react('✅');
  });

  // ── Owner Panel (sirf owner ke liye) ──────────────────────────
  register(['ownercmds', 'panel'], async (sock, msg, args, ctx) => {
    if (!ctx.isOwner) return ctx.reply('❌ *ᴏᴡɴᴇʀ ᴏɴʟʏ!*');
    await ctx.reply(
      HDR('👑 ᴏᴡɴᴇʀ ᴘᴀɴᴇʟ') +
      R('📢','broadcast <msg>','ʙʀᴏᴀᴅᴄᴀsᴛ ᴛᴏ ᴀʟʟ') +
      R('🚫','block @user','ʙʟᴏᴄᴋ ᴜsᴇʀ') +
      R('✅','unblock @user','ᴜɴʙʟᴏᴄᴋ ᴜsᴇʀ') +
      R('🌐','setmode pub/priv','ᴛᴏɢɢʟᴇ ᴍᴏᴅᴇ') +
      R('🔄','restart','ʀᴇsᴛᴀʀᴛ ʙᴏᴛ') +
      R('🛑','shutdown','sʜᴜᴛᴅᴏᴡɴ') +
      R('🔗','joingroup <link>','ᴊᴏɪɴ ɢʀᴏᴜᴘ') +
      R('🚪','leavegroup','ʟᴇᴀᴠᴇ ɢʀᴏᴜᴘ') +
      R('💾','getdb','ʙᴀᴄᴋᴜᴘ ᴄʀᴇᴅs') +
      R('✏️','setbio <text>','sᴇᴛ ᴡᴀ ʙɪᴏ') +
      R('👤','botname <n>','ᴄʜᴀɴɢᴇ ʙᴏᴛ ɴᴀᴍᴇ') +
      R('🏘️','listgroups','ᴀʟʟ ɢʀᴏᴜᴘs') +
      R('🔐','clearauth','ʟᴏɢᴏᴜᴛ + ʀᴇ-ᴘᴀɪʀ') +
      R('🔔','autoreact on/off','ᴛᴏɢɢʟᴇ ʀᴇᴀᴄᴛ') +
      R('🗑️','del','ᴅᴇʟᴇᴛᴇ ᴍᴇssᴀɢᴇ') +
      R('📊','setstatus <t>','ᴘᴏsᴛ sᴛᴀᴛᴜs') +
      FTR
    );
    await ctx.react('👑');
  });
};
            
