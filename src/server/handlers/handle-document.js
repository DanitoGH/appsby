import {HandleRequest} from "../helpers/doc-type-generics/HandleRequest";

export default async (event) => {
  // eslint-disable-next-line no-param-reassign
  event.body = JSON.parse(event.body);
  const { endpoint, data, connectionParameters, deviceId } = event.body;

  let relatedEndpoint = global.appsbyView.find(x => x.endpoint === endpoint);

  if (relatedEndpoint){
    return HandleRequest(relatedEndpoint.handler, event.headers, deviceId, connectionParameters, data)
  } else {
    throw new Error('[404] No matching view.');
  }
};
