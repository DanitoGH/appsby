//amazonMetadata { key: value }
import {v4 as uuidv4} from "uuid";
import {generateS3, GenerateUploadKey} from "../helpers/amazon";
import {performAuthentication} from "./handle-auth";
import {createReturnObject} from "../helpers/createReturnObject";

async function ProcessMIME(ViewInterpreter, headers, deviceId, connectionParameters) {

    const view = await new ViewInterpreter(connectionParameters);
    view.props = {};
    view.state = {}
    view.props.connectionParameters = connectionParameters;

    const identifiedUser = await performAuthentication(headers, deviceId, view.authenticator);

    if (typeof identifiedUser === "object"){
        view.props.user = identifiedUser.user;
        view.props.userId = identifiedUser.userId;
    }

    await view.componentDidMount();

    if (identifiedUser && await view.componentShouldAuthorizeUpload()) {

        return createReturnObject(identifiedUser, view.props.fileTypes);

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
    const { endpoint, data, connectionParameters, deviceId } = event.body;
    console.log(event);

    let relatedEndpoint = global.appsbyFiles.find(x => x.endpoint === endpoint);

    if (relatedEndpoint){
        return ProcessMIME(relatedEndpoint.handler, event.headers, deviceId, connectionParameters)
    } else {
        throw new Error('[404] No matching view.');
    }
};
