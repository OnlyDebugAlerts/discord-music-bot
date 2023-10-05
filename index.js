import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { getVoiceConnection, joinVoiceChannel, createAudioPlayer, createAudioResource } from '@discordjs/voice';

import { stream, playlist_info } from 'play-dl';

const client = new Client({
    partials: [Partials.Channel],
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageTyping
    ]
});

client.on('ready', () => {
    console.log(`Бот подключен как ${client.user.tag}!`);
});

let queue = []
let player = null;


client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content.startsWith('!play')) {
        const args = message.content.split(' ');
        const url = args[1];

        try {
            console.log(url)
            const playlist = await playlist_info(url);
            console.log(await playlist.videos)
            queue.push(...await playlist.videos.map(it => it.url));
            console.log(queue)
            playNextSong(message);
        } catch (error) {
            console.log(error)
            queue.push(url);
            playNextSong(message);
        }
    }

    if (message.content === '!stop') {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            return message.reply('You need to be in a voice channel to stop the music!');
        }

        const connection = getVoiceConnection(voiceChannel.guild.id);

        await connection.destroy();
        queue = [];
    }

    if (message.content === '!skip') {
        if (player) {
            player.stop();
        }
    }
});

async function playNextSong(message) {
    try {
        if (!queue.length > 0) {
            return;
        }

        const url = queue.shift();
        const connection = joinVoiceChannel({
            channelId: message.member.voice.channelId,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator,
        });
        const songStream = await stream(url);
        const resource = createAudioResource(songStream.stream, { inputType: songStream.type, inlineVolume: true });
        resource.volume.setVolume(0.2);
        player = createAudioPlayer();

        player.play(resource);
        connection.subscribe(player);

        player.on('idle', () => {
            playNextSong(message);
        });
    } catch (e) {
        playNextSong(message)
    }

}



client.login('MTEzNjMxMTg0MDg2Mzk0ODgwMQ.GzqPf8.18PlhQgZdE8FxagMIvSnSSnxRSh0u2OrKEKK6Q');
