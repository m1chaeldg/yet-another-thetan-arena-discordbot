import { Client, Message, MessageEmbed } from "discord.js";
import { DataService } from "./dataService";
import { LazyCache } from "./lazy-cache";
import { Content, DiscordAccount, Representative, ThetanArenaAccount, ThetanArenaScholarAccount } from "../types";
import { ThetaArenaApi } from "./thetan-arena.api";

export class Command {

    private managers = ['Shim', 'Mike', 'Wessa', 'ser0wl'].join(',').toLowerCase().split(',');
    private cache: LazyCache = new LazyCache();
    private replyEmoji = ['👍', '👌', '💪', '😜', '🤪', '😀', '😁', '😆', '😅', '😂', '🤣'];
    private thetaArenaApi = new ThetaArenaApi();

    public discordWhitelistAccounts: DiscordAccount = {};
    public scholars: ThetanArenaScholarAccount = {};
    public representative: Representative = {};
    private pendingRequests: { [key: string]: Set<string> } = {};

    constructor(private dataService: DataService) {
    }

    public async handleHelp(message: Message, content: Content): Promise<void> {

        const help: { [key: string]: string } = {
            '!code': 'Request for thetan arena login code of the current requestor or author or isko',
        }

        const helpString = Object.keys(help).map(k => `${k}\n - ${help[k]}`).join('\n');

        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Help')
            .addField('User Command List', helpString)
            .setTimestamp()
            .setFooter('Thetan Arena PH Bot');

        await message.channel.send({
            embeds: [embed]
        });
    }

    public async handleLoginCodeFromG(client: Client, message: Message, content: Content): Promise<void> {
        const list: { from: string, to: string, code: string }[] = JSON.parse(content.body);
        for (const item of list) {
            const authors = this.pendingRequests[item.to.toLowerCase()];

            delete this.pendingRequests[item.to.toLowerCase()];
            const key = this.cache.getKey(item.to.toLowerCase(), []);
            console.log({ from: 'handleLoginCodeFromG', key });

            this.cache.set(key, { success: true, token: item.code });

            if (authors) {
                const isko = Object.values(this.scholars).find(c => c.emailAddress === item.to);
                if (isko)
                    for (const author of authors) {
                        const foundAuthor = await client.users.fetch(author);
                        foundAuthor.send(`Here is the new Login Code of ${isko.displayName}: [ ${item.code} ]`);
                    }
            }
        }

        // TODO : delete after testing
        message.delete();

        console.log({ pendingRequests: this.pendingRequests });
    }

