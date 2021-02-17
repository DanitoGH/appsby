import {AppsbyCreateSingleDocument} from "../fauna-functions";

export async function createDocument(documentType, data) {
    return await AppsbyCreateSingleDocument(documentType, data);
}
