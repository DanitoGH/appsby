import {DeliverRequest} from "./requests";

/*const client = new AWSMqttClient({
    region: AWS.config.region,
    credentials: AWS.config.credentials,
    endpoint: '...iot.us-east-1.amazonaws.com', // NOTE: See below on how to get the endpoint domain
    expires: 600, // Sign url with expiration of 600 seconds
    clientId: 'mqtt-client-' + (Math.floor((Math.random() * 100000) + 1)), // clientId to register with MQTT broker. Need to be unique per client
    will: {
        topic: 'WillMsg',
        payload: 'Connection Closed abnormally..!',
        qos: 0,
        retain: false
    }
})*/

export async function ViewRequest(endpoint, connectionParameters, data, shouldBackgroundRefresh, ttlInMinutes, useCacheIfAvailable) {

    let toSend = {};
    toSend.data = data;
    toSend.endpoint = endpoint;
    toSend.connectionParameters = connectionParameters;

    return DeliverRequest(toSend, "view", shouldBackgroundRefresh, ttlInMinutes, useCacheIfAvailable)

}
