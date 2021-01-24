import FingerprintJS from '@fingerprintjs/fingerprintjs';
import {DeliverRequest, InvalidateCacheAndCreateNew} from "./requests";
var axios = require('axios');
var { GlobalState } = require('react-gstate');


//const baseUrl =  || null;

class Auth extends GlobalState {

    constructor() {
        super(...arguments);

        //fire Axios requests to check auths
    }

    async signOut() {
        let x = this.getPreviousLoginMetadata();
        if (typeof window !== "undefined") {
            window.localStorage.clear();
        }
        this.setState({isAuthenticated: false});
        this.setState({accessToken: null});
        let y = await DeliverRequest({}, "logout", false, 0.001, false);
        InvalidateCacheAndCreateNew();
        window.localStorage.setItem("appsbyPreviousLogin", JSON.stringify(x))
    }

    getPreviousLoginMetadata() {
        if (typeof window !== "undefined") {
            return JSON.parse(window.localStorage.getItem("appsbyPreviousLogin"));
        }
    }

    async runAPIRequest(endpoint, data, connectionParameters = null) {

        const config = {
            headers: {
                Authorization: AppsbyGlobalState.getAccessToken()
            }
        };

        let toSend = {};
        toSend.data = data;
        toSend.endpoint = endpoint;
        toSend.connectionParameters = connectionParameters;
        toSend.deviceId = await AppsbyGlobalState.getDeviceId();

        return await axios.post(global.baseUrl + "api/", toSend, config).then(result => {
            if (result.status === 200) {
                if (typeof result.data.token === "string"){
                    AppsbyGlobalState.setAccessToken(result.data.token);
                }
                return result.data.data;
            } else if (result.status === 401) {
                AppsbyGlobalState.signOut()
            }
        });
    }

    async getFingerPrint() {
        if (typeof window !== "undefined") {
            if (!this.state.fingerPrint) {

                let fingerPrinter = await FingerprintJS.load();
                let theFingerPrint = await fingerPrinter.get()
                this.setState({fingerPrint: theFingerPrint.components});
                this.setState({deviceId: theFingerPrint.visitorId});

            }
            return this.state.fingerPrint;
        }
    }

    async getDeviceId() {
        if (!this.state.fingerPrint || !this.state.deviceId){
            await this.getFingerPrint();
        }
        return this.state.deviceId;
    }

    getAccessToken() {
        if (typeof window !== "undefined") {
            return window.localStorage.getItem("access_token");
        }
    }

    setAccessToken(token) {
        if (typeof window !== "undefined") {
            window.localStorage.setItem("access_token", token);
        }
        AppsbyGlobalState.setState({accessToken: token});
        AppsbyGlobalState.setState({isAuthenticated: true});
    }

    hasAccessToken() {
        return this.getAccessToken() != null;
    }

}



export const AppsbyGlobalState = new Auth({
    isAuthenticated: typeof window !== 'undefined' && window.localStorage.getItem("access_token") !== null,
    accessToken: typeof window !== 'undefined' && window.localStorage.getItem("access_token") !== null ? window.localStorage.getItem("access_token") : null,
    previousLogin: typeof window !== 'undefined' && window.localStorage.getItem("appsbyPreviousLogin") !== null ? JSON.parse(window.localStorage.getItem("appsbyPreviousLogin")) : null,
    fingerPrint: null,
    deviceId: null,
    isInApp: false,
    loginIdentifier: null,
});


export default function AppsbyAuthenticatorConnection(endpoint){

    this.endpoint = endpoint;
    const _this = this;

    InvalidateCacheAndCreateNew();

    this.login = async (data, loginIdentifier) => {

        let token;
        if (typeof window !== 'undefined' && window.localStorage.getItem("access_token") !== null) {
            token = window.localStorage.getItem("access_token")
        } else { token = null; }


        const toSend = {
            data: data,
            endpoint: endpoint,
            deviceFingerprint: await AppsbyGlobalState.getFingerPrint(),
            deviceId: await AppsbyGlobalState.getDeviceId(),
            token: token
        };

        try {
            return axios.post(global.baseUrl + "auth/", toSend).then(result => {
                if (result.status === 200) {
                    if (typeof result.data === "string"){
                        AppsbyGlobalState.setAccessToken(result.data);
                        AppsbyGlobalState.setState({isAuthenticated: true})
                        if (loginIdentifier) {
                            window.localStorage.setItem("appsbyPreviousLogin", JSON.stringify(loginIdentifier));
                            AppsbyGlobalState.setState({loginIdentifier: loginIdentifier});
                        }

                        InvalidateCacheAndCreateNew();

                        global.viewConnectors.forEach((connection) => {
                            connection.connect();
                        })
                        global.searchConnectors.forEach((connection) => {
                            connection.connect();
                        })
                    }
                    return { success: true, result: "" }
                }
            }).catch(result => {
                    if (result.response && result.response.data && result.response.data.errorMessage) {
                        return { success: false, result: result.response.data.errorMessage }
                    } else if (result.response && result.response.statusText) {
                        return { success: false, result: result.response.statusText }
                    } else {
                        return { success: false, result: "Your internet connection may be offline. Check it and refresh this page."}
                    }

            });
        } catch (e) {
            return { success: false, result: e }
        }
    };
}
