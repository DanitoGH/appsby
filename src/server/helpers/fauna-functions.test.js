/*import {AppsbyGetMultipleDocumentsByFields} from "./fauna-functions";
import {AppsbyCreateSingleDocument} from "./fauna-functions";
import {AppsbyDeleteSingleDocument} from "./fauna-functions";
import {AppsbyCheckIfDocumentExists} from "./fauna-functions";
import {AppsbyCountDocuments} from "./fauna-functions";
import {AppsbyGetMultipleDocumentsFromSearch} from "./fauna-functions";
import { v4 as uuidv4 } from 'uuid';

test('Create, Check if document exists, Delete, Check if document exists, By ID', async () => {

    let result = await AppsbyCreateSingleDocument("testDocumentType", { foo: "bar" })

    let expectedResult = {
        document: { foo: 'bar' },
        documentType: 'testDocumentType'
    }

    expect(result.document).toBe(expectedResult.document)
    expect(result.documentType).toBe(expectedResult.documentType);
    expect(result.documentId).toBeDefined();
    expect(result.faunaDocumentRef).toBeDefined();

    let ifDocumentExists1 = await AppsbyCheckIfDocumentExists("testDocumentType", result.documentId);
    expect(ifDocumentExists1).toBe(true);

    let deleteResult = await AppsbyDeleteSingleDocument("testDocumentType", result.documentId);
    expect(deleteResult).toBe(result);

    let ifDocumentExists2 = await AppsbyCheckIfDocumentExists("testDocumentType", result.documentId);
    expect(ifDocumentExists2).toBe(false);

})

test('Test new document type scaffolding and count function', async () => {

    let i;
    let newDocumentType = uuidv4();

    let randomCount = Math.floor(Math.random() * 10) + 1;

    for (i = 0; i > randomCount; i++) {
        await AppsbyCreateSingleDocument(newDocumentType, { foo: "bar" })
    }

    for (i = 0; i > randomCount; i++) {
        await AppsbyCreateSingleDocument(newDocumentType, { foo: "bar2" })
    }

    let countDocuments1 = await AppsbyCountDocuments(newDocumentType);
    expect(countDocuments1).toBe(randomCount * 2);

    let countDocuments2 = await AppsbyCountDocuments(newDocumentType, { foo: "bar" });
    expect(countDocuments2).toBe(randomCount);

    let countDocuments3 = await AppsbyCountDocuments(newDocumentType, { foo: "bar2" });
    expect(countDocuments3).toBe(randomCount);

})



test('AppsbyGetMultipleDocumentsByFields', async () => {

    let doc1 = await AppsbyCreateSingleDocument("AppsbyGetMultipleDocumentsByFieldsTest", { documentNumber: 1, searchableItem: "foo", searchableItem2: "bar"})
    let doc2 = await AppsbyCreateSingleDocument("AppsbyGetMultipleDocumentsByFieldsTest", { documentNumber: 2, searchableItem: "foo", searchableItem2: "bar"})
    let doc3 = await AppsbyCreateSingleDocument("AppsbyGetMultipleDocumentsByFieldsTest", { documentNumber: 3, searchableItem: "foo"})
    let doc4 = await AppsbyCreateSingleDocument("AppsbyGetMultipleDocumentsByFieldsTest", { documentNumber: 4, searchableItem: "foo"})

    let singleFieldResult = await AppsbyGetMultipleDocumentsByFields("AppsbyGetMultipleDocumentsByFieldsTest", { searchableItem: "foo" })
    let multipleFieldResult = await AppsbyGetMultipleDocumentsByFields("AppsbyGetMultipleDocumentsByFieldsTest", { searchableItem: "foo", searchableItem2: "bar" })

    expect(singleFieldResult.length).toBe(4);
    expect(multipleFieldResult.length).toBe(2);

    expect(singleFieldResult.find(x => x.documentNumber === 1)).toBe(doc1.document);
    expect(singleFieldResult.find(x => x.documentNumber === 2)).toBe(doc2.document);
    expect(singleFieldResult.find(x => x.documentNumber === 3)).toBe(doc3.document);
    expect(singleFieldResult.find(x => x.documentNumber === 4)).toBe(doc4.document);

    expect(multipleFieldResult.find(x => x.documentNumber === 1)).toBe(doc1.document);
    expect(multipleFieldResult.find(x => x.documentNumber === 2)).toBe(doc2.document);

})

test('AppsbyGetMultipleDocumentsFromSearch', async () => {

    let doc1 = await AppsbyCreateSingleDocument("AppsbyGetMultipleDocumentsFromSearch", { documentNumber: 1, qualifyingField: "no", searchableItem: "foo", searchableItem2: "bar"})
    let doc2 = await AppsbyCreateSingleDocument("AppsbyGetMultipleDocumentsFromSearch", { documentNumber: 2, qualifyingField: "no", searchableItem: "foo", searchableItem2: "bar"})
    let doc3 = await AppsbyCreateSingleDocument("AppsbyGetMultipleDocumentsFromSearch", { documentNumber: 3, qualifyingField: "yes", searchableItem: "foo"})
    let doc4 = await AppsbyCreateSingleDocument("AppsbyGetMultipleDocumentsFromSearch", { documentNumber: 4, qualifyingField: "yes", searchableItem: "foo"})
    let doc5 = await AppsbyCreateSingleDocument("AppsbyGetMultipleDocumentsFromSearch", { documentNumber: 5, qualifyingField: "yes", searchableItem: "foo"})
    let doc6 = await AppsbyCreateSingleDocument("AppsbyGetMultipleDocumentsFromSearch", { documentNumber: 6, qualifyingField: "yes", searchableItem: "foo"})

    let singleFieldResult = await AppsbyGetMultipleDocumentsFromSearch("AppsbyGetMultipleDocumentsFromSearch", { searchableItem: "yes" }, "searchableItem": )
    let multipleFieldResult = await AppsbyGetMultipleDocumentsFromSearch("AppsbyGetMultipleDocumentsFromSearch", { searchableItem: "foo", searchableItem2: "bar" })

    expect(singleFieldResult.length).toBe(4);
    expect(multipleFieldResult.length).toBe(2);

    expect(singleFieldResult.find(x => x.documentNumber === 1)).toBe(doc1.document);
    expect(singleFieldResult.find(x => x.documentNumber === 2)).toBe(doc2.document);
    expect(singleFieldResult.find(x => x.documentNumber === 3)).toBe(doc3.document);
    expect(singleFieldResult.find(x => x.documentNumber === 4)).toBe(doc4.document);

    expect(multipleFieldResult.find(x => x.documentNumber === 1)).toBe(doc1.document);
    expect(multipleFieldResult.find(x => x.documentNumber === 2)).toBe(doc2.document);

})

export async function AppsbyGetMultipleDocumentsByFields(documentType, fieldsToQualify, count = 100000, cursorId, cursorGoesBackward = false) {
    export async function AppsbyGetSingleDocument(documentType, fieldsToQualifyOrId) {
        export async function AppsbyCreateSingleDocument(documentType, data) {
            export async function AppsbyDeleteSingleDocument(documentType, fieldsToQualify) {
                export async function AppsbyCheckIfDocumentExists(documentType, fieldsToQualifyOrId) {
                    export async function AppsbyCountDocuments(documentType, fieldsToQualify, rangeToReturn) {
                        export async function AppsbyGetMultipleDocumentsFromSearch(documentType, fieldsToQualify, fieldToQuery, count, cursorId, cursorGoesBackward = false) {*/
