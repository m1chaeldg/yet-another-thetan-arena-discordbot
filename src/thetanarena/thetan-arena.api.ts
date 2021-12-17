import axios from "axios";

export class ThetaArenaApi {

    private reqConfig(authToken: string) {

        let headers: any = {
            'user-agent': 'UnityPlayer/2019.4.31f1 (UnityWebRequest/1.0, libcurl/7.75.0-DEV)',
            "content-type": "application/json",
            "accept": "*/*",
            "Accept-Encoding": "deflate, gzip",
            "X-Unity-Version": "2019.4.31f1",
        }

        if (authToken)
            headers['Authorization'] = 'Bearer ' + authToken;

        return {
            headers: headers
        };
    };

    public sendCode(emailAddress: string): Promise<any> {
        return axios.post("https://auth.thetanarena.com/auth/v1/sendCode", {
            email: emailAddress,
            createAccount: false,
            fromUnity: true,
        }, this.reqConfig(''));
    }

    public getProfile(userId: string): Promise<any> {
        return axios.get(`https://data.thetanarena.com/thetan/v1/profile/another?userId=${userId}&withRanking=True`, this.reqConfig(''));
    }
}

