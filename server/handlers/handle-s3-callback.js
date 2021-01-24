
import {
    AppsbyDeleteSingleDocumentByFields,
    AppsbyGetSingleDocumentByFields,
    AppsbyGetSingleDocumentById
} from "../helpers/fauna-functions";


async function ProcessS3(ViewInterpreter, key, appsbyuserid, appsbyusertype, fileName, fileExtension, fileMIME, callback) {

    let doc = await AppsbyGetSingleDocumentByFields("appsbyFileTransitCache", { fileId: key });

    const view = await new ViewInterpreter(doc.document.connectionParameters);
    view.props.connectionParameters = doc.document.connectionParameters;
    view.state = doc.document.state;
    view.props.fileId = doc.document.fileId;
    view.props.documentId = doc.documentId;
    view.props.documentType = doc.documentType
    view.props.faunaDocumentRef = doc.faunaDocumentRef;
    view.props.autoSave = false

    const identifiedUser = await AppsbyGetSingleDocumentById(appsbyusertype, appsbyuserid)
    view.props.user = identifiedUser.document;
    view.props.userId = identifiedUser.documentId;

    await view.componentDidMount();

    await view[callback]();
}


export async function S3Callback(event) {

    let records = event.Records;

    records.forEach((record) => {

        if (!record.s3){
            throw new Error("[500] Not an S3 Invocation!");
        }

        let key = record.s3.object.key;
        let userId = record.s3.object.appsbyuserid;
        let userType = record.s3.object.appsbyusertype;
        let fileName = record.s3.object.appsbyfilename;
        let fileExtension = record.s3.object.appsbyfileextension;
        let fileMIME = record.s3.object.appsbyfilemime;
        let endpoint = record.s3.object.appsbyendpoint;
        let callback = record.s3.object.appsbycallback;

        if (!userId || !userType || !fileName || !fileExtension || !fileMIME || !endpoint || !callback) {
            return AppsbyDeleteSingleDocumentByFields("appsbyFileTransitCache", { fileId: key });
        }

        let relatedEndpoint = global.appsbyFiles.find(x => x.endpoint === endpoint);

        if (relatedEndpoint){
            return ProcessS3(relatedEndpoint.handler, key, userId, userType, fileName, fileExtension, fileMIME, callback)
        } else {
            throw new Error('[404] No matching view.');
        }
    });
}
