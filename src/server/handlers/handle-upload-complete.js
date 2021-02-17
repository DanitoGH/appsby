import {S3CheckIfFileExists} from "../helpers/amazon";
import {createReturnObject} from "../helpers/createReturnObject";
import {AppsbyGetSingleDocument} from "../helpers/fauna-functions";
import {PrepareDoc} from "../helpers/doc-type-generics/PrepareDoc";

async function ProcessUploadComplete(ViewInterpreter, headers, deviceId, key) {

    let doc = await AppsbyGetSingleDocument("appsbyFileTransitCache", { fileId: key });

    let extraProps = {
        state: doc.document.state,
        fileId: doc.document.fileId,
        fileType: doc.document.fileType,
        fileExtension: doc.document.fileExtension,
        documentId: doc.documentId,
        documentType: doc.documentType,
        faunaDocumentRef: doc.faunaDocumentRef,
        autoSave: false
    }

    const { view, identifiedUser } = await PrepareDoc(ViewInterpreter, headers, deviceId, undefined, extraProps);

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
