import {FaunaDocToAppsbyDoc, InternalGetDocByFields, InternalGetDocById} from "../server/helpers/internal-fauna-crud";
import {AppsbyCreateSingleDocument} from "../server/helpers/fauna-functions";
import {SetDocument} from "../server/handlers/handle-document";

export default class AppsbyFiles {

    constructor(connectionParameters) {
        this.props = {};
        this.props.connectionParameters = connectionParameters;
        this.state = {};
    }

    async componentDidMount() {}

    async componentShouldAuthorizeDownload() { return false; }

    async componentShouldAuthorizeUpload() { return false; }

    async componentDidCompleteUpload() { }

    async useUploadBucket(bucketName) {
        this.props.uploadBucket = {};
        if (typeof bucketName === "string") {
            this.props.uploadBucket.name = bucketName;
        } else throw new Error("[500] Bucket name in useUploadBucket must be a string.");
    }

    async useDownloadBucket(bucketName, region, isPublic) {
        this.props.downloadBucket = {};
        if (typeof bucketName === "string") {
            this.props.downloadBucket.name = bucketName;
        } else throw new Error("[500] Bucket name in useDownloadBucket must be a string.");
        if (typeof region === "string") {
            this.props.downloadBucket.region = region;
        } else throw new Error("[500] Region name in useDownloadBucket must be a string.");
        if (typeof isPublic === "boolean") {
            this.props.downloadBucket.isPublic = isPublic;
        } else throw new Error("[500] isPublic name in useDownloadBucket must be a boolean.");
    }

    async useCallback(callbackString) {
        if (typeof callbackString === "string") {
            this.props.callback = callbackString;
        } else throw new Error("[500] Callback must referred to as a string.");
    }

    async setFileType(types) {
        if (typeof types === "string") {
            types = [types];
        }
        this.props.fileTypes = types;
    }

    async useDocument(documentType, documentIdOrQualifiers, shouldAutoSave = false){
        if (documentType && documentIdOrQualifiers){

            let doc;

            if (typeof documentIdOrQualifiers === "string" || typeof documentIdOrQualifiers === "number") {
                doc = await InternalGetDocById(documentType, documentIdOrQualifiers)
            } else if (typeof documentIdOrQualifiers === "object"){
                doc = await InternalGetDocByFields(documentType, documentIdOrQualifiers)
            } else {
                throw new Error("[500] useDocument()'s documentIdOrQualifiers must be used with a string or object.")
            }

            if (doc === null) {
                throw new Error(`[404] Was unable to find ${documentType}`);
            }

            this.state = doc.document;
            this.props.documentId = doc.documentId;
            this.props.documentType = doc.documentType
            this.props.faunaDocumentRef = doc.faunaDocumentRef;
            this.props.autoSave = shouldAutoSave
        }
    }


    async createDocument(documentType, data) {
        return await AppsbyCreateSingleDocument(documentType, data);
    }

    async setState(data) {
        /*if (data) {
            if (typeof data === "object") {
                Object.keys(data).forEach((item) => {
                    this.state[item] = data[item];
                })
            } else {
                throw new Error("[500] If sending data as an argument to setState(), it must be in object form (like React).")
            }
        }*/
        let y = await SetDocument(this.props.faunaDocumentRef, data, this.state);//.then((onFulfilled) => {  });
        let x = { data: y };
        console.log(y.data.ref);
        this.state = FaunaDocToAppsbyDoc(x).document;
    }


    //This is called after the file upload is completed.
    //Do any file validation you need on the original file,
    //then add it to whatever documents you need.
    //If you have different buckets for sanitation and serving,
    //Sanitize your asset here, then use AppsbyMoveFile() to move your asset,
    //and change this.appsby.downloadBucketName.
    //Moving a file to a new bucket will result in the callback being called again,
    //this time with callingBucket representing the new bucket name.
    //You may want to use a switch statement to create multi-step file transformations/validations.
    //The file object is { id, fileName, fileExtension, endpoint, userData, async getBytes(), async setBytes() }.
    /*uploadFileCallback = async (file, callingBucket) => {
        throw new Error("You must implement a file upload callback.");
    }*/

}
