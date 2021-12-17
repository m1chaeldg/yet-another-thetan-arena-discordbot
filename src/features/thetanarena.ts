import { Client, Message } from 'discord.js';
import { DataService } from '../thetanarena/dataService';
import { Content, OnMessageHandler, OnStartupHandler } from '../types';
import { Command } from '../thetanarena/command';

const prefix = '!';

const handler = new Command(new DataService());

export const onStartup: OnStartupHandler = async (client: Client): Promise<void> => {
    await handler.handleRefreshCreds(client, null, null);
}
export const onMessage: OnMessageHandler = async (client, message: Message) => {

    if (!message.content.startsWith(prefix) || message.author.id === client.user?.id)
        return;

    const args = message.content.slice(prefix.length).trim().split(' ') || [];
    const command = args.shift()?.toLowerCase() || '';
    const content: Content = {
        command: command,
        body: args.join(' ')
    };

    if (!command)
        return; // no command provided

    if (message.author.bot && message.webhookId && command === 'fromg') {
        await handler.handleLoginCodeFromG(client, message, content);
    } else if (handler.getIskoNameByDiscordId(message.author.id.toString())) {
        // if author is part of the discord white list or it the message came from webhook
        switch (command) {
            case 'help':
                await handler.handleHelp(message, content);
                break;
            case 'pong':
            case 'ping':
                await message.channel.send('online');
                break;
            case 'up':
            case 'alive':
            case 'awake':
                await message.react(handler.getRandomReactEmoji());
                break;
            case 'code':
            case 'logincode':
                await handler.handleLoginCodeRequest(message, content);
                break;
            case 'iskonames':
                await handler.handleIskonamesRequest(message, content);
                break;
            case 'refreshcreds':
                await handler.handleRefreshCreds(client, message, content);
                break;
        }
    }
};

