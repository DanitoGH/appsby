import {AppsbyGetSingleDocument} from "../fauna-functions";

export async function useDocument(_this, documentType, documentIdOrQualifiers, shouldAutoSave = false){
    if (documentType && documentIdOrQualifiers){

        let doc = await AppsbyGetSingleDocument(documentType, documentIdOrQualifiers);

        if (doc === null) {
            throw new Error(`[404] Was unable to find ${documentType}`);
        }

        _this.state = doc.document;
        _this.props.documentId = doc.documentId;
        _this.props.documentType = doc.documentType
        _this.props.faunaDocumentRef = doc.faunaDocumentRef;
        _this.props.autoSave = shouldAutoSave
    }
}
