'use strict';

module.exports = function(register) {
  const p = a => a[Math.floor(Math.random()*a.length)];
  const jokes=['ᴡʜʏ ᴅᴏɴ\'ᴛ sᴄɪᴇɴᴛɪsᴛs ᴛʀᴜsᴛ ᴀᴛᴏᴍs? ᴛʜᴇʏ ᴍᴀᴋᴇ ᴜᴘ ᴇᴠᴇʀʏᴛʜɪɴɢ! 😂','ɪ ᴛᴏʟᴅ ᴍʏ ᴡɪꜰᴇ sʜᴇ ᴅʀᴇᴡ ᴇʏᴇʙʀᴏᴡs ᴛᴏᴏ ʜɪɢʜ. sʜᴇ ʟᴏᴏᴋᴇᴅ sᴜʀᴘʀɪsᴇᴅ 😲','ᴡʜʏ ᴅᴏɴ\'ᴛ sᴋᴇʟᴇᴛᴏɴs ꜰɪɢʜᴛ? ɴᴏ ɢᴜᴛs! 💀','ᴡʜᴀᴛ ᴅᴏ ʏᴏᴜ ᴄᴀʟʟ ꜰᴀᴋᴇ sᴘᴀɢʜᴇᴛᴛɪ? ᴀɴ ɪᴍᴘᴀsᴛᴀ! 🍝'];
  const facts=['🧠 ʜᴜᴍᴀɴ ʙʀᴀɪɴ = ~20 ᴡᴀᴛᴛs ᴏꜰ ᴘᴏᴡᴇʀ.','🐘 ᴇʟᴇᴘʜᴀɴᴛs ᴄᴀɴ\'ᴛ ᴊᴜᴍᴘ.','🍯 ʜᴏɴᴇʏ ɴᴇᴠᴇʀ ᴇxᴘɪʀᴇs.','🐙 ᴏᴄᴛᴏᴘᴜsᴇs ʜᴀᴠᴇ 3 ʜᴇᴀʀᴛs & ʙʟᴜᴇ ʙʟᴏᴏᴅ.','🌊 95% ᴏᴄᴇᴀɴ ᴜɴᴇxᴘʟᴏʀᴇᴅ.'];
  const quotes=['💡 _"ᴛʜᴇ ᴏɴʟʏ ᴡᴀʏ ᴛᴏ ᴅᴏ ɢʀᴇᴀᴛ ᴡᴏʀᴋ ɪs ᴛᴏ ʟᴏᴠᴇ ᴡʜᴀᴛ ʏᴏᴜ ᴅᴏ."_\n— Steve Jobs','🌟 _"ɪɴ ᴇᴠᴇʀʏ ᴅɪꜰꜰɪᴄᴜʟᴛʏ ʟɪᴇs ᴏᴘᴘᴏʀᴛᴜɴɪᴛʏ."_\n— Einstein'];
  const truths=['ᴡʜᴀᴛ\'s ʏᴏᴜʀ ʙɪɢɢᴇsᴛ sᴇᴄʀᴇᴛ?','ᴡʜᴏ ɪs ʏᴏᴜʀ sᴇᴄʀᴇᴛ ᴄʀᴜsʜ?','ᴡʜᴀᴛ\'s ᴛʜᴇ ᴍᴏsᴛ ᴇᴍʙᴀʀʀᴀssɪɴɢ ᴛʜɪɴɢ ᴛʜᴀᴛ ʜᴀᴘᴘᴇɴᴇᴅ ᴛᴏ ʏᴏᴜ?'];
  const dares=['sᴇɴᴅ ᴀ ᴠᴏɪᴄᴇ ɴᴏᴛᴇ sɪɴɢɪɴɢ ᴀ sᴏɴɢ! 🎵','ᴄʜᴀɴɢᴇ ʏᴏᴜʀ sᴛᴀᴛᴜs ᴛᴏ "ɪ ʟᴏᴠᴇ ᴜsᴍᴀɴ ᴍᴅ" ꜰᴏʀ 1 ʜ!','ᴅᴏ 10 ᴘᴜsʜ-ᴜᴘs & sᴇɴᴅ ᴠɪᴅᴇᴏ ᴘʀᴏᴏꜰ!'];
  const roasts=['ʏᴏᴜ\'ʀᴇ ᴘʀᴏᴏꜰ ᴇᴠᴏʟᴜᴛɪᴏɴ ᴄᴀɴ ɢᴏ ʙᴀᴄᴋᴡᴀʀᴅs. 😂','ɪ\'ᴅ ᴄᴀʟʟ ʏᴏᴜ ᴀ ᴛᴏᴏʟ ʙᴜᴛ ᴛᴏᴏʟs ᴀʀᴇ ᴜsᴇꜰᴜʟ. 🔧','ʏᴏᴜʀ ʙɪʀᴛʜ ᴄᴇʀᴛɪꜰɪᴄᴀᴛᴇ ɪs ᴀɴ ᴀᴘᴏʟᴏɢʏ ʟᴇᴛᴛᴇʀ. 😂'];
  const compliments=['ʏᴏᴜ ʟɪɢʜᴛ ᴜᴘ ᴇᴠᴇʀʏ ʀᴏᴏᴍ! ✨','ʏᴏᴜ ʜᴀᴠᴇ ᴀ ʜᴇᴀʀᴛ ᴏꜰ ɢᴏʟᴅ! 💛','ʏᴏᴜ\'ʀᴇ sᴛʀᴏɴɢᴇʀ ᴛʜᴀɴ ʏᴏᴜ ᴛʜɪɴᴋ! 💪'];

  register(['joke','jokes'],async(sock,msg,args,ctx)=>{await ctx.reply(`😂 *ᴊᴏᴋᴇ*\n\n${p(jokes)}`);await ctx.react('😂');});
  register(['fact','facts'],async(sock,msg,args,ctx)=>{await ctx.reply(`🤓 *ꜰᴀᴄᴛ*\n\n${p(facts)}`);await ctx.react('🤓');});
  register(['quote','motivation'],async(sock,msg,args,ctx)=>{await ctx.reply(p(quotes));await ctx.react('💡');});
  register(['8ball','ask'],async(sock,msg,args,ctx)=>{
    const q=args.join(' '); if(!q)return ctx.reply('❌ .8ball <question>');
    const ans=['✅ ᴅᴇꜰɪɴɪᴛᴇʟʏ ʏᴇs!','✅ ᴍᴏsᴛ ʟɪᴋᴇʟʏ!','🤔 ᴀsᴋ ᴀɢᴀɪɴ...','❌ ɴᴏ!','❌ ᴠᴇʀʏ ᴅᴏᴜʙᴛꜰᴜʟ.'];
    await ctx.reply(`🎱 *8-ʙᴀʟʟ*\n\n❓ ${q}\n\n${p(ans)}`);await ctx.react('🎱');
  });
  register(['truth'],async(sock,msg,args,ctx)=>{await ctx.reply(`🤫 *ᴛʀᴜᴛʜ*\n\n${p(truths)}`);await ctx.react('🤫');});
  register(['dare'],async(sock,msg,args,ctx)=>{await ctx.reply(`🎯 *ᴅᴀʀᴇ*\n\n${p(dares)}`);await ctx.react('🎯');});
  register(['ship'],async(sock,msg,args,ctx)=>{
    const m=msg.message?.extendedTextMessage?.contextInfo?.mentionedJid||[];
    if(m.length<2)return ctx.reply('❌ .ship @u1 @u2');
    const pct=Math.floor(Math.random()*101),bar='❤️'.repeat(Math.floor(pct/10))+'🖤'.repeat(10-Math.floor(pct/10));
    const s=pct>=80?'💍 sᴏᴜʟᴍᴀᴛᴇs!':pct>=60?'💕 ɢʀᴇᴀᴛ!':pct>=40?'🤝 ᴍᴀʏʙᴇ':'💔 ɴᴏᴘᴇ';
    await sock.sendMessage(ctx.jid,{text:`💘 *sʜɪᴘ*\n@${m[0].split('@')[0]} ❤️ @${m[1].split('@')[0]}\n\n${bar}\n*${pct}%* — ${s}`,mentions:m});
    await ctx.react('💘');
  });
  register(['rate'],async(sock,msg,args,ctx)=>{
    const m=msg.message?.extendedTextMessage?.contextInfo?.mentionedJid||[];
    const t=m[0]||ctx.sender,n=Math.floor(Math.random()*11),e=n>=8?'🔥':n>=5?'😊':'😬';
    await sock.sendMessage(ctx.jid,{text:`${e} *ʀᴀᴛᴇ*\n@${t.split('@')[0]}: *${n}/10*`,mentions:[t]});
    await ctx.react(e);
  });
  register(['roast'],async(sock,msg,args,ctx)=>{
    const m=msg.message?.extendedTextMessage?.contextInfo?.mentionedJid||[];
    if(!m.length)return ctx.reply('❌ ᴛᴀɢ sᴏᴍᴇᴏɴᴇ!');
    await sock.sendMessage(ctx.jid,{text:`🔥 *ʀᴏᴀsᴛ*\n@${m[0].split('@')[0]}: ${p(roasts)}`,mentions:m});
    await ctx.react('🔥');
  });
  register(['compliment','comp'],async(sock,msg,args,ctx)=>{
    const m=msg.message?.extendedTextMessage?.contextInfo?.mentionedJid||[];
    if(!m.length)return ctx.reply('❌ ᴛᴀɢ sᴏᴍᴇᴏɴᴇ!');
    await sock.sendMessage(ctx.jid,{text:`💝 *ᴄᴏᴍᴘ*\n@${m[0].split('@')[0]}: ${p(compliments)}`,mentions:m});
    await ctx.react('💝');
  });
  register(['rps'],async(sock,msg,args,ctx)=>{
    const c=['rock','paper','scissors'],u=args[0]?.toLowerCase();
    if(!c.includes(u))return ctx.reply('❌ .rps rock/paper/scissors');
    const b=p(c),em={rock:'🪨',paper:'📄',scissors:'✂️'};
    const r=u===b?'🤝 ᴅʀᴀᴡ!':((u==='rock'&&b==='scissors')||(u==='paper'&&b==='rock')||(u==='scissors'&&b==='paper'))?'🎉 ʏᴏᴜ ᴡɪɴ!':'🤖 ʙᴏᴛ ᴡɪɴs!';
    await ctx.reply(`✊ ʏᴏᴜ:${em[u]} ʙᴏᴛ:${em[b]}\n\n${r}`);await ctx.react('✊');
  });
  register(['dice','roll'],async(sock,msg,args,ctx)=>{await ctx.reply(`🎲 *ᴅɪᴄᴇ* → *${Math.floor(Math.random()*6)+1}*`);await ctx.react('🎲');});
  register(['flip','coin'],async(sock,msg,args,ctx)=>{await ctx.reply(`🪙 *ᴄᴏɪɴ* → ${Math.random()>0.5?'*ʜᴇᴀᴅs!*':'*ᴛᴀɪʟs!*'}`);await ctx.react('🪙');});
};

  // ── Prediction ────────────────────────────────────────────
  register(['predict', 'future', 'fortune'], async (sock, msg, args, ctx) => {
    const q = args.join(' ');
    if (!q) return ctx.reply('❌ *.predict <your question>*');
    const preds = [
      '🔮 The stars say... *YES*, without a doubt!',
      '🔮 *No* — the universe has other plans for you.',
      '🔮 *Very likely* — keep going!',
      '🔮 *Uncertain* — try again when the time is right.',
      '🔮 *Absolutely YES* — 100% happening!',
      '🔮 *Definitely NO* — something better is coming.',
      '🔮 *Maybe* — depends on your next move.',
      '🔮 *Signs point to YES* — trust the process.',
      '🔮 Haha... *NO* 💀',
      '🔮 *Without a doubt* — go for it!',
    ];
    const r = preds[Math.floor(Math.random() * preds.length)];
    await ctx.reply(`🔮 *Prediction for:* _${q}_\n\n${r}\n\n~ *ᴜsᴍᴀɴ ᴍᴅ v15*`);
    await ctx.react('🔮');
  });
