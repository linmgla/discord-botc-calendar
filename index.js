const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

// 初始化 Discord Bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 讀取 Render 環境變數
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const GAS_URL = process.env.GAS_URL;

client.once('ready', () => {
  console.log(`Bot 已經成功登入：${client.user.tag}`);
});

// 監聽新訊息（包含討論串內的新訊息）
client.on('messageCreate', async (message) => {
  // 忽略機器人自身的訊息
  if (message.author.bot) return;

  // 檢查訊息是否來自討論串 (Thread)
  if (message.channel.isThread()) {
    const text = message.content;

    // 檢查是否包含「劇本」關鍵字
    if (text.includes('劇本')) {
      console.log(`收到開團訊息：${message.channel.name}`);

      const payload = {
        threadName: message.channel.name, // 取得討論串標題 (例如: 10/3(六) 勇者鬥惡龍)
        content: text,                    // 訊息全文
        author: message.author.username
      };

      try {
        const response = await axios.post(GAS_URL, payload);
        console.log('GAS 回應：', response.data);
        
        // 成功後給訊息打勾 📅 表情符號
        await message.react('📅');
      } catch (error) {
        console.error('傳送給 GAS 失敗：', error.message);
      }
    }
  }
});

client.login(DISCORD_TOKEN);