    public async handleLoginCodeRequest(message: Message, content: Content): Promise<void> {
        const requestor = this.getIskoNameByDiscordId(message.author.id);
        if (!requestor) {
            await message.reply('no permission to request login code');
            await message.react('❌');
            return;
        }

        const loginCodeFor = this.getLoginFor(message, content);
        if (!loginCodeFor || (!loginCodeFor.discordId && !loginCodeFor.scholarName)) {
            await message.react('❌');
            return;
        }

        const targetAccount = loginCodeFor.discordId ? this.getIskoNameByDiscordId(loginCodeFor.discordId)?.name : loginCodeFor.scholarName;

        if (targetAccount && this.scholars.hasOwnProperty(targetAccount)) {
            const isko = this.scholars[targetAccount];

            if (this.managers.includes(requestor.name)) {
                await this.sendLoginCode(message, isko);
                console.log(`${new Date().toISOString()} : ${requestor.name} requested Login Code of ${isko.displayName}`);
                return;
            } else if (this.representative.hasOwnProperty(requestor.name) && this.representative[requestor.name].includes(isko.name)) {
                await this.sendLoginCode(message, isko);
                console.log(`${new Date().toISOString()} : ${requestor.name} requested Login Code of ${isko.displayName}`);
                return;
            } else if (requestor.name === isko.name) {
                await this.sendLoginCode(message, isko);
                console.log(`${new Date().toISOString()} : ${requestor.name} requested Login Code`);
                return;
            } else {
                await message.reply('no permission to request Login Code');
            }

        } else {
            await message.reply('Discord ID or Name is not map. Check if properly map with that ID or Name');
        }
        // no isko name found
        await message.react('❌');
    }
    private async sendLoginCode(message: Message, isko: ThetanArenaAccount): Promise<void> {
        if (isko && isko.emailAddress) {
            console.log(`${new Date().toISOString()} : ${isko.displayName} requested Login Code`);

            await message.react(this.getRandomReactEmoji());

            const loginToken = await this.cache.get(isko.emailAddress.toLowerCase(), async () => {
                const { data } = await this.thetaArenaApi.sendCode(isko.emailAddress);

                return { success: data.success, token: '' };
            });
            console.log({ loginToken });

            if (!loginToken.success) {
                message.reply('Thetan Arena api is not working right now.');
                await message.react('❌');
            } else if (loginToken.success && !loginToken.token) {
                if (!this.pendingRequests.hasOwnProperty(isko.emailAddress.toLowerCase()))
                    this.pendingRequests[isko.emailAddress.toLowerCase()] = new Set<string>();

                this.pendingRequests[isko.emailAddress.toLowerCase()].add(message.author.id);

                message.reply('Please wait while the bot is requesting a login code. It will take a few minutes.');
            } else {
                await message.author.send(`Here is the new Login Code of ${isko.displayName}: [ ${loginToken.token} ]`);
            }
        } else {
            await message.react('❌');
        }
    }

    private getLoginFor(message: Message, content: Content): {
        discordId?: string,
        scholarName?: string
    } | null {
        // get first the mention user
        if (message.mentions.users.size > 0)
            return {
                discordId: message.mentions.users.first()?.id || '',
            }

        // get from message body/content
        if (content.body) {
            const name = content.body.split(' ')[0].toLowerCase();
            const account = Object.values(this.discordWhitelistAccounts).find(v => v.name.toLowerCase() === name || v.discordId === name);
            if (account)
                return {
                    discordId: account.discordId,
                }

            else {
                if (this.scholars.hasOwnProperty(name))
                    return {
                        scholarName: name
                    }
                else
                    return null;

            }
        }
        // if no qr body, use the author
        return {
            discordId: message.author.id,
        };
    }
    public async fakeInfo() {
        this.discordWhitelistAccounts = { 'mike': { name: 'mike', discordId: '123546' } };
        this.scholars = {
            'car': {
                name: 'Car',
                emailAddress: 'hardcode@gmail.com',
                displayName: 'Car'
            }
        };
        this.representative = { 'mike': ['car', 'mike'] };

        console.log(`${new Date().toISOString()} : Credentials refreshed`);
    }
    public async handleRefreshCreds(client: Client, _message: Message | null, _content: Content | null): Promise<void> {

        await this.dataService.initSheet();

        const res = await Promise.all([
            this.dataService.getDiscordAccounts(),
            this.dataService.getThetanArenaScholars(),
            this.dataService.getRepresentatives()
        ])
        this.discordWhitelistAccounts = res[0];
        this.scholars = res[1];
        this.representative = res[2];

        client.user?.setActivity('Thetan Arena', { type: 'PLAYING' });
        if (_message) {
            await _message.reply('Credentials refreshed');
        }

        console.log(`${new Date().toISOString()} : Credentials refreshed`);
    }

    public async handleIskonamesRequest(message: Message, _: Content): Promise<void> {
        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle('Scholars')
            .addField('Names', Object.values(this.scholars).map(c => c.displayName).join('\n'))
            .setTimestamp()
            .setFooter('Thetan Arena PH Bot');

        await message.channel.send({
            embeds: [embed]
        });
    }


    public getIskoNameByDiscordId(discordId: string) {
        return Object.values(this.discordWhitelistAccounts).find(c => c.discordId === discordId);
    }

    public getRandomReactEmoji() {
        return this.replyEmoji[Math.floor(Math.random() * this.replyEmoji.length)];
    }
}

