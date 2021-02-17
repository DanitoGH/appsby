import {CreateJWT, VerifyJWT} from "../helpers/JWT";

async function ProcessAuth(AuthInterpreter, connectionParameters, deviceFingerprint, deviceId, token, relatedAuthEndpoint) {

    const view = await new AuthInterpreter.default(connectionParameters);
    view.props = {};
    view.state = {}
    view.props.connectionParameters = connectionParameters;
    view.props.deviceId = deviceId;
    await view.componentDidMount();

    if (await view.login()){
        if (view.props.documentId === null) { throw new Error("[500] Auth components must have props.documentId when login() is called. Make sure you call useDocument() before returning login().") }
        return CreateJWT(process.env.websiteAddress, view.props.userId, relatedAuthEndpoint, process.env.jwtKey, process.env.keyOf32Bytes, deviceId, deviceFingerprint, token);
    } else {
        throw new Error("[401] Couldn't login");
    }
}

export async function CreateNewUserJWT(userId, relatedAuthEndpoint, deviceId, deviceFingerprint) {
    var returnObject = { token: null, data: {} };
    returnObject.token = await CreateJWT(process.env.websiteAddress, userId, relatedAuthEndpoint, process.env.jwtKey, process.env.keyOf32Bytes, deviceId, deviceFingerprint);
    returnObject.reauthenticated = true;
    return returnObject;
}

async function VerifyAuth(relatedAuthEndpoint, token, deviceId) {

    let relatedEndpoint = global.appsbyAuth.find(x => x.endpoint === relatedAuthEndpoint);

    if (relatedEndpoint){
        return RetrieveUserFromAuth(relatedEndpoint.handler, relatedEndpoint.endpoint, token, deviceId)
    } else {
        throw new Error('[404] No matching view.');
    }

}

async function RetrieveUserFromAuth(AuthInterpreter, relatedAuthEndpoint, token, deviceId) {
    const decodedToken = await VerifyJWT(process.env.websiteAddress, process.env.jwtKey, process.env.keyOf32Bytes, deviceId, token);
    if (decodedToken){
        let relevantUserId = decodedToken.authentications.find(x => x.id === relatedAuthEndpoint).subject;

        let view = await new AuthInterpreter.default();
        view.props = {};
        view.state = {}
        view.props.connectionParameters = {};

        view.injectedIDForUseDocumentOnAuth = relevantUserId;
        await view.componentDidMount();
        let userDocument = view.state;
        let userDocumentType = view.props.documentType

        //let userDocument = await login.//;InternalGetDocById("user", relevantUserId);

            //Refresh the JWT
        return { user: userDocument, userType: userDocumentType, userId: relevantUserId, jwt: await CreateJWT(process.env.websiteAddress, decodedToken, null, process.env.jwtKey, process.env.keyOf32Bytes, deviceId, null, token) }
    } else {
        throw new Error("[401] Unable to verify token. Please login again.")
    }
}

export async function performAuthentication(headers, deviceId, authenticator) {

    if (authenticator) {


        let exploded;
        try {
            exploded = headers.cookie
                .split(';')
                .reduce((res, c) => {
                    const [key, val] = c.trim().split('=').map(decodeURIComponent)
                    const allNumbers = str => /^\d+$/.test(str);
                    try {
                        return Object.assign(res, { [key]: allNumbers(val) ?  val : JSON.parse(val) })
                    } catch (e) {
                        return Object.assign(res, { [key]: val })
                    }
                }, {});
        } catch (e) {
            if (typeof authenticator === "object" && authenticator.canBePublic) {
                return true;
            } else {
                throw new Error("[401] Please login again");
            }
        }



        /*let x = headers.authorization || headers.Authorization;

        if (!exploded["_appsbyXSRF"] || !exploded["_appsbyToken"]) { throw new Error('[401] Please log-in again'); }

        if (x !== exploded["_appsbyXSRF"]) {
            console.log(x, exploded["_appsbyXSRF"])
            throw new Error('[401] Please log-in again');
        }*/


        let loginResult = false;

        if (typeof authenticator === "string"){
            let token = exploded["_appsbyToken"];
            if (!token) { return }
            loginResult = await VerifyAuth(authenticator, token, deviceId);
        } else if (typeof authenticator === "object") {
            if (authenticator.authenticator && authenticator.canBePublic) {
                try {
                    let token = exploded["_appsbyToken"];
                    loginResult = await VerifyAuth(authenticator.authenticator, token, deviceId);
                } catch (e) {
                    loginResult = true;
                }
            } else {
                let token = exploded["_appsbyToken"];
                if (!token) { return }
                loginResult = await VerifyAuth(authenticator, token, deviceId);
            }
        }


        if (loginResult) { return loginResult; } else { throw new Error("[401] Please login again");}
    } else {
        return true;
    }
}

export default async (event) => {
    // eslint-disable-next-line no-param-reassign
    event.body = JSON.parse(event.body);
    const { data, endpoint, deviceFingerprint, deviceId, token, preloads } = event.body;

    let relatedEndpoint = global.appsbyAuth.find(x => x.endpoint === endpoint);

    if (relatedEndpoint){
        return ProcessAuth(relatedEndpoint.handler, data, deviceFingerprint, deviceId, token, relatedEndpoint.endpoint);
        /*if (preloads) {
            for (const item of preloads) {
                if (item.type === "view") {
                    let y = await HandleDocument()
                }
            }
        }*/
    } else {
        throw new Error('[404] No matching view.');
    }
};
