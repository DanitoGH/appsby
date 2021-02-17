import {createReturnObject} from "../helpers/createReturnObject";
import {PrepareDoc} from "../helpers/doc-type-generics/PrepareDoc";

async function ProcessSearch(ViewInterpreter, query, headers, count, cursor, cursorGoesBackward, connectionParameters, deviceId) {

  let extraProps = {
    query,
    count,
    cursor,
    cursorGoesBackward,
    documents: []
  }

  const { view, identifiedUser } = await PrepareDoc(ViewInterpreter, headers, deviceId, connectionParameters, extraProps);

  if (identifiedUser && await view.componentShouldAuthorize()) {

    return createReturnObject(identifiedUser, await retrieveSearch(view));

  } else if (identifiedUser) {
    //user was identified but didn't have access
    return createReturnObject(identifiedUser, {});
  } else {
    throw new Error("[401] Unauthorized");
  }
}

async function retrieveSearch(searchModule) {

  let documents = [];
  const items = searchModule.props.documents.documents;

  if (items === null) { return { documents: [] }; }

  items.forEach((doc) => {
    searchModule.state = doc.document;
    searchModule.documentId = doc.documentId;
    searchModule.documentType = doc.documentType
    searchModule.faunaDocumentRef = doc.faunaDocumentRef;

    const t = searchModule.render();
    t.id = doc.documentId;
    //t.ShowAllToken = "SHOW_ALL_TOKEN";

    documents.push(t);
  });


  return { documents: documents, before: searchModule.documents.before, after: searchModule.documents.after };

  /*let index;

  try {
    if (!searchModule.query) {
      index = FlexSearch.create({
        doc: {
          id: 'Id',
          field: {
            ShowAllToken: {
              encode: 'extra',
              tokenize: 'full',
            },
          },
        },
      });
    } else {
      index = FlexSearch.create({
        doc: {
          id: 'Id',
          field: searchModule.schema,
        },
      });
    }
  } catch (err) {
    throw new Error('[400] Could not create search with schema. This could be the result of an IAM error for the index, or not packaging with dependencies.');
  }
  index.add(documents);

  try {
    const results = index.search(searchModule.query || 'SHOW_ALL_TOKEN', {limit: searchModule.count, page: searchModule.cursor});
    end = new Date();
    console.log(`Operation took ${end.getTime() - start.getTime()} msec`);
    return results;
  } catch (err) {
    console.log('No Search Index was found');
    console.log(err.message);
    end = new Date();
    console.log(`Operation took ${end.getTime() - start.getTime()} msec`);
    throw new Error('[412] No Search Index was found, or it was invalid. Make sure you have uploaded a index config first.');
  }*/
}

export default async (event) => {
  // eslint-disable-next-line no-param-reassign
  event.body = JSON.parse(event.body);
  const { query } = event.body;
  const count = event.body.count || 25;
  const { endpoint, connectionParameters, deviceId, before, after } = event.body;

  let cursor = undefined;
  let cursorGoesBackward = undefined;
  if (before) {
    cursor = before;
    cursorGoesBackward = true;
  } else if (after) {
    cursor = after;
    cursorGoesBackward = false;
  }

  let relatedEndpoint = global.appsbySearch.find(x => x.endpoint === endpoint);

  if (relatedEndpoint){
    return ProcessSearch(relatedEndpoint.handler, query, event.headers, count, cursor, cursorGoesBackward, connectionParameters, deviceId)
  } else {
    throw new Error('[404] No matching view.');
  }
};
