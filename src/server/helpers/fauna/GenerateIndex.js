import { query as q } from 'faunadb';
import {CreateClient} from "./CreateClient";

export function GenerateIndexName(documentTypes, fieldsToQualify, valuesToReturn, fieldsToQuery, isSearchIndex = false) {
    let indexName = "";

    if (Array.isArray(documentTypes) && isSearchIndex) {
        documentTypes.forEach((type) => {
            indexName += type.documentType + "Querying";
            type.queryableFields.forEach((queryable) => {
                indexName += queryable;
            })
        });
    } else if (Array.isArray(documentTypes) && !isSearchIndex) {
        documentTypes.forEach((type) => indexName += type);
    } else {
        indexName += documentTypes;
    }

    if (fieldsToQualify) {
        indexName += "QualifiedBy";
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

export async function GenerateIndex(documentType, fieldsToQualify = null, valuesToReturn = null) {

    const client = await CreateClient();
    const indexName = GenerateIndexName(documentType, fieldsToQualify, valuesToReturn);

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

//documentTypesAndTheirQueryableFields Syntax: [{documentType: "documentType", queryableFields: ["field1", "field2", "field3"]}, {documentType: "documentType", queryableFields: ["field1", "field2", "field3"]}]
export async function GenerateSearchIndex(documentTypesAndTheirQueryableFields, fieldsToQualify, valuesToReturn) {

    //Lifted from FaunaDB Fwitter - Thanks!
    function WordPartGenerator(WordVar) {
        return q.Let(
            {
                indexes: q.Map(
                    // Reduce this array if you want less ngrams per word.
                    // Setting it to [ 0 ] would only create the word itself, Setting it to [0, 1] would result in the word itself
                    // and all ngrams that are one character shorter, etc..
                    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
                    q.Lambda('index', q.Subtract(q.Length(WordVar), q.Var('index')))
                ),
                indexesFiltered: q.Filter(
                    q.Var('indexes'),
                    // filter out the ones below 0
                    q.Lambda('l', q.GT(q.Var('l'), 0))
                ),
                ngramsArray: q.Map(q.Var('indexesFiltered'), q.Lambda('l', q.NGram(q.LowerCase(WordVar), q.Var('l'), q.Var('l'))))
            },
            q.Var('ngramsArray')
        )
    }

    function CreateSource(documentTypeWithQueryableFields) {
        let source = {};
        source.collection = q.Collection(documentTypeWithQueryableFields.documentType);
        source.fields = {};
        source.fields.length = q.Query(q.Lambda('user', q.Length(q.Select(['data', 'name'], q.Var('user')))));

        if (documentTypeWithQueryableFields.queryableFields.length > 1) {
            source.fields.wordparts = q.Query(q.Lambda('hashtag', q.Union(WordPartGenerator(q.Select(['data', 'name'], q.Var('hashtag'))))));
        } else {


            source.fields.wordparts = q.Query(q.Lambda('hashtag',
                q.Union(
                    q.Union(WordPartGenerator(q.Select(['data', 'name'], q.Var('user')))),
                    q.Union(WordPartGenerator(q.Select(['data', 'alias'], q.Var('user'))))
                )
            ));
        }
    }

    const client = await CreateClient();

    if (fieldToQuery.length > 1 || fieldToQuery.length < 1 ) { throw new Error ("[500] Can't create index without single field querier") }

    const indexName = GenerateIndexName(documentTypesAndTheirQueryableFields, fieldsToQualify, null, null,true);

    const indexExists = await client.query(
        q.Exists(q.Index(indexName))
    );

    const theFields = [];
    const theValues = [];
    const sources = [];

    if (Array.isArray(documentTypesAndTheirQueryableFields)) {
        documentTypesAndTheirQueryableFields.forEach((type) => {
            sources.push(CreateSource(type));
        })
    } else {
        sources.push(CreateSource(documentTypesAndTheirQueryableFields));
    }

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
                source: sources,
                terms: [
                    {
                        binding: 'wordparts'
                    }
                ],
                values: [
                    {
                        binding: 'length'
                    },
                    { field: ['ref'] }
                ],
                unique: false,
                serialized: false
            })
        )
    }
}




function StringSplit(string, delimiter) {
    return q.If(
        q.Not(q.IsString(string)),
        q.Abort("SplitString only accept strings"),
        q.Map(
            q.FindStrRegex(string, q.Concat(["[^\\", delimiter, "]+"])),
            q.Lambda("res", q.Select(["data"], q.Var("res")))
        )
    )
}

function GetKeywords() {
    return q.Map(
        q.Distinct(StringSplit(q.ReplaceStrRegex(q.LowerCase(q.Select(['data', "city"], q.Var('searchableVar'))), "[^a-zA-Z0-9 ]", ""), " ")), // get all unique words in document as array
        q.Lambda("bestKeywords", q.Count(StringSplit(q.ReplaceStrRegex(q.LowerCase(q.Select(['data', "city"], q.Var('bestKeywords'))), "[^a-zA-Z0-9 ]", ""), " ")
        ))
    )
}

q.CreateIndex({
    name: "citiesIndex4",
    source: [
        {
            collection: [q.Collection("cities")],
            fields: {
                wordParts: q.Query(
                    q.Lambda('searchableVar',
                        q.Distinct(
                                q.Let(
                                    {
                                        wordsInString: q.Map(
                                            q.Distinct(

                                                q.Map(
                                                    q.FindStrRegex(q.ReplaceStrRegex(q.LowerCase(q.Select(['data', "city"], q.Var('searchableVar'))), "[^a-zA-Z0-9 ]", ""), q.Concat(["[^\\", " ", "]+"])),
                                                    q.Lambda("res", q.Select(["data"], q.Var("res")))
                                                )

                                            ), // get all unique words in document as array
                                            q.Lambda("bestKeywords", q.Count(
                                                q.Map(
                                                q.FindStrRegex(q.ReplaceStrRegex(q.LowerCase(q.Select(['data', "city"], q.Var('searchableVar'))), "[^a-zA-Z0-9 ]", ""), q.Concat(["[^\\", " ", "]+"])),
                                                q.Lambda("res", q.Select(["data"], q.Var("res"))))
                                            ))
                                        ),
                                    },
                                    q.Var('wordsInString')
                                )
                        )
                    )
                )
            }
        }
    ],
    terms: [{field: ["data", "city"]}, {binding: ["wordParts"]}],
    values: [{field: ["data", "city"]}, {field: ["ref"]}],
    unique: false,
    serialized: false
})



//first try exact match (ContainsStr)
//then try fuzzy keyword match (GetKeywords)
function ExactMatchLambda() {
    return q.Lambda(
        ['city', 'item'],
        q.ContainsStr(
            q.LowerCase(q.ReplaceStrRegex(q.Var("city"), "[^a-zA-Z0-9]", "")),
            q.LowerCase(q.ReplaceStrRegex("I*FOUND,&&THAT", "[^a-zA-Z0-9]", ""))
        ));
}

function KeywordLambda() {
    return
}
