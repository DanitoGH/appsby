import { query as q } from 'faunadb';
import {CreateClient} from "./CreateClient";

import {shortUrlDecode} from "../ShortURL";
import {GenerateIndex, GenerateIndexName, GenerateSearchIndex} from "./GenerateIndex";
import {GetTerms} from "./GetTerms";
import {GenerateCollection} from "./GenerateCollection";

// exports { code, data }

export async function GenericQuery(documentType, fieldsToQualifyOrID, successDataProcedure, usesSearchIndexingWithTerms = false) {

    let client = await CreateClient();
    let refQuery;

    if (fieldsToQualifyOrID && typeof fieldsToQualifyOrID === "object") {
        let indexName = GenerateIndexName(documentType, fieldsToQualifyOrID);
        refQuery = q.Match(q.Index(indexName), GetTerms(fieldsToQualifyOrID))
    } else if (fieldsToQualifyOrID && typeof fieldsToQualifyOrID === "string") {
        refQuery = q.Ref(q.Collection(documentType), fieldsToQualifyOrID)
    } else  {
        refQuery = null;
    }

    function WrapLetQuery(then, _else){
        if (refQuery === null) {
            // This currently only gets called for AppsbyCreateSingleDocument, but may be used further in future.
            return successDataProcedure;
        } else {
            return q.Let({ref: refQuery}, q.If(q.Exists(q.Var('ref')), then, _else));
        }
    }

    async function RunQuery() {
        return client.query(WrapLetQuery({code: 200, data: successDataProcedure}, {code: 404, data: null}));
    }

    try {

        let x = await RunQuery();
        return x;

    } catch (e) {

        console.log("we caught something")
        console.log(e);

        await GenerateCollection(documentType);
        if (usesSearchIndexingWithTerms) {
            await GenerateSearchIndex(documentType, fieldsToQualifyOrID, usesSearchIndexingWithTerms, null)
        }
        else {
            await GenerateIndex(documentType, fieldsToQualifyOrID)
        }

        let x = await RunQuery();
        return x;

    }
}
