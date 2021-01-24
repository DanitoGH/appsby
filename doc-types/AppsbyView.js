import {InternalGetDocByFields, InternalGetDocById} from "../server/helpers/internal-fauna-crud";
import {AppsbyCreateSingleDocument} from "../server/helpers/fauna-functions";
import {SetDocument} from "../server/handlers/handle-document";
import {FaunaDocToAppsbyDoc} from "../server/helpers/internal-fauna-crud";


export default class AppsbyView {

    constructor(connectionParameters) {
        this.props = {};
        this.props.connectionParameters = connectionParameters;
        this.state = {};
    }

    async componentDidMount() {}

    async componentShouldAuthorize() {
        return true;
    }

    async useDocument(documentType, documentIdOrQualifiers, shouldAutoSave = false) {
        if (documentType && documentIdOrQualifiers){

            let doc;

            if (typeof documentIdOrQualifiers === "string" || typeof documentIdOrQualifiers === "number") {
                doc = await InternalGetDocById(documentType, documentIdOrQualifiers)
            } else if (typeof documentIdOrQualifiers === "object"){
                doc = await InternalGetDocByFields(documentType, documentIdOrQualifiers)
            } else {
                throw new Error("[500] useDocument()'s documentIdOrQualifiers must be used with a string or object.")
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

        let y = await SetDocument(this.props.faunaDocumentRef, data, this.state);//.then((onFulfilled) => {  });
        let x = { data: y };
        console.log(y.data.ref);
        this.state = FaunaDocToAppsbyDoc(x).document;
    }

    async render() {
        return {};
    };
}
