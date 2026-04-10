'use strict';

const axios  = require('axios');
const config = require('../config');

// Simple in-memory AI conversation state per user
const aiChats = {};

module.exports = function(register) {

  // ── AI Chat ─────────────────────────────────────────────────
  register(['ai', 'gpt', 'ask', 'chat'], async (sock, msg, args, ctx) => {
    const query = args.join(' ');
    if (!query) return ctx.reply('❌ *Usage:* .ai <your question>\n\n_Example: .ai explain black holes_');
    await ctx.react('🤖');
    await ctx.reply('🤖 _ᴛʜɪɴᴋɪɴɢ..._');

    try {
      // Primary: pollinations.ai (free, no key)
      const res = await axios.post(
        'https://text.pollinations.ai/',
        {
          messages: [
            { role: 'system', content: `You are ${config.botName}, a helpful WhatsApp assistant made by ${config.ownerName}. Be concise and friendly. Reply in the same language the user uses.` },
            { role: 'user', content: query },
          ],
          model : 'openai',
          seed  : Math.floor(Math.random() * 9999),
        },
        { timeout: 30000, responseType: 'text' }
      );

      const answer = typeof res.data === 'string' ? res.data.trim() : JSON.stringify(res.data);
      if (!answer) throw new Error('Empty response');

      await ctx.reply(`🤖 *ᴜsᴍᴀɴ ᴀɪ*\n\n${answer}\n\n_~ ᴜsᴍᴀɴ ᴍᴅ_`);
      await ctx.react('✅');
    } catch (e) {
      // Fallback: simple responses for common queries
      await ctx.reply('❌ ᴀɪ ᴜɴᴀᴠᴀɪʟᴀʙʟᴇ ʀɪɢʜᴛ ɴᴏᴡ. ᴛʀʏ ᴀɢᴀɪɴ.\n\n_Error: ' + e.message + '_');
      await ctx.react('❌');
    }
  });

  // ── Image Generation ─────────────────────────────────────────
  register(['imagine', 'generate', 'genimg'], async (sock, msg, args, ctx) => {
    const prompt = args.join(' ');
    if (!prompt) return ctx.reply('❌ *Usage:* .imagine <description>\n\n_Example: .imagine anime girl with blue hair_');
    await ctx.react('🎨');
    await ctx.reply('🎨 _ɢᴇɴᴇʀᴀᴛɪɴɢ ɪᴍᴀɢᴇ..._');

    try {
      const seed   = Math.floor(Math.random() * 999999);
      const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${seed}&nologo=true&enhance=true`;
      const res    = await axios.get(imgUrl, { responseType: 'arraybuffer', timeout: 30000 });
      await ctx.rawSend({
        image   : Buffer.from(res.data),
        caption : `🎨 *ᴀɪ ɪᴍᴀɢᴇ*\n\n📝 _${prompt}_\n\n~ *ᴜsᴍᴀɴ ᴍᴅ*`,
      });
      await ctx.react('✅');
    } catch (e) {
      await ctx.reply('❌ ɪᴍᴀɢᴇ ɢᴇɴ ꜰᴀɪʟᴇᴅ: ' + e.message);
      await ctx.react('❌');
    }
  });

  // ── Lyrics Search ────────────────────────────────────────────
  register(['lyrics', 'lyric'], async (sock, msg, args, ctx) => {
    const q = args.join(' ');
    if (!q) return ctx.reply('❌ .lyrics <song name>');
    await ctx.react('🎵');
    await ctx.reply('🔍 _sᴇᴀʀᴄʜɪɴɢ..._');

    try {
      const r = await axios.get(`https://api.lyrics.ovh/suggest/${encodeURIComponent(q)}`, { timeout: 15000 });
      const song = r.data?.data?.[0];
      if (!song) return ctx.reply('❌ sᴏɴɢ ɴᴏᴛ ꜰᴏᴜɴᴅ');

      const lyricsRes = await axios.get(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(song.artist.name)}/${encodeURIComponent(song.title.replace(/\s/g, '%20'))}`,
        { timeout: 15000 }
      );
      const lyrics = lyricsRes.data?.lyrics?.slice(0, 3000) || 'ɴᴏ ʟʏʀɪᴄs ꜰᴏᴜɴᴅ';
      await ctx.reply(`🎵 *${song.title}*\n👤 ${song.artist.name}\n\n${lyrics}\n\n_~ ᴜsᴍᴀɴ ᴍᴅ_`);
      await ctx.react('🎵');
    } catch (e) {
      await ctx.reply('❌ ʟʏʀɪᴄs ɴᴏᴛ ꜰᴏᴜɴᴅ');
      await ctx.react('❌');
    }
  });

  // ── Movie Info ───────────────────────────────────────────────
  register(['movie', 'imdb', 'film'], async (sock, msg, args, ctx) => {
    const q = args.join(' ');
    if (!q) return ctx.reply('❌ .movie <title>');
    await ctx.react('🎬');
    await ctx.reply('🔍 _sᴇᴀʀᴄʜɪɴɢ..._');

    try {
      const r = await axios.get(`https://www.omdbapi.com/?s=${encodeURIComponent(q)}&apikey=trilogy`, { timeout: 15000 });
      const item = r.data?.Search?.[0];
      if (!item) return ctx.reply('❌ ᴍᴏᴠɪᴇ ɴᴏᴛ ꜰᴏᴜɴᴅ');

      const d = await axios.get(`https://www.omdbapi.com/?i=${item.imdbID}&apikey=trilogy`, { timeout: 15000 });
      const m = d.data;

      const text =
        `╭━━━「 🎬 ${m.Title} 」━━━\n│\n` +
        `│  📅 *${m.Year}*  •  ${m.Rated}\n` +
        `│  ⏱️ ${m.Runtime}\n` +
        `│  🎭 ${m.Genre}\n` +
        `│  🎬 Dir: ${m.Director}\n` +
        `│  ⭐ IMDB: *${m.imdbRating}/10*\n` +
        `│  📝 ${m.Plot?.slice(0, 200)}\n│\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━`;

      if (m.Poster && m.Poster !== 'N/A') {
        const imgRes = await axios.get(m.Poster, { responseType: 'arraybuffer', timeout: 10000 }).catch(() => null);
        if (imgRes) {
          await ctx.rawSend({ image: Buffer.from(imgRes.data), caption: text });
          await ctx.react('🎬');
          return;
        }
      }
      await ctx.reply(text);
      await ctx.react('🎬');
    } catch (e) {
      await ctx.reply('❌ ' + e.message);
      await ctx.react('❌');
    }
  });

  // ── Urban Dictionary ─────────────────────────────────────────
  register(['urban', 'ud', 'define'], async (sock, msg, args, ctx) => {
    const q = args.join(' ');
    if (!q) return ctx.reply('❌ .urban <word>');
    await ctx.react('📖');
    try {
      const r = await axios.get(`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(q)}`, { timeout: 15000 });
      const d = r.data?.list?.[0];
      if (!d) return ctx.reply('❌ ɴᴏᴛ ꜰᴏᴜɴᴅ');
      const def = d.definition.replace(/\[|\]/g, '').slice(0, 800);
      await ctx.reply(`📖 *${d.word}*\n\n${def}\n\n👍 ${d.thumbs_up}  👎 ${d.thumbs_down}`);
      await ctx.react('📖');
    } catch { await ctx.reply('❌ ꜰᴀɪʟᴇᴅ'); }
  });

  // ── Number Info / Fake Number Check ─────────────────────────
  register(['numinfo', 'phoneinfo'], async (sock, msg, args, ctx) => {
    const num = args[0]?.replace(/[^0-9]/g, '');
    if (!num) return ctx.reply('❌ .numinfo <number with country code>\n_Example: .numinfo 923001234567_');
    await ctx.react('🔍');
    try {
      const r = await axios.get(`https://restcountries.com/v3.1/callingcode/${num.slice(0, 3)}`, { timeout: 10000 }).catch(() => null);
      const jid   = num + '@s.whatsapp.net';
      const check = await sock.onWhatsApp(jid).catch(() => []);
      const onWA  = check?.[0]?.exists;

      await ctx.reply(
        `╭━━━「 📱 ɴᴜᴍʙᴇʀ ɪɴꜰᴏ 」━━━\n│\n` +
        `│  📞 *+${num}*\n` +
        `│  💬 WhatsApp: ${onWA ? '✅ ʀᴇɢɪsᴛᴇʀᴇᴅ' : '❌ ɴᴏᴛ ꜰᴏᴜɴᴅ'}\n│\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━`
      );
      await ctx.react('✅');
    } catch (e) {
      await ctx.reply('❌ ' + e.message);
      await ctx.react('❌');
    }
  });
};
