import faunadb, { query as q } from 'faunadb';
import { v4 as uuidv4 } from 'uuid';
import {shortUrlDecode, shortUrlEncodeFromRef} from "./ShortURL";
import {
    faunaCreateCollectionIfNotExisting,
    faunaCreateIndexIfNotExisting, faunaCreateSearchIndexIfNotExisting, FaunaDocToAppsbyDoc,
    faunaGenerateIndexName,
    getFaunaTermsFromObject, InternalGetDocByFields, InternalGetDocById
} from "./internal-fauna-crud";


let faunaSecret = process.env.faunaSecret;

export async function AppsbyGetMultipleDocumentsByFields(documentType, fieldsToQualify, count = 100000, cursorId, cursorGoesBackward = false) {
    const client = new faunadb.Client({ secret: faunaSecret });
    let indexName = faunaGenerateIndexName(documentType, fieldsToQualify);

    let paginationOptions = { size: count }

    if (cursorId) {
        if (cursorGoesBackward) {
            paginationOptions.before = [q.Ref(q.Collection(documentType), cursorId)];
        } else {
            paginationOptions.after = [q.Ref(q.Collection(documentType), cursorId)];
        }
    }

    let result;
    try {

        result = await client.query(
            q.Let(
                {
                    ref: q.Match(q.Index(indexName), getFaunaTermsFromObject(fieldsToQualify))
                },
                q.If(
                    q.Exists(q.Var('ref')),
                    {
                        code: 200,
                        data: q.Map(q.Paginate(q.Match(q.Index(indexName), getFaunaTermsFromObject(fieldsToQualify)), paginationOptions), q.Lambda("theVariable", q.Get(q.Var("theVariable"))))
                    },
                    {
                        code: 404,
                        data: null
                    }
                )
            ));

        if (result.code === 200){
            return FaunaDocToAppsbyDoc(result, true);
        } else if (result.code === 404) {
            return null;
        }


    } catch (e) {
        await faunaCreateCollectionIfNotExisting(documentType);
        await faunaCreateIndexIfNotExisting(documentType, fieldsToQualify)

        result = await client.query(
            q.Let(
                {
                    ref: q.Match(q.Index(indexName), getFaunaTermsFromObject(fieldsToQualify))
                },
                q.If(
                    q.Exists(q.Var('ref')),
                    {
                        code: 200,
                        data: q.Map(q.Paginate(q.Match(q.Index(indexName), getFaunaTermsFromObject(fieldsToQualify)), paginationOptions), q.Lambda("theVariable", q.Get(q.Var("theVariable"))))
                    },
                    {
                        code: 404,
                        data: null
                    }
                )
            ));

        if (result.code === 200){
            return FaunaDocToAppsbyDoc(result, true);
        } else if (result.code === 404) {
            return null;
        }

    }
}

export async function AppsbyGetSingleDocumentById(documentType, documentId) {
    return InternalGetDocById(documentType, documentId);
}

export async function AppsbyGetSingleDocumentByFields(documentType, fieldsToQualify) {
    return InternalGetDocByFields(documentType, fieldsToQualify);

}


export async function AppsbyCreateSingleDocument(documentType, data) {
    const client = new faunadb.Client({ secret: faunaSecret });
    //const result = await client.query(q.Create(q.Collection(documentType), { data }));

    let result;

    result = await client.query(

        q.If(
            q.Exists(q.Collection(documentType)),
            {
                code: 200,
                data: q.Create(q.Collection(documentType), { data })
            },
            {
                code: 404,
                data: null
            }
        )
    );

    if (result.code === 200){
        return FaunaDocToAppsbyDoc(result);
    } else if (result.code === 404) {
        await faunaCreateCollectionIfNotExisting(documentType);

        result = await client.query(
            q.If(
                q.Exists(q.Collection(documentType)),
                {
                    code: 200,
                    data: q.Create(q.Collection(documentType), { data })
                },
                {
                    code: 404,
                    data: null
                }
            ));

        if (result.code === 200) {
            return FaunaDocToAppsbyDoc(result);
        } else if (result.code === 404) {
            return null;
        }

        return FaunaDocToAppsbyDoc(result);
    }

}



