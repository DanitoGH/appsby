//amazonMetadata { key: value }
import {v4 as uuidv4} from "uuid";
import {generateS3, GenerateUploadKey, S3CheckIfFileExists} from "../helpers/amazon";
import {performAuthentication} from "./handle-auth";
import {createReturnObject} from "../helpers/createReturnObject";
import remove from "confusables";
import {
    AppsbyCreateSingleDocument,
    AppsbyDeleteSingleDocumentById,
    AppsbyGetSingleDocumentByFields, AppsbyGetSingleDocumentById
} from "../helpers/fauna-functions";

async function ProcessUploadComplete(ViewInterpreter, headers, deviceId, key) {

    let doc = await AppsbyGetSingleDocumentByFields("appsbyFileTransitCache", { fileId: key });

    const view = await new ViewInterpreter(doc.document.connectionParameters);

    const identifiedUser = await performAuthentication(headers, deviceId, view.authenticator);
    if (typeof identifiedUser === "object"){
        view.props.user = identifiedUser.user;
        view.props.userId = identifiedUser.userId;
    }

    view.props.connectionParameters = doc.document.connectionParameters;
    view.state = doc.document.state;
    view.props.fileId = doc.document.fileId;
    view.props.fileType = doc.document.fileType;
    view.props.fileExtension = doc.document.fileExtension;
    view.props.documentId = doc.documentId;
    view.props.documentType = doc.documentType
    view.props.faunaDocumentRef = doc.faunaDocumentRef;
    view.props.autoSave = false

    await view.componentDidMount();


    let uploadCompleted = await S3CheckIfFileExists(view.props.uploadBucket.name, view.props.fileId)

    if (identifiedUser && !uploadCompleted) {
        throw new Error("[400] There was an issue completing the upload. Please try again.")
    }

    if (identifiedUser && uploadCompleted) {
        let x = await view.componentDidCompleteUpload();
        return createReturnObject(identifiedUser, x);

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
    const { endpoint, deviceId, key } = event.body;
    console.log(event);

    let relatedEndpoint = global.appsbyFiles.find(x => x.endpoint === endpoint);

    if (relatedEndpoint){
        return ProcessUploadComplete(relatedEndpoint.handler, event.headers, deviceId, key)
    } else {
        throw new Error('[404] No matching view.');
    }
};
