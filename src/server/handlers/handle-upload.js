import {v4 as uuidv4} from "uuid";
import {GenerateUploadKey} from "../helpers/amazon";
import {createReturnObject} from "../helpers/createReturnObject";
import {AppsbyCreateSingleDocument} from "../helpers/fauna-functions";
import {PrepareDoc} from "../helpers/doc-type-generics/PrepareDoc";

async function ProcessUpload(ViewInterpreter, headers, deviceId, connectionParameters, fileName, magicBytes100Sample, endpoint) {

    let newUuid = uuidv4();

    let extraProps = {
        fileId: newUuid,
        documentId: null,
        documentType: "appsbyFileTransitCache",
        faunaDocumentRef: null,
        autoSave: false
    }

    const { view, identifiedUser } = await PrepareDoc(ViewInterpreter, headers, deviceId, connectionParameters, extraProps)

    if (identifiedUser && await view.componentShouldAuthorize()) {

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