export async function AppsbyDeleteSingleDocumentByFields(documentType, fieldsToQualify) {
    const client = new faunadb.Client({ secret: faunaSecret });
    let indexName = faunaGenerateIndexName(documentType, fieldsToQualify);

    let result;
    try {

        result = await client.query(
            q.Let(
                {
                    ref: q.Match(q.Index(indexName), getFaunaTermsFromObject(fieldsToQualify))
                },
                q.If(
                    q.Exists(q.Var('ref')),
                    {
                        code: 200,
                        data: q.Delete(q.Select('ref', q.Get(q.Var('ref'))))
                    },
                    {
                        code: 404,
                        data: null
                    }
                )
            ));

        if (result.code === 200){
            return FaunaDocToAppsbyDoc(result);
        } else if (result.code === 404) {
            return null;
        }


    } catch (e) {

        await faunaCreateCollectionIfNotExisting(documentType);
        await faunaCreateIndexIfNotExisting(documentType, fieldsToQualify)

        result = await client.query(
            q.Let(
                {
                    ref: q.Match(q.Index(indexName), getFaunaTermsFromObject(fieldsToQualify))
                },
                q.If(
                    q.Exists(q.Var('ref')),
                    {
                        code: 200,
                        data: q.Delete(q.Select('ref', q.Get(q.Var('ref'))))
                    },
                    {
                        code: 404,
                        data: null
                    }
                )
            ));

        if (result.code === 200){
            return FaunaDocToAppsbyDoc(result);
        } else if (result.code === 404) {
            return null;
        }

    }
}


export async function AppsbyDeleteSingleDocumentById(documentType, documentId) {
    const client = new faunadb.Client({ secret: faunaSecret });

    let result;
    try {

        result = await client.query(
            q.Let(
                {
                    ref: q.Ref(q.Collection(documentType), shortUrlDecode(documentId))
                },
                q.If(
                    q.Exists(q.Var('ref')),
                    {
                        code: 200,
                        data: q.Delete(q.Select('ref', q.Get(q.Var('ref'))))
                    },
                    {
                        code: 404,
                        data: null
                    }
                )
            ));

        if (result.code === 200){
            return FaunaDocToAppsbyDoc(result);
        } else if (result.code === 404) {
            return null;
        }


    } catch (e) {

        await faunaCreateCollectionIfNotExisting(documentType);

        result = await client.query(
            q.Let(
                {
                    ref: q.Ref(q.Collection(documentType), shortUrlDecode(documentId))
                },
                q.If(
                    q.Exists(q.Var('ref')),
                    {
                        code: 200,
                        data: q.Delete(q.Select('ref', q.Get(q.Var('ref'))))
                    },
                    {
                        code: 404,
                        data: null
                    }
                )
            ));

        if (result.code === 200){
            return FaunaDocToAppsbyDoc(result);
        } else if (result.code === 404) {
            return null;
        }

    }
}

export async function AppsbyCheckIfDocumentExists(documentType, documentIdOrQualifiers) {

    const client = new faunadb.Client({ secret: faunaSecret });
    let result;

    if (typeof documentIdOrQualifiers === "string" || typeof documentIdOrQualifiers === "number") {
         result = await client.query(
            q.Let(
                {
                    ref: q.Ref(q.Collection(documentType), shortUrlDecode(documentIdOrQualifiers))
                },
                q.If(
                    q.Exists(q.Var('ref')),
                    {
                        code: 200,
                        data: true
                    },
                    {
                        code: 404,
                        data: false
                    }
                )
            ));

    } else if (typeof documentIdOrQualifiers === "object"){

        let fieldsToQualify = documentIdOrQualifiers;
        var indexName = faunaGenerateIndexName(documentType, fieldsToQualify);

        try {

            result = await client.query(
                q.Let(
                    {
                        ref: q.Match(q.Index(indexName), getFaunaTermsFromObject(fieldsToQualify))
                    },
                    q.If(
                        q.Exists(q.Var('ref')),
                        {
                            code: 200,
                            data: true
                        },
                        {
                            code: 404,
                            data: false
                        }
                    )
                ));


        } catch (e) {

            await faunaCreateCollectionIfNotExisting(documentType);
            await faunaCreateIndexIfNotExisting(documentType, fieldsToQualify);

            result = await client.query(
                q.Let(
                    {
                        ref: q.Match(q.Index(indexName), getFaunaTermsFromObject(fieldsToQualify))
                    },
                    q.If(
                        q.Exists(q.Var('ref')),
                        {
                            code: 200,
                            data: true
                        },
                        {
                            code: 404,
                            data: false
                        }
                    )
                ));

        }

        return result.data;

    } else {
        throw new Error("[500] CheckIfDocumentExists()'s documentIdOrQualifiers must be used with a string or object.")
    }
}

