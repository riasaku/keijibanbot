const { Client, GatewayIntentBits, Partials } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});
require('dotenv').config();



// カウンター変数を定義
let counter = 1;

// メッセージ履歴を保存するマップ
const messageHistory = new Map();

// ボットが起動したときの処理
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('threadCreate', async (thread) => {
    console.log("a")
    // 親チャンネルが指定された質問チャンネルかどうかを確認
    if (thread.parentId === process.env.QUESTION_CHANNEL_ID) {
        console.log("a")
        try {
            await thread.join();
            console.log(`Joined thread: ${thread.name}`);
            await thread.send('よろー');
        } catch (error) {
            console.error(`Failed to join thread: ${thread.name}`, error);
        }
    }
});

// メッセージが送信されたときの処理
client.on('messageCreate', async (message) => {
    console.log("メッセージ送信")
    // ボット自身のメッセージには反応しない
    if (message.author.bot) return;

    // メッセージが指定されたチャンネルで送信されたかを確認
    const channel = message.channel;
    const parentChannel = channel.isThread() ? channel.parent : channel;

    // スレッドの親チャンネルが質問チャンネルIDかどうかを確認
    if (parentChannel.id !== process.env.QUESTION_CHANNEL_ID) return;

    // メッセージ履歴に追加
    messageHistory.set(counter, message);
    await message.channel.send(`${counter}`);


    // "!reset"というメッセージが送信された場合、カウンターをリセット
    if (message.content === '!reset') {
        counter = 1;
        messageHistory.clear();
        console.log('Counter has been reset to 0.');
        await message.reply('Counter has been reset to 0.');
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
            await message.reply('Message not found.');
        }
        return;
    }

    // カウンターを増やす
    counter += 1;
    console.log(`Counter: ${counter}`);
});

client.login(process.env.DISCORD_TOKEN);
