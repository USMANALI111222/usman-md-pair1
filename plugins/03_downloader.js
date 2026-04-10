'use strict';

const axios  = require('axios');
const fs     = require('fs');
const path   = require('path');
const os     = require('os');
const { exec, execSync } = require('child_process');
const { promisify } = require('util');
const config = require('../config');

const execAsync = promisify(exec);

function ytdlpOk() {
  try { execSync('yt-dlp --version', { stdio: 'ignore' }); return true; } catch { return false; }
}
function tmp(ext) {
  return path.join(os.tmpdir(), `jmd_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`);
}
async function dlBuf(url, h = {}) {
  const res = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: config.downloadTimeout,
    maxContentLength: config.maxDownloadMB * 1024 * 1024,
    headers: { 'User-Agent': 'Mozilla/5.0 Chrome/120', Accept: '*/*', ...h },
  });
  return Buffer.from(res.data);
}

async function ytAudio(url) {
  const errs = [];
  if (ytdlpOk()) {
    try {
      const out = tmp('mp3');
      await execAsync(`yt-dlp -x --audio-format mp3 --audio-quality 0 --no-playlist -o "${out}" "${url}"`, { timeout: 90000 });
      if (fs.existsSync(out)) { const b = fs.readFileSync(out); fs.unlinkSync(out); return b; }
    } catch (e) { errs.push('yt-dlp: '+e.message); }
  }
  try {
    const r = await axios.post('https://api.cobalt.tools/api/json',
      { url, aFormat: 'mp3', isAudioOnly: true },
      { headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, timeout: 30000 });
    if (r.data?.url) return await dlBuf(r.data.url);
  } catch (e) { errs.push('cobalt: '+e.message); }
  try {
    const vid = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)?.[1];
    if (vid) {
      const r1 = await axios.post('https://www.y2mate.com/mates/analyzeV2/ajax',
        new URLSearchParams({ k_query: `https://youtube.com/watch?v=${vid}`, k_page: 'home', hl: 'en', q_auto: 0 }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 });
      const key = Object.values(r1.data?.links?.mp3||{})[0]?.k;
      if (r1.data?.vid && key) {
        const r2 = await axios.post('https://www.y2mate.com/mates/convertV2/index',
          new URLSearchParams({ vid: r1.data.vid, k: key }),
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 });
        if (r2.data?.dlink) return await dlBuf(r2.data.dlink);
      }
    }
  } catch (e) { errs.push('y2mate: '+e.message); }
  throw new Error('ʏᴛ ᴀᴜᴅɪᴏ ꜰᴀɪʟᴇᴅ:\n'+errs.join('\n'));
}

async function ytVideo(url, q='480') {
  const errs = [];
  if (ytdlpOk()) {
    try {
      const out = tmp('mp4');
      await execAsync(`yt-dlp -f "best[height<=${q}][ext=mp4]/best[ext=mp4]/best" --no-playlist -o "${out}" "${url}"`, { timeout: 120000 });
      if (fs.existsSync(out)) { const b = fs.readFileSync(out); fs.unlinkSync(out); return b; }
    } catch (e) { errs.push('yt-dlp: '+e.message); }
  }
  try {
    const r = await axios.post('https://api.cobalt.tools/api/json',
      { url, vCodec: 'h264', vQuality: q },
      { headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, timeout: 30000 });
    if (r.data?.url) return await dlBuf(r.data.url);
  } catch (e) { errs.push('cobalt: '+e.message); }
  throw new Error('ʏᴛ ᴠɪᴅᴇᴏ ꜰᴀɪʟᴇᴅ:\n'+errs.join('\n'));
}

async function ytSearch(q) {
  const r = await axios.get(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,
    { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 });
  const m = r.data.match(/"videoId":"([A-Za-z0-9_-]{11})"/);
  if (m) return 'https://www.youtube.com/watch?v='+m[1];
  throw new Error('ɴᴏ ʀᴇsᴜʟᴛs');
}

async function tiktokDL(url) {
  try {
    const r = await axios.post('https://www.tikwm.com/api/',
      new URLSearchParams({ url, hd: 1 }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 });
    if (r.data?.data?.play) return { buf: await dlBuf(r.data.data.play), cap: r.data.data.title||'TikTok' };
  } catch {}
  try {
    const r = await axios.post('https://api.cobalt.tools/api/json',
      { url, isNoTTWatermark: true },
      { headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, timeout: 30000 });
    if (r.data?.url) return { buf: await dlBuf(r.data.url), cap: 'TikTok' };
  } catch {}
  if (ytdlpOk()) {
    const out = tmp('mp4');
    await execAsync(`yt-dlp -o "${out}" "${url}"`, { timeout: 60000 });
    if (fs.existsSync(out)) { const b = fs.readFileSync(out); fs.unlinkSync(out); return { buf: b, cap: 'TikTok' }; }
  }
  throw new Error('ᴛɪᴋᴛᴏᴋ ꜰᴀɪʟᴇᴅ');
}

async function socialDL(url) {
  try {
    const r = await axios.post('https://api.cobalt.tools/api/json',
      { url, vCodec: 'h264', vQuality: 'max' },
      { headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, timeout: 30000 });
    if (r.data?.url) {
      const buf = await dlBuf(r.data.url);
      return { buf, mime: r.data.url.includes('.mp4')?'video/mp4':'image/jpeg' };
    }
  } catch {}
  if (ytdlpOk()) {
    try {
      const out = tmp('mp4');
      await execAsync(`yt-dlp -o "${out}" "${url}"`, { timeout: 90000 });
      if (fs.existsSync(out)) { const b = fs.readFileSync(out); fs.unlinkSync(out); return { buf: b, mime: 'video/mp4' }; }
    } catch {}
  }
  throw new Error('ᴅᴏᴡɴʟᴏᴀᴅ ꜰᴀɪʟᴇᴅ');
}

async function pinterestDL(url) {
  const r = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 20000 });
  const m = r.data.match(/"url":"(https:\/\/i\.pinimg\.com[^"]+)"/) || r.data.match(/property="og:image" content="([^"]+)"/);
  if (m) return await dlBuf(m[1].replace(/\\/g,''));
  throw new Error('ɴᴏᴛ ꜰᴏᴜɴᴅ');
}

