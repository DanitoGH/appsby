//amazonMetadata { key: value }
import {v4 as uuidv4} from "uuid";
import {generateS3, GenerateUploadKey} from "../helpers/amazon";
import {performAuthentication} from "./handle-auth";
import {createReturnObject} from "../helpers/createReturnObject";
import remove from "confusables";
import {AppsbyCreateSingleDocument, AppsbyDeleteSingleDocumentById} from "../helpers/fauna-functions";

async function ProcessUpload(ViewInterpreter, headers, deviceId, connectionParameters, fileName, magicBytes100Sample, endpoint) {

    const view = await new ViewInterpreter(connectionParameters);
    view.props = {};
    view.state = {}
    view.props.connectionParameters = connectionParameters;

    const identifiedUser = await performAuthentication(headers, deviceId, view.authenticator);

    if (typeof identifiedUser === "object"){
        view.props.user = identifiedUser.user;
        view.props.userId = identifiedUser.userId;
    }

    view.state = {};
    let newUuid = uuidv4();

    view.props.fileId = newUuid;
    view.props.documentId = null;
    view.props.documentType = "appsbyFileTransitCache"
    view.props.faunaDocumentRef = null;
    view.props.autoSave = false

    await view.componentDidMount();

    if (identifiedUser && await view.componentShouldAuthorizeUpload()) {

        if (view.props.uploadBucket.name || view.props.downloadBucket.name) {
            if (view.props.callback){
            }

            let { s3GeneratedLink, fileType, fileExtension }  = await GenerateUploadKey(newUuid, {}, view.props.fileTypes, view.props.uploadBucket.name, view.props.userId, identifiedUser.userType, fileName, magicBytes100Sample, endpoint, view.props.callback ? view.props.callback : "")

            let doc = await AppsbyCreateSingleDocument("appsbyFileTransitCache", { fileId: newUuid, fileType: fileType, fileExtension: fileExtension, state: view.state, connectionParameters: view.props.connectionParameters });


            return createReturnObject(identifiedUser, s3GeneratedLink);
        }

        throw new Error("[500] Upload buckets not set.");

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
    const { endpoint, connectionParameters, deviceId, fileName, magicBytes100Sample } = event.body;
    console.log(event);

    let relatedEndpoint = global.appsbyFiles.find(x => x.endpoint === endpoint);

    if (relatedEndpoint){
        return ProcessUpload(relatedEndpoint.handler, event.headers, deviceId, connectionParameters, fileName, magicBytes100Sample, relatedEndpoint.endpoint)
    } else {
        throw new Error('[404] No matching view.');
    }
};
