import faunadb from "faunadb";
import {shortUrlDecode, shortUrlEncodeFromRef} from "./ShortURL";

var q = faunadb.query;
var faunaSecret = process.env.faunaSecret

export async function InternalGetDocByFields(documentType, fieldsToQualify) {
    const client = new faunadb.Client({ secret: faunaSecret });


    var result;
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
                        data: q.Get(q.Var('ref'))
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
                        data: q.Get(q.Var('ref'))
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

export async function InternalGetDocById(documentType, id) {
    const client = new faunadb.Client({ secret: faunaSecret });

    var result;

    try {

        result = await client.query(
            q.Let(
                {
                    ref: q.Ref(q.Collection(documentType), shortUrlDecode(id))
                },
                q.If(
                    q.Exists(q.Var('ref')),
                    {
                        code: 200,
                        data: q.Get(q.Var('ref'))
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
                    ref: q.Ref(q.Collection(documentType), shortUrlDecode(id))
                },
                q.If(
                    q.Exists(q.Var('ref')),
                    {
                        code: 200,
                        data: q.Get(q.Var('ref'))
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

export async function InternalDocExistByFields(documentType, fieldsToQualify) {
    const client = new faunadb.Client({ secret: faunaSecret });


    var result;
    var indexName = faunaGenerateIndexName(documentType, fieldsToQualify);


    try {

        result = await client.query(q.Exists(q.Match(q.Index(indexName), getFaunaTermsFromObject(fieldsToQualify))));

        return result;

    } catch (e) {

        await faunaCreateCollectionIfNotExisting(documentType);
        await faunaCreateIndexIfNotExisting(documentType, fieldsToQualify);

        result = await client.query(q.Exists(q.Match(q.Index(indexName), getFaunaTermsFromObject(fieldsToQualify))));

        return result;

    }
}

export async function InternalDocExistById(documentType, id) {
    const client = new faunadb.Client({ secret: faunaSecret });

    var result;

    try {

        result = await client.query(q.Exists(q.Match(q.Ref(q.Collection(documentType), shortUrlDecode(id)))));

        return result;

    } catch (e) {

        await faunaCreateCollectionIfNotExisting(documentType);

        result = await client.query(q.Exists(q.Match(q.Ref(q.Collection(documentType), shortUrlDecode(id)))));

        return result;

    }
}

export async function faunaCreateCollectionIfNotExisting(documentType) {

    const client = new faunadb.Client({ secret: faunaSecret });
    var collectionExists = await client.query(
        q.Exists(q.Collection(documentType))
    );
    if (collectionExists === false) {
        await client.query(
            q.CreateCollection({
                name: documentType
            })
        )
    }
}

export function faunaGenerateIndexName(documentType, fieldsToQualify, valuesToReturn, fieldsToQuery, isSearchIndex = false) {
    let indexName = documentType;
    if (fieldsToQualify) {
        Object.keys(fieldsToQualify).forEach((key) => indexName += key);
    }
    if (fieldsToQuery) {
        indexName += "Queries";
        Object.keys(fieldsToQuery).forEach((key) => indexName += key);
    }
    if (valuesToReturn) {
        indexName += "Returns";
        Object.keys(valuesToReturn).forEach((key) => indexName += key);
    }
    if (isSearchIndex) {
        indexName += "AsSearch";
    }

    indexName += "Index";

    return indexName;
}

export async function faunaCreateIndexIfNotExisting(documentType, fieldsToQualify = null, valuesToReturn = null) {

    const client = new faunadb.Client({ secret: faunaSecret });
    const indexName = faunaGenerateIndexName(documentType, fieldsToQualify, valuesToReturn);

    const indexExists = await client.query(
        q.Exists(q.Index(indexName))
    );
    var theFields = [];
    var theValues = [];

    if (fieldsToQualify) {
        Object.keys(fieldsToQualify).forEach((key) => {
            theFields.push({
                field: ["data", key]
            });
        })
    }

    if (valuesToReturn) {
        Object.keys(valuesToReturn).forEach((key) => {
            theValues.push({
                field: ["data", key]
            });
        })
    }

    console.log(theFields);

    if (indexExists === false) {
        await client.query(
            q.CreateIndex({
                name: indexName,
                source: q.Collection(documentType),
                terms: theFields,
                values: theValues,
                unique: false,
                serialized: true
            })
        )
    }
}

export async function faunaCreateSearchIndexIfNotExisting(documentType, fieldsToQualify, fieldToQuery, valuesToReturn) {

    const client = new faunadb.Client({ secret: faunaSecret });

    if (fieldToQuery.length > 1 || fieldToQuery.length < 1 ) { throw new Error ("[500] Can't create index without single field querier") }

    const indexName = faunaGenerateIndexName(documentType, fieldsToQualify, null, fieldToQuery,true);

    const indexExists = await client.query(
        q.Exists(q.Index(indexName))
    );

    var theFields = [];
    var theValues = [];

    if (fieldsToQualify) {
        Object.keys(fieldsToQualify).forEach((key) => {
            theFields.push({
                field: ["data", key]
            });
        })
    }

    if (valuesToReturn) {
        Object.keys(valuesToReturn).forEach((key) => {
            theValues.push({
                field: ["data", key]
            });
        })
    }

    theFields.push({binding: 'wordParts'});

    if (indexExists === false) {
        await client.query(
            q.CreateIndex({
                name: indexName,
                source: [
                    {
                        collection: [q.Collection(documentType)],
                        fields: {
                            wordParts: q.Query(
                                q.Lambda('searchableVar',
                                    q.Distinct(
                                        q.Union(
                                            q.Let(
                                                {
                                                    ngrams: q.Map(
                                                        // ngrams
                                                        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
                                                        q.Lambda('i', q.NGram(
                                                            q.LowerCase(q.Select(['data', fieldToQuery], q.Var('searchableVar'))),
                                                            q.Var('i'),
                                                            q.Var('i'),
                                                            )
                                                        )
                                                    )
                                                },
                                                q.Var('ngrams')
                                            )
                                        )
                                    )
                                )
                            )
                        }
                    }
                ],
                terms: theFields,
                values: theValues,
                unique: false,
                serialized: true
            })
        )
    }
}

export function getFaunaTermsFromObject(fieldsToQualify) {
    var sortTermsNicelyForCrankyFauna;

    if (Object.keys(fieldsToQualify).length === 1) {
        Object.keys(fieldsToQualify).forEach((field) => {
            sortTermsNicelyForCrankyFauna = fieldsToQualify[field];
        })

    } else {
        sortTermsNicelyForCrankyFauna = [];
        Object.keys(fieldsToQualify).forEach((field) => {
            var fieldItem = fieldsToQualify[field];
            sortTermsNicelyForCrankyFauna.push(fieldItem)
        })
    }

    return sortTermsNicelyForCrankyFauna;
}

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

