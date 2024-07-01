const { Client, GatewayIntentBits, Partials } = require('discord.js');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent
    ],
    partials: [
        Partials.Message, 
        Partials.Channel, 
        Partials.Reaction
    ]
});
require('dotenv').config();

// カウンターマップとメッセージ履歴マップを定義
const counterMap = new Map();
const messageHistoryMap = new Map();

// ボットが起動したときの処理
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('threadCreate', async (thread) => {
    // 親チャンネルが指定された質問チャンネルかどうかを確認
    if (thread.parentId === process.env.QUESTION_CHANNEL_ID) {
        try {
            await thread.join();
            console.log(`Joined thread: ${thread.name}`);
            await thread.send('よろー');
            // 新しいスレッドに対してカウンターとメッセージ履歴を初期化
            counterMap.set(thread.id, 1);
            messageHistoryMap.set(thread.id, new Map());
        } catch (error) {
            console.error(`Failed to join thread: ${thread.name}`, error);
        }
    }
});

client.on('messageCreate', async (message) => {
    // ボット自身のメッセージには反応しない
    if (message.author.bot) return;

    // メッセージが指定されたチャンネルで送信されたかを確認
    const channel = message.channel;
    const parentChannel = channel.isThread() ? channel.parent : channel;

    // スレッドの親チャンネルが質問チャンネルIDかどうかを確認
    if (parentChannel.id !== process.env.QUESTION_CHANNEL_ID) return;

    // スレッドのIDを取得
    const threadId = channel.isThread() ? channel.id : null;

    // スレッドが存在しない場合は何もしない
    if (!threadId) return;

    // カウンターとメッセージ履歴を取得または初期化
    if (!counterMap.has(threadId)) {
        counterMap.set(threadId, 1);
    }
    if (!messageHistoryMap.has(threadId)) {
        messageHistoryMap.set(threadId, new Map());
    }
    const counter = counterMap.get(threadId);
    const messageHistory = messageHistoryMap.get(threadId);

    // "!reset"というメッセージが送信された場合、カウンターとメッセージ履歴をリセット
    if (message.content === '!reset') {
        counterMap.set(threadId, 1);
        messageHistory.clear();
        console.log('Counter has been reset to 1.');
        await message.reply('Counter has been reset to 1.');
        return;
    }

    // ">>"で始まるメッセージが送信された場合、対応するメッセージをコピーして返信
    const match = message.content.match(/^>>(\d+)/);
    if (match) {
        const messageIndex = parseInt(match[1], 10);
        if (messageHistory.has(messageIndex)) {
            const originalMessage = messageHistory.get(messageIndex);
            await message.reply(`> ${originalMessage.content}\n ${originalMessage.author}`);
        } else {
            await message.reply('メッセージはありません。');
        }
        return;
    }

    // メッセージ履歴に追加
    messageHistory.set(counter, message);

    // カウンターを増やす
    counterMap.set(threadId, counter + 1);
    console.log(`Counter: ${counter + 1}`);
});

client.on('messageCreate', message => {
    if (message.content === '生きてる？') {
      message.channel.send('生きてる');
    }
  });

client.login(process.env.DISCORD_TOKEN);

app.get('/', (req, res) => {
    res.send('Discord bot is running.');
  });
  
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });