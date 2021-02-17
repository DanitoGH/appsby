import {shortUrlEncodeFromRef} from "../ShortURL";

export function FaunaDocToAppsbyDoc(faunaReturn, processesMultiple = false) {

    if (faunaReturn !== null) {


        if (processesMultiple){
            var returnedDocuments = [];

            faunaReturn.data.data.forEach((item) => {
                var doc = {};
                doc.document = item.data;
                doc.faunaDocumentRef = item.ref;
                doc.documentId = shortUrlEncodeFromRef(item.ref);
                doc.documentType = item.ref.value.collection.value.id
                returnedDocuments.push(doc);
            })
            let returnable = { documents: returnedDocuments };

            if (faunaReturn.data.before) {
                returnable.before = shortUrlEncodeFromRef(faunaReturn.data.before[0])
            }
            if (faunaReturn.data.after) {
                returnable.after = shortUrlEncodeFromRef(faunaReturn.data.after[0])
            }
            return returnable;
        } else {
            var doc = {};
            doc.document = faunaReturn.data.data;
            doc.faunaDocumentRef = faunaReturn.data.ref;
            doc.documentId = shortUrlEncodeFromRef(faunaReturn.data.ref);
            doc.documentType = faunaReturn.data.ref.value.collection.value.id
            return doc;
        }

    } else return null;
}
