import {FaunaDocToAppsbyDoc, InternalGetDocByFields, InternalGetDocById} from "../server/helpers/internal-fauna-crud";
import {AppsbyCreateSingleDocument} from "../server/helpers/fauna-functions";
import {SetDocument} from "../server/handlers/handle-document";
import {CreateNewUserJWT} from "../server/handlers/handle-auth";

export default class AppsbyAPI {

    constructor(connectionParameters) {
        this.props = {};
        this.props.connectionParameters = connectionParameters;
        this.state = {};
    }

    async componentDidMount() {}

    async componentShouldAuthorize() {
        return true;
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

    async authenticateThisUserAs(documentId, relatedAuthEndpoint, deviceId, deviceFingerprint) {
        this.props.userHasReauthenticated = true;
        return CreateNewUserJWT(documentId, relatedAuthEndpoint, deviceId, deviceFingerprint)
    }
}