module.exports = function(register) {

  register(['yta','ytaudio','ytmp3'], async (sock, msg, args, ctx) => {
    const url = args[0];
    if (!url || !/youtu/.test(url)) return ctx.reply('❌ .yta <YouTube URL>');
    await ctx.react('⏳'); await ctx.reply('📥 *ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ ᴀᴜᴅɪᴏ...*');
    try { await ctx.rawSend({ audio: await ytAudio(url), mimetype: 'audio/mpeg', ptt: false }); await ctx.react('✅'); }
    catch (e) { await ctx.reply('❌ '+e.message); await ctx.react('❌'); }
  });

  register(['ytv','ytvideo','ytmp4'], async (sock, msg, args, ctx) => {
    const url = args[0];
    if (!url || !/youtu/.test(url)) return ctx.reply('❌ .ytv <YouTube URL>');
    await ctx.react('⏳'); await ctx.reply('📥 *ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ ᴠɪᴅᴇᴏ...*');
    try { await ctx.rawSend({ video: await ytVideo(url,'480'), mimetype: 'video/mp4', caption: '✅ ᴜsᴍᴀɴ ᴍᴅ' }); await ctx.react('✅'); }
    catch (e) { await ctx.reply('❌ '+e.message); await ctx.react('❌'); }
  });

  register(['play','music','song'], async (sock, msg, args, ctx) => {
    const q = args.join(' ');
    if (!q) return ctx.reply('❌ .play <title>');
    await ctx.react('🔍'); await ctx.reply(`🔍 _${q}_...`);
    try { const url = await ytSearch(q); await ctx.reply('📥 ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ...'); await ctx.rawSend({ audio: await ytAudio(url), mimetype: 'audio/mpeg', ptt: false }); await ctx.react('✅'); }
    catch (e) { await ctx.reply('❌ '+e.message); await ctx.react('❌'); }
  });

  register(['playvid','playvideo'], async (sock, msg, args, ctx) => {
    const q = args.join(' ');
    if (!q) return ctx.reply('❌ .playvid <title>');
    await ctx.react('🔍'); await ctx.reply(`🔍 _${q}_...`);
    try { const url = await ytSearch(q); await ctx.reply('📥 ᴅᴏᴡɴʟᴏᴀᴅɪɴɢ...'); await ctx.rawSend({ video: await ytVideo(url,'360'), mimetype: 'video/mp4', caption: `🎬 ${q}` }); await ctx.react('✅'); }
    catch (e) { await ctx.reply('❌ '+e.message); await ctx.react('❌'); }
  });

  register(['tiktok','tt','tik'], async (sock, msg, args, ctx) => {
    const url = args[0];
    if (!url) return ctx.reply('❌ .tiktok <URL>');
    await ctx.react('⏳'); await ctx.reply('📥 *ᴛɪᴋᴛᴏᴋ...*');
    try { const {buf,cap} = await tiktokDL(url); await ctx.rawSend({ video: buf, mimetype: 'video/mp4', caption: cap }); await ctx.react('✅'); }
    catch (e) { await ctx.reply('❌ '+e.message); await ctx.react('❌'); }
  });

  register(['ig','instagram','reel'], async (sock, msg, args, ctx) => {
    const url = args[0];
    if (!url) return ctx.reply('❌ .ig <URL>');
    await ctx.react('⏳'); await ctx.reply('📥 *ɪɴsᴛᴀɢʀᴀᴍ...*');
    try { const {buf,mime} = await socialDL(url); await ctx.rawSend({ [mime.includes('video')?'video':'image']: buf, mimetype: mime, caption: '✅ ᴜsᴍᴀɴ ᴍᴅ' }); await ctx.react('✅'); }
    catch (e) { await ctx.reply('❌ '+e.message); await ctx.react('❌'); }
  });

  register(['fb','facebook'], async (sock, msg, args, ctx) => {
    const url = args[0];
    if (!url) return ctx.reply('❌ .fb <URL>');
    await ctx.react('⏳'); await ctx.reply('📥 *ꜰᴀᴄᴇʙᴏᴏᴋ...*');
    try { const {buf} = await socialDL(url); await ctx.rawSend({ video: buf, mimetype: 'video/mp4', caption: '✅ ᴜsᴍᴀɴ ᴍᴅ' }); await ctx.react('✅'); }
    catch (e) { await ctx.reply('❌ '+e.message); await ctx.react('❌'); }
  });

  register(['twitter','tw','x'], async (sock, msg, args, ctx) => {
    const url = args[0];
    if (!url) return ctx.reply('❌ .twitter <URL>');
    await ctx.react('⏳'); await ctx.reply('📥 *ᴛᴡɪᴛᴛᴇʀ...*');
    try { const {buf} = await socialDL(url); await ctx.rawSend({ video: buf, mimetype: 'video/mp4', caption: '✅ ᴜsᴍᴀɴ ᴍᴅ' }); await ctx.react('✅'); }
    catch (e) { await ctx.reply('❌ '+e.message); await ctx.react('❌'); }
  });

  register(['pinterest','pin'], async (sock, msg, args, ctx) => {
    const url = args[0];
    if (!url) return ctx.reply('❌ .pinterest <URL>');
    await ctx.react('⏳'); await ctx.reply('📥 *ᴘɪɴᴛᴇʀᴇsᴛ...*');
    try { await ctx.rawSend({ image: await pinterestDL(url), caption: '✅ ᴜsᴍᴀɴ ᴍᴅ' }); await ctx.react('✅'); }
    catch (e) { await ctx.reply('❌ '+e.message); await ctx.react('❌'); }
  });
};
