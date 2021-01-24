import { performAuthentication } from "./handle-auth";
import {createReturnObject} from "../helpers/createReturnObject";
import {SetDocument} from "./handle-document";

async function ProcessAPI(ViewInterpreter, headers, deviceId, connectionParameters, rawData) {

  const view = await new ViewInterpreter(connectionParameters);

  const identifiedUser = await performAuthentication(headers, deviceId, view.authenticator);

  if (typeof identifiedUser === "object"){
    view.props.user = identifiedUser.user;
    view.props.userId = identifiedUser.userId;
  }
  view.props.connectionParameters = connectionParameters;
  await view.componentDidMount();

  if (identifiedUser && await view.componentShouldAuthorize()) {

    if (!rawData) return;
    const [key, value] = Object.entries(rawData)[0];


    //Never allow for direct access to appsby internals
    //if (key.toLowerCase() === "componentDidMount" || key.toLowerCase().contains("componentShouldAuthorize") || key.toLowerCase === "render") throw new Error("[401] You can't do that.");

    const formattedData = await view[key](value);

    if (view.props.userHasReauthenticated) {
      return formattedData;
    }

    if (view.props.autoSave) {
      await SetDocument(view.props.faunaDocumentRef, formattedData).data;
      return createReturnObject(identifiedUser, formattedData);
    } else {
      return createReturnObject(identifiedUser, formattedData);
    }

  } else if (identifiedUser) {
    //user was identified but didn't have access
    return createReturnObject(identifiedUser, {});
  } else {
    throw new Error("[401] Unauthorized");
  }
}

export default async (event) => {
  // eslint-disable-next-line no-param-reassign
  event.body = JSON.parse(event.body);
  const { endpoint, data, connectionParameters, deviceId } = event.body;

  let relatedEndpoint = global.appsbyAPI.find(x => x.endpoint === endpoint);

  if (relatedEndpoint){
    return ProcessAPI(relatedEndpoint.handler, event.headers, deviceId, connectionParameters, data)
  } else {
    throw new Error('[404] No matching view.');
  }
};
