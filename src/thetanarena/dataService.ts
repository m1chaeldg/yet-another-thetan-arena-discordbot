import { DiscordAccount, Representative, ThetanArenaScholarAccount } from "../types";
import { google, sheets_v4 } from 'googleapis';

export class DataService {

    SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
    config: {
        gooleSheetClientEmail: string;
        gooleSheetPrivateKey: string;
        gooleSheetSpreadsheetId: string;
    };

    constructor() {
        this.config = {
            gooleSheetClientEmail: process.env.GOOGLE_EMAIL || '',
            gooleSheetPrivateKey: (process.env.GOOGLE_PRIVATE_KEY || '').split('\\n').join('\n'),
            gooleSheetSpreadsheetId: process.env.ISKO_SPREADSHEET_ID || '',
        }
        if (!this.config.gooleSheetClientEmail ||
            !this.config.gooleSheetPrivateKey ||
            !this.config.gooleSheetSpreadsheetId) {
            throw new Error('Missing config');
        }
    }

    ISKO_DiscordAccount = 'DiscordAccount!A2:B100'
    ISKO_Representative = 'Representative!A2:B100'
    ISKO_ThetanArenaAccounts = 'ThetanArenaIsko!A2:E100'

    sheets: sheets_v4.Sheets | undefined;

    public async initSheet() {
        // configure a JWT auth client
        let jwtClient = new google.auth.JWT(
            this.config.gooleSheetClientEmail,
            undefined,
            this.config.gooleSheetPrivateKey,
            this.SCOPES);
        //authenticate request
        // const creds = await jwtClient.authorize();
        this.sheets = google.sheets({ version: 'v4', auth: jwtClient });
    }

    private async getData(cellRange: string) {
        if (!this.sheets)
            await this.initSheet();

        const range = await this.sheets?.spreadsheets.values.get({
            spreadsheetId: this.config.gooleSheetSpreadsheetId,
            range: cellRange,
        });
        return range?.data.values;
    }
    async getDiscordAccounts(): Promise<DiscordAccount> {
        const values = await this.getData(this.ISKO_DiscordAccount);
        const accounts: DiscordAccount = {};

        if (values)
            values.forEach(row => {
                if (row && row.length > 1 && row[0] && row[1]) {
                    const name = row[0].toLowerCase();
                    const discordId = row[1].toLowerCase();
                    accounts[name] = {
                        name: name,
                        discordId: discordId,
                    };
                }
            });

        return accounts;
    }
    async getRepresentatives(): Promise<Representative> {
        const values = await this.getData(this.ISKO_Representative);
        const accounts: Representative = {};

        if (values)
            values.forEach(row => {
                if (row && row.length > 1) {
                    const representative = (row[0] || '').toLowerCase();
                    const targetName = (row[1] || '').toLowerCase();
                    if (representative && targetName) {
                        if (!accounts[representative])
                            accounts[representative] = [];

                        accounts[representative].push(targetName);
                    }
                }

            });

        return accounts;
    }

    public async getThetanArenaScholars(): Promise<ThetanArenaScholarAccount> {
        const values = await this.getData(this.ISKO_ThetanArenaAccounts);
        const scholars: ThetanArenaScholarAccount = {};

        if (values)
            values.forEach(row => {
                if (row && row.length > 0) {
                    const name = (row[0] || '').toLowerCase();
                    const emailAddress = (row[1] || '').toLowerCase();

                    if (name && emailAddress)
                        scholars[name] = {
                            name: name,
                            emailAddress: row[1] || '',
                            displayName: row[0] || ''
                        };
                }
            });

        return scholars;
    }
}