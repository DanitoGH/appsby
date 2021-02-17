import {AppsbyGetMultipleDocumentsByFields, AppsbyGetMultipleDocumentsFromSearch} from "../helpers/fauna-functions";
import Base from "./Base";

/** Create an instance of AppsbySearch to perform simple search tasks across your documents. Does full-text search, but only on a single field (as of now). */
export class AppsbySearch extends Base {

    /**
     * The Search component equivalent of useDocument. Specify the type of documents you want to search, any qualifiers you might want to use for the document (like { userId: this.props.userId } to potentially get documents the current user owns), and then the document field that you want to use as the basis for your result.
     * @param {string} documentType - This is the type for the document. If it doesn't exist, it'll be auto-generated.
     * @param {object} documentQualifiers - Any qualifiers you want to use to narrow your search. Optionally pass null or other falsy value
     * @param {string} queryQualifier - The field in the document you want to search via. When a query is submitted via the front-end, this is the field that will be queried.
     */
    async useDocumentSet(documentType, documentQualifiers, queryQualifier) {``
        if (documentType) {
            if (queryQualifier) {
                this.props.documents = await AppsbyGetMultipleDocumentsFromSearch(documentType, documentQualifiers, queryQualifier, this.props.count, this.props.cursor, this.props.cursorGoesBackward)
            } else {
                this.props.documents = await AppsbyGetMultipleDocumentsByFields(documentType, documentQualifiers, this.props.count, this.props.cursor, this.props.cursorGoesBackward)
            }
        }
    }

    /**
     * Render will be called for each one of the documents found via useDocumentSet(). Here, you can change and remove fields that your front-end doesn't need to see - great for removing sensitive info like passwords when doing a search for users.
     * Every time render is being called, each individual document will be available via this.state, so that you can grab the fields that you need. Alternatively, just return this.state here and be done with it.
     * @return {object} - Return an object consisting of all the fields you want to pass to your front-end.
     */
    async render() {
        return {};
    }

}
