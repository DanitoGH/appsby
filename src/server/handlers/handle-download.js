import {GenerateDownloadKey} from "../helpers/amazon";
import {createReturnObject} from "../helpers/createReturnObject";
import {PrepareDoc} from "../helpers/doc-type-generics/PrepareDoc";

async function ProcessDownload(ViewInterpreter, headers, deviceId, key, connectionParameters) {

    const { view, identifiedUser } = await PrepareDoc(ViewInterpreter, headers, deviceId, connectionParameters);

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

