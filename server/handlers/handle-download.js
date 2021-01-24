import {performAuthentication} from "./handle-auth";
import {GenerateDownloadKey} from "../helpers/amazon";
import {createReturnObject} from "../helpers/createReturnObject";

async function ProcessDownload(ViewInterpreter, headers, deviceId, key, connectionParameters) {

    const view = await new ViewInterpreter();
    view.props = {};
    view.state = {}
    view.props.connectionParameters = connectionParameters;

    const identifiedUser = await performAuthentication(headers, deviceId, view.authenticator);

    if (typeof identifiedUser === "object"){
        view.props.user = identifiedUser.user;
        view.props.userId = identifiedUser.userId;
    }

    await view.componentDidMount();

    if (identifiedUser && await view.componentShouldAuthorizeDownload()) {
        return GenerateDownloadKey(view.downloadBucketName, key);

    } else if (identifiedUser) {
        //user was identified but didn't have access
        return createReturnObject(identifiedUser, {});
    } else {
        throw new Error("[401] Unauthorized");
    }
}

export default async (event) => {
    // eslint-disable-next-line no-param-reassign
    event.body = JSON.parse(event.body);
    const { endpoint, connectionParameters, deviceId, key } = event.body;

    let relatedEndpoint = global.appsbyFiles.find(x => x.endpoint === endpoint);

    if (relatedEndpoint){
        return ProcessDownload(relatedEndpoint.handler, event.headers, deviceId, key, connectionParameters)
    } else {
        throw new Error('[404] No matching view.');
    }
};

