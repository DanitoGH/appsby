import {createReturnObject} from "../helpers/createReturnObject";
import {PrepareDoc} from "../helpers/doc-type-generics/PrepareDoc";

async function ProcessMIME(ViewInterpreter, headers, deviceId, connectionParameters) {

    const { view, identifiedUser } = await PrepareDoc(ViewInterpreter, headers, deviceId, connectionParameters)

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
