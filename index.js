const { Client, GatewayIntentBits } = require('discord.js');
const http = require('http');
const axios = require('axios');

// 1. 環境變數確認
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const GAS_URL = process.env.GAS_URL;

if (!DISCORD_TOKEN || !GAS_URL) {
  console.error('❌ 錯誤：請確保環境變數 DISCORD_TOKEN 與 GAS_URL 設定正確！');
  process.exit(1);
}

// 2. 建立 HTTP Server (防止 Render 502 Bad Gateway 與提供 UptimeRobot 監測)
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Discord Bot & Calendar Sync is active!');
});

server.listen(PORT, () => {
  console.log(`✅ HTTP Server 已啟動，通訊埠：${PORT}`);
});

// 3. 初始化 Discord Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`✅ Bot 成功登入為：${client.user.tag}`);
});

// 4. 監聽訊息事件
client.on('messageCreate', async (message) => {
  // 忽略機器人自身的訊息
  if (message.author.bot) return;

  // 檢查是否在「討論串 (Thread)」中發文
  if (!message.channel.isThread()) return;

  const content = message.content;
  
  // 判斷是否包含關鍵字（劇本/說書/ST/DM 等）
  const hasScript = /(?:劇本|剧本)/i.test(content);
  const hasHost = /(?:說書人|說書|说书人|说书|ST|DM|主持)/i.test(content);

  if (hasScript || hasHost) {
    try {
      // 貼上 📅 處理中表情符號
      await message.react('📅');

      // 整理發送給 GAS 的資料包
      const payload = {
        threadName: message.channel.name, // 討論串名稱 (例如: 9/30(三)22:00 暗流湧動)
        content: content,                 // 訊息全文內容
        author: message.author.username
      };

      // 發送請求給 Google Apps Script
      const response = await axios.post(GAS_URL, payload);

      if (response.data && response.data.status === 'success') {
        console.log(`✅ 成功同步至日曆：${response.data.eventTitle}`);
      } else {
        console.error('⚠️ GAS 回傳異常：', response.data);
      }

    } catch (error) {
      console.error('❌ 同步失敗：', error.message);
    }
  }
});

// 5. 登入 Discord
client.login(DISCORD_TOKEN);
