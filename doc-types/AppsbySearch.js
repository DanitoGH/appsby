import {
    AppsbyGetMultipleDocumentsByFields,
    AppsbyGetMultipleDocumentsFromSearch
} from "../server/helpers/fauna-functions";

export default class AppsbySearch {

    constructor(query, token, count, category, cursor, connectionParameters) {
        this.props = { query: query, count: count, category: category, cursor: cursor };
        this.props.connectionParameters = connectionParameters;
        this.state = {};
        this.documents = [];
    }

    async componentDidMount() {}

    async componentShouldAuthorize() { return true; }

    async useDocumentSet(documentType, documentQualifiers, queryQualifier) {
        if (documentType) {
            if (queryQualifier) {
                this.documents = await AppsbyGetMultipleDocumentsFromSearch(documentType, documentQualifiers, queryQualifier, this.props.count, this.props.cursor, this.props.cursorGoesBackward)
            } else {
                this.documents = await AppsbyGetMultipleDocumentsByFields(documentType, documentQualifiers, this.props.count, this.props.cursor, this.props.cursorGoesBackward)
            }
        }
    }

    render() {
        throw new Error(`render has not yet been implemented in this component. All search components must include a render mapping.`)
    }

}
