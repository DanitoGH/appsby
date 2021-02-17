import { query as q } from 'faunadb';
import {CreateClient} from "./CreateClient";

export async function GenerateCollection(documentType) {

    const client = await CreateClient();
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
