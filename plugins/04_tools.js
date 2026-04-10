'use strict';

const axios  = require('axios');
const config = require('../config');

module.exports = function(register) {

  register(['weather','w'], async (sock, msg, args, ctx) => {
    const city = args.join(' '); if (!city) return ctx.reply('❌ .weather <city>');
    try {
      await ctx.react('⏳');
      const r = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=j1`, { timeout: 15000 });
      const d = r.data.current_condition[0], a = r.data.nearest_area[0];
      await ctx.reply(`╭━━━「 🌤️ ᴡᴇᴀᴛʜᴇʀ — ${city.toUpperCase()} 」━━━\n│\n│  📍 ${a.areaName[0].value}, ${a.country[0].value}\n│  🌡️ *${d.temp_C}°C / ${d.temp_F}°F*\n│  💧 ${d.humidity}%\n│  💨 ${d.windspeedKmph} km/h\n│  ☁️ ${d.weatherDesc[0].value}\n│\n╰━━━━━━━━━━━━━━━━━━━━━━`);
      await ctx.react('🌤️');
    } catch { await ctx.reply('❌ ᴄʜᴇᴄᴋ ᴄɪᴛʏ ɴᴀᴍᴇ'); await ctx.react('❌'); }
  });

  register(['translate','tr'], async (sock, msg, args, ctx) => {
    let lang='en', text=args.join(' ');
    if (args[0]?.length<=3 && /^[a-z]+$/i.test(args[0])) { lang=args.shift(); text=args.join(' '); }
    if (!text) return ctx.reply('❌ .translate [lang] <text>');
    try {
      await ctx.react('⏳');
      const r = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`, { timeout: 15000 });
      await ctx.reply(`🌐 *→ ${lang.toUpperCase()}*\n\n${r.data[0].map(x=>x[0]).join('')}`);
      await ctx.react('🌐');
    } catch { await ctx.reply('❌ ꜰᴀɪʟᴇᴅ'); await ctx.react('❌'); }
  });

  register(['tinyurl','shorten'], async (sock, msg, args, ctx) => {
    const url=args[0]; if (!url) return ctx.reply('❌ .tinyurl <url>');
    try { const r=await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`,{timeout:10000}); await ctx.reply(`🔗 ${r.data}`); await ctx.react('🔗'); }
    catch { await ctx.reply('❌ ꜰᴀɪʟᴇᴅ'); }
  });

  register(['wiki','wikipedia'], async (sock, msg, args, ctx) => {
    const q=args.join(' '); if (!q) return ctx.reply('❌ .wiki <query>');
    try {
      await ctx.react('⏳');
      const r=await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`,{timeout:15000});
      await ctx.reply(`📖 *${r.data.title}*\n\n${r.data.extract?.slice(0,900)||'ɴᴏ sᴜᴍᴍᴀʀʏ'}\n\n🔗 ${r.data.content_urls?.desktop?.page||''}`);
      await ctx.react('📖');
    } catch { await ctx.reply('❌ ꜰᴀɪʟᴇᴅ'); await ctx.react('❌'); }
  });

  register(['qr','qrcode'], async (sock, msg, args, ctx) => {
    const text=args.join(' '); if (!text) return ctx.reply('❌ .qr <text>');
    try {
      await ctx.react('⏳');
      const r=await axios.get(`https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(text)}`,{responseType:'arraybuffer',timeout:15000});
      await ctx.rawSend({ image:Buffer.from(r.data), caption:`✅ ǫʀ: ${text}` });
      await ctx.react('✅');
    } catch { await ctx.reply('❌ ꜰᴀɪʟᴇᴅ'); await ctx.react('❌'); }
  });

  register(['calc','calculate','math'], async (sock, msg, args, ctx) => {
    const expr=args.join(' ').replace(/[^0-9+\-*/().% ]/g,'');
    if (!expr) return ctx.reply('❌ .calc <expr>');
    try { await ctx.reply(`🧮 *${expr}* = *${Function('"use strict";return('+expr+')')()}*`); await ctx.react('✅'); }
    catch { await ctx.reply('❌ ɪɴᴠᴀʟɪᴅ'); await ctx.react('❌'); }
  });

  register(['currency','cur'], async (sock, msg, args, ctx) => {
    const [a,f,t]=args; if (!a||!f||!t) return ctx.reply('❌ .currency <amt> <FROM> <TO>');
    try {
      await ctx.react('⏳');
      const r=await axios.get(`https://open.er-api.com/v6/latest/${f.toUpperCase()}`,{timeout:15000});
      const rate=r.data.rates?.[t.toUpperCase()]; if (!rate) return ctx.reply('❌ ɴᴏᴛ ꜰᴏᴜɴᴅ');
      await ctx.reply(`💱 *${a} ${f.toUpperCase()} = ${(parseFloat(a)*rate).toFixed(2)} ${t.toUpperCase()}*`);
      await ctx.react('💱');
    } catch { await ctx.reply('❌ ꜰᴀɪʟᴇᴅ'); await ctx.react('❌'); }
  });

  register(['gimage','image','img'], async (sock, msg, args, ctx) => {
    const q=args.join(' '); if (!q) return ctx.reply('❌ .gimage <query>');
    try {
      await ctx.react('⏳');
      const r=await axios.get(`https://source.unsplash.com/random/800x600/?${encodeURIComponent(q)}`,{responseType:'arraybuffer',timeout:20000});
      await ctx.rawSend({ image:Buffer.from(r.data), caption:`🖼️ *${q}*` });
      await ctx.react('✅');
    } catch (e) { await ctx.reply('❌ '+e.message); await ctx.react('❌'); }
  });
};

  // ── OCR: Image to Text ────────────────────────────────────
  register(['ocr', 'readimg'], async (sock, msg, args, ctx) => {
    const allMsg = ctx.quoted ? ctx.quoted : msg.message;
    if (!allMsg) return ctx.reply('❌ *Reply to an image!*');
    const { getContentType, downloadContentFromMessage } = require('@whiskeysockets/baileys');
    const type = getContentType(allMsg);
    const media = allMsg?.[type];
    if (!media?.mimetype?.startsWith('image')) return ctx.reply('❌ *Reply to an IMAGE!*');
    await ctx.react('🔍');
    await ctx.reply('🔍 _Reading text from image..._');
    try {
      const axios = require('axios');
      const stream = await downloadContentFromMessage(media, 'image');
      let buf = Buffer.alloc(0);
      for await (const c of stream) buf = Buffer.concat([buf, c]);
      const b64 = buf.toString('base64');
      const r = await axios.post('https://api.ocr.space/parse/image',
        `base64Image=data:image/jpeg;base64,${b64}&apikey=helloworld&language=eng`,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 }
      );
      const text = r.data?.ParsedResults?.[0]?.ParsedText?.trim();
      if (!text) return ctx.reply('❌ *No text found in image*');
      await ctx.reply(`🔎 *OCR Result:*\n\n${text}\n\n~ *ᴜsᴍᴀɴ ᴍᴅ v15*`);
      await ctx.react('✅');
    } catch (e) {
      await ctx.reply('❌ OCR failed: ' + e.message);
      await ctx.react('❌');
    }
  });

  // ── Website Screenshot ────────────────────────────────────
  register(['ss', 'screenshot', 'webss'], async (sock, msg, args, ctx) => {
    const url = args[0];
    if (!url || !url.startsWith('http')) return ctx.reply('❌ *.ss <URL>*\n_Example: .ss https://google.com_');
    await ctx.react('📸');
    await ctx.reply('📸 _Taking screenshot..._');
    try {
      const axios = require('axios');
      const ssUrl = `https://api.screenshotmachine.com?key=demo&url=${encodeURIComponent(url)}&dimension=1366x768&format=jpg&cacheLimit=0`;
      const r = await axios.get(ssUrl, { responseType: 'arraybuffer', timeout: 25000 });
      await ctx.rawSend({ image: Buffer.from(r.data), caption: `📸 *Screenshot*\n🔗 ${url}\n\n~ *ᴜsᴍᴀɴ ᴍᴅ v15*` });
      await ctx.react('✅');
    } catch (e) {
      await ctx.reply('❌ Screenshot failed: ' + e.message);
      await ctx.react('❌');
    }
  });

  // ── Whois / User Profile ──────────────────────────────────
  register(['whois', 'userinfo'], async (sock, msg, args, ctx) => {
    const target = ctx.quoted ? (msg.message?.[require('@whiskeysockets/baileys').getContentType(msg.message)]?.contextInfo?.participant || ctx.sender) : (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || ctx.sender);
    const num = target.split('@')[0];
    await ctx.react('🔍');
    try {
      let ppUrl;
      try { ppUrl = await sock.profilePictureUrl(target, 'image'); } catch { ppUrl = ctx.animeImg; }
      const status = await sock.fetchStatus(target).catch(() => ({ status: 'N/A' }));
      const text =
        `╭━━━「 👤 ᴜsᴇʀ ᴘʀᴏꜰɪʟᴇ 」━━━\n│\n` +
        `│  📱 *Number:* +${num}\n` +
        `│  💬 *JID:* ${target}\n` +
        `│  📝 *Status:* ${status?.status || 'N/A'}\n│\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━\n~ *ᴜsᴍᴀɴ ᴍᴅ v15*`;
      await ctx.rawSend({ image: { url: ppUrl }, caption: text });
      await ctx.react('✅');
    } catch (e) {
      await ctx.reply('❌ ' + e.message);
      await ctx.react('❌');
    }
  });