export async function AppsbyCountDocuments(documentType, fieldsToQualify, rangeToReturn) {

    let result;

    let countWithRange = async () => {

        let rangeField = Object.keys(rangeToReturn)[0];
        let rangeStart = rangeToReturn[rangeField][0];
        let rangeEnd = rangeToReturn[rangeField][1];

        result = await client.query(
            q.Let(
                {
                    ref: q.Match(q.Index(indexName), getFaunaTermsFromObject(fieldsToQualify))
                },
                q.If(
                    q.Exists(q.Var('ref')),
                    {
                        code: 200,
                        data: q.Select('data', q.Count(q.Paginate(q.Range(q.Match(q.Index(indexName), getFaunaTermsFromObject(fieldsToQualify)), rangeStart, rangeEnd))))
                    },
                    {
                        code: 404,
                        data: null
                    }
                )
            ));

        if (result.code === 200){
            return result.data;
        } else if (result.code === 404) {
            return 0;
        }
    }

    let countWithoutRange = async () => {
        result = await client.query(
            q.Let(
                {
                    ref: q.Match(q.Index(indexName), getFaunaTermsFromObject(fieldsToQualify))
                },
                q.If(
                    q.Exists(q.Var('ref')),
                    {
                        code: 200,
                        data: q.Select('data', q.Count(q.Paginate(q.Match(q.Index(indexName), getFaunaTermsFromObject(fieldsToQualify)))))
                    },
                    {
                        code: 404,
                        data: null
                    }
                )
            ));

        if (result.code === 200){
            return result.data;
        } else if (result.code === 404) {
            return 0;
        }
    }


    //range to return should look like { rangeField: [start, end] }

    const client = new faunadb.Client({ secret: faunaSecret });
    let indexName = faunaGenerateIndexName(documentType, fieldsToQualify, rangeToReturn);

    try {

        if (rangeToReturn){
            return await countWithRange();
        } else {
            return await countWithoutRange();
        }


    } catch (e) {

        await faunaCreateCollectionIfNotExisting(documentType);
        await faunaCreateIndexIfNotExisting(documentType, fieldsToQualify, rangeToReturn)

        if (rangeToReturn){
            return await countWithRange();
        } else {
            return await countWithoutRange();
        }

    }
}


export async function AppsbyGetMultipleDocumentsFromSearch(documentType, fieldsToQualify, fieldToQuery, count, cursorId, cursorGoesBackward = false) {
    const client = new faunadb.Client({ secret: faunaSecret });
    let indexName = faunaGenerateIndexName(documentType, fieldsToQualify, null, fieldToQuery, true);

    fieldsToQualify.wordParts = fieldToQuery;

    let paginationOptions = { size: count }

    if (cursorId) {
        if (cursorGoesBackward) {
            paginationOptions.before = [q.Ref(q.Collection(documentType), cursorId)];
        } else {
            paginationOptions.after = [q.Ref(q.Collection(documentType), cursorId)];
        }
    }

    this.runQuery = async () => {
        return await client.query(
            q.Let(
                {
                    ref: q.Match(q.Index(indexName), getFaunaTermsFromObject(fieldsToQualify))
                },
                q.If(
                    q.Exists(q.Var('ref')),
                    {
                        code: 200,
                        data: q.Map(q.Paginate(q.Match(q.Index(indexName), getFaunaTermsFromObject(fieldsToQualify)), paginationOptions), q.Lambda("theVariable", q.Get(q.Var("theVariable"))),
                        )
                    },
                    {
                        code: 404,
                        data: null
                    }
                )
            ));
    }

    let result;


    try {

        result = this.runQuery();

        if (result.code === 200){
            return FaunaDocToAppsbyDoc(result, true);
        } else if (result.code === 404) {
            return null;
        }


    } catch (e) {

        await faunaCreateCollectionIfNotExisting(documentType);
        await faunaCreateSearchIndexIfNotExisting(documentType, fieldsToQualify, fieldToQuery, null)

        result = this.runQuery();

        if (result.code === 200){
            return FaunaDocToAppsbyDoc(result, true);
        } else if (result.code === 404) {
            return null;
        }

    }
}
