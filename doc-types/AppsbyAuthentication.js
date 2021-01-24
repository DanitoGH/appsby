import {InternalGetDocByFields, InternalGetDocById} from "../server/helpers/internal-fauna-crud";
import {SetDocument} from "../server/handlers/handle-document";

export default class AppsbyAuthentication {

    constructor(connectionParameters) {
        this.props = {};
        this.props.connectionParameters = connectionParameters;
        this.state = {};
    }

    async componentDidMount() {}

    async login() { throw new Error(`login() has not yet been implemented in this component. This component has no functionality until it is implemented.`) }

    async useDocument(documentType, documentIdOrQualifiers, shouldAutoSave = false){

        let doc;

        if (this.injectedIDForUseDocumentOnAuth) {
            doc = await InternalGetDocById(documentType, this.injectedIDForUseDocumentOnAuth);
        } else {

            if (documentType && documentIdOrQualifiers) {
                if (typeof documentIdOrQualifiers === "string" || typeof documentIdOrQualifiers === "number") {
                    doc = await InternalGetDocById(documentType, documentIdOrQualifiers)
                } else if (typeof documentIdOrQualifiers === "object") {
                    doc = await InternalGetDocByFields(documentType, documentIdOrQualifiers)
                } else {
                    throw new Error("[500] useDocument()'s documentIdOrQualifiers must be used with a string or object.")
                }
            }
        }

        if (doc) {

            this.state = doc.document;
            this.props.documentId = doc.documentId;
            this.props.userId = doc.documentId;
            this.props.user = doc.document;
            this.props.documentType = doc.documentType
            this.props.faunaDocumentRef = doc.faunaDocumentRef;
            this.props.autoSave = shouldAutoSave;
        } else {
            throw new Error("[401] Login failed. Check if you've used the right email address.")
        }
    }

    /*async setState(data) {
        if (data) {
            if (typeof data === "object") {
                Object.keys(data).forEach((item) => {
                    this.state[item] = data[item];
                })
            } else {
                throw new Error("[500] If sending data as an argument to setState(), it must be in object form (like React).")
            }
        }

        SetDocument(this.props.faunaDocumentRef, this.state).then((onFulfilled) => {  });

    }*/

}
