const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const http = require('http');

// 建置簡易 HTTP Server 滿足 Render 的 Port 監聽檢查
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Discord Bot is running!\n');
}).listen(PORT, () => {
  console.log(`🌐 Web server is listening on port ${PORT}`);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const GAS_URL = process.env.GAS_URL;

client.once('ready', () => {
  console.log(`✅ Bot 成功登入為：${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.channel.isThread()) {
    const text = message.content;

    if (text.includes('劇本') || text.includes('剧本')) {
      console.log(`📩 收到開團訊息，討論串名稱：${message.channel.name}`);

      const payload = {
        threadName: message.channel.name,
        content: text,
        author: message.author.username
      };

      try {
        const response = await axios.post(GAS_URL, payload);
        console.log('🌐 GAS 回應：', response.data);
        await message.react('📅');
      } catch (error) {
        console.error('❌ 傳送至 GAS 失敗：', error.message);
      }
    }
  }
});

client.login(DISCORD_TOKEN);
