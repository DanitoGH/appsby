import {DeliverRequest} from "./requests";


export async function ViewRequest(endpoint, connectionParameters, data, shouldBackgroundRefresh, ttlInMinutes, useCacheIfAvailable) {

    let toSend = {};
    toSend.data = data;
    toSend.endpoint = endpoint;
    toSend.connectionParameters = connectionParameters;

    return DeliverRequest(toSend, "view", shouldBackgroundRefresh, ttlInMinutes, useCacheIfAvailable)

}
