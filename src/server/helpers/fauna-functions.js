import { query as q } from 'faunadb';
import {GenericQuery} from "./fauna/GenericQuery";
import {GenerateIndexName} from "./fauna/GenerateIndex";
import {GetTerms} from "./fauna/GetTerms";
import {FaunaDocToAppsbyDoc} from "./fauna/FaunaDocToAppsbyDoc";



export async function AppsbyGetMultipleDocumentsByFields(documentType, fieldsToQualify, count = 100000, cursorId, cursorGoesBackward = false) {

    let indexName = GenerateIndexName(documentType, fieldsToQualify);
    let paginationOptions = { size: count }

    if (cursorId) {
        if (cursorGoesBackward) {
            paginationOptions.before = [q.Ref(q.Collection(documentType), cursorId)];
        } else {
            paginationOptions.after = [q.Ref(q.Collection(documentType), cursorId)];
        }
    }

    let successDataProcedure = q.Map(q.Paginate(q.Match(q.Index(indexName), GetTerms(fieldsToQualify)), paginationOptions), q.Lambda("theVariable", q.Get(q.Var("theVariable"))))
    let result = await GenericQuery(documentType, fieldsToQualify, successDataProcedure);

    if (result.code === 200){
        return FaunaDocToAppsbyDoc(result, true);
    } else if (result.code === 404) {
        return null;
    }
}

export async function AppsbyGetSingleDocument(documentType, fieldsToQualifyOrId) {
    let successDataProcedure = q.Get(q.Var('ref'));
    let result = await GenericQuery(documentType, fieldsToQualifyOrId, successDataProcedure);

    if (result.code === 200){
        return FaunaDocToAppsbyDoc(result);
    } else if (result.code === 404) {
        return null;
    }
}


export async function AppsbyCreateSingleDocument(documentType, data) {
    let successDataProcedure = q.Create(q.Collection(documentType), { data });
    let result = await GenericQuery(documentType, null, successDataProcedure);

    let _result = {
        code: 200,
        data: result
    }

    return FaunaDocToAppsbyDoc(_result);
}


export async function AppsbyDeleteSingleDocument(documentType, fieldsToQualifyOrId) {

    let successDataProcedure = q.Delete(q.Select('ref', q.Get(q.Var('ref'))))
    let result = await GenericQuery(documentType, fieldsToQualifyOrId, successDataProcedure);

    if (result.code === 200){
        return FaunaDocToAppsbyDoc(result);
    } else if (result.code === 404) {
        return null;
    }
}

export async function AppsbyCheckIfDocumentExists(documentType, fieldsToQualifyOrId) {

    let successDataProcedure = true;
    let result = await GenericQuery(documentType, fieldsToQualifyOrId, successDataProcedure);

    if (result.code === 200){
        return result.data
    } else if (result.code === 404) {
        return false;
    }
}

export async function AppsbyCountDocuments(documentType, fieldsToQualify, rangeToReturn) {

    let result;
    let indexName = GenerateIndexName(documentType, fieldsToQualify);

    let countWithRange = async () => {

        let rangeField = Object.keys(rangeToReturn)[0];
        let rangeStart = rangeToReturn[rangeField][0];
        let rangeEnd = rangeToReturn[rangeField][1];

        let successDataProcedure;
        if (fieldsToQualify) {
            successDataProcedure = q.Select('data', q.Count(q.Paginate(q.Range(q.Match(q.Index(indexName), GetTerms(fieldsToQualify)), rangeStart, rangeEnd))));
        } else {
            successDataProcedure = q.Select('data', q.Count(q.Paginate(q.Range(q.Match(q.Index(indexName)), rangeStart, rangeEnd))));
        }
        result = await GenericQuery(documentType, fieldsToQualify, successDataProcedure);

        if (result.code === 200){
            return result.data[0];
        } else if (result.code === 404) {
            return 0;
        }
    }

    let countWithoutRange = async () => {

        let successDataProcedure;
        if (fieldsToQualify) {
            successDataProcedure = q.Select('data', q.Count(q.Paginate(q.Match(q.Index(indexName), GetTerms(fieldsToQualify)))));
        } else {
            successDataProcedure = q.Select('data', q.Count(q.Paginate(q.Match(q.Index(indexName)))));
        }

        result = await GenericQuery(documentType, fieldsToQualify, successDataProcedure);

        if (result.code === 200){
            return result.data[0];
        } else if (result.code === 404) {
            return 0;
        }
    }

    if (rangeToReturn){
        return countWithRange();
    } else {
        return countWithoutRange();
    }
}


export async function AppsbyGetMultipleDocumentsFromSearch(documentType, fieldsToQualify, fieldToQuery, count, cursorId, cursorGoesBackward = false) {

    let indexName = GenerateIndexName(documentType, fieldsToQualify, null, fieldToQuery, true);
    fieldsToQualify.wordParts = fieldToQuery;

    let paginationOptions = { size: count }

    if (cursorId) {
        if (cursorGoesBackward) {
            paginationOptions.before = [q.Ref(q.Collection(documentType), cursorId)];
        } else {
            paginationOptions.after = [q.Ref(q.Collection(documentType), cursorId)];
        }
    }

    let successDataProcedure = q.Map(q.Paginate(q.Match(q.Index(indexName), GetTerms(fieldsToQualify)), paginationOptions), q.Lambda("theVariable", q.Get(q.Var("theVariable"))));
    let result = await GenericQuery(documentType, fieldsToQualify, successDataProcedure, fieldToQuery);

    if (result.code === 200){
        return FaunaDocToAppsbyDoc(result, true);
    } else if (result.code === 404) {
        return null;
    }
}
