import postSearch from './handlers/handle-search';
import postView from './handlers/handle-document';
import postAuth from './handlers/handle-auth';
import postAPI from './handlers/handle-api';
import postUpload  from './handlers/handle-upload';
import postUploadMIME from './handlers/handle-upload-mime'
import postUploadComplete from './handlers/handle-upload-complete'
import {S3Callback} from './handlers/handle-s3-callback';
import {v4 as uuidv4} from 'uuid';
import {parseDomain, ParseResultType} from "parse-domain";


// Map your functions to http events here
const RESOURCE_MAP = {
      'search': {POST: postSearch},
      'view': {POST: postView},
      'auth': {POST: postAuth},
      'api': {POST: postAPI},
      'upload': {POST: postUpload},
      'mime': {POST: postUploadMIME},
      'postupload': {POST: postUploadComplete}
    }
;

/*
  BOILERPLATE STARTS HERE
  Usually you don't have to touch anything below this.
  (unless you are using this for actual production app and need to use Cognito & SNS & such)
  */


// eslint-disable-next-line import/prefer-default-export

/**
 * Appsby's resolve function is where the magic happens - it looks at your routes, automatically loads the appropriate components and functions, and returns your result. It's somewhat equivalent to Express' res.send() function.
 * Return the result of resolve at the end of your Lambda function handler.
 * @param {object} event - This ingests your Lambda's incoming event variable. It's used to validate headers, cookies, auth, endpoints, data, etc.
 * @return {object}
 */
export async function resolve(event) {

  async function eventify() {
    if (event.httpMethod && event.headers.endpoint) {
      // eslint-disable-next-line no-param-reassign

      let resourceName = event.headers.endpoint;//event.requestContext.path.replace("/", "");

      let resource = RESOURCE_MAP[resourceName];
      let resourceMethod = resource && resource[event.httpMethod];
      let rejectBasedOnHeaderOrigin = true;

      if (!resourceMethod && global.appsbyWebhooks) {
        //If it's not pointing to a normal resource, try adding the webhooks
        let webHook = global.appsbyWebhooks.find(x => x.endpoint === resourceName);
        if (!webHook || event.httpMethod === "GET") {
          throw new Error('[404] Route Not Found');
        }
        rejectBasedOnHeaderOrigin = false;
        resourceMethod = webHook.handler
      }

      if (rejectBasedOnHeaderOrigin && process.env.websiteAddress) {
        let originalDomain = event.headers.origin.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "");
        let parseResult = parseDomain(originalDomain);
        let parseResultGuarantee = parseDomain(process.env.websiteAddress)
        if (parseResult.type === ParseResultType.Listed) {
          const {icann} = parseResult;
          let icannGuarantee = parseResultGuarantee.icann;
          let origin = icann.domain + "." + icann.topLevelDomains.join(".")
          let originGuarantee = icannGuarantee.domain  + "." + icannGuarantee.topLevelDomains.join(".")
          if (origin !== originGuarantee) {
            throw new Error('[412] Outside domain');
          }
        } else if (process.env.NODE_ENV === "development" || process.env.overrideNodeEnv === "development") {
          if(originalDomain.includes("localhost")) { process.env.websiteAddress = "localhost" } else {
            process.env.websiteAddress = originalDomain;
          }
        } else {
          throw new Error('[412] Outside domain');
        }

      }

      if (event.headers.endpoint === "logout") {
        return
      }

      return resourceMethod(event);
    } else if (event.records) {
      return S3Callback(event);
    }
    console.log('UNKNOWN EVENT', event);
    throw new Error("[404]");
  }

  try {
    let coverage = await eventify();

    if (event.httpMethod === "GET"){
      return sendProxySuccessRedirect(coverage)
    }
    else {
      if (event.headers.endpoint === "logout"){
        return sendProxyLogout(coverage)
      } else {
        return sendProxySuccess(coverage)
      }
    }

  } catch (e) {
    if (event.httpMethod === "GET"){
      return sendProxyErrorDynamicPage(e)
    } else {
      return sendProxyError(e)
    }
  }
}

const sendProxySuccessRedirect = (responseObj) => {
  const response = responseObj && responseObj.statusCode ? responseObj : {
    statusCode: 301,
    headers: {
      Location: responseObj,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET',
    },
  };
  return response;
};

const sendProxySuccess = (responseObj) => {

  let u = uuidv4();
  let cookieHeader;

  console.log("trying to success this");

  console.log(responseObj);


  if (typeof responseObj.token === "string") {
    cookieHeader = [`_appsbyToken=${responseObj.token}; Domain=${process.env.websiteAddress}; Max-Age=900; Secure; HttpOnly; SameSite=None; Path=/`, `_appsbyXSRF=${u}; Max-Age=0; Domain=${process.env.websiteAddress}; Secure; SameSite=None; Path=/`]
    responseObj.token = u;
  } else if (typeof responseObj === "string") {
    cookieHeader = [`_appsbyToken=${responseObj}; Domain=${process.env.websiteAddress}; Max-Age=900; Secure; HttpOnly; SameSite=None; Path=/`, `_appsbyXSRF=${u}; Max-Age=0; Domain=${process.env.websiteAddress}; Secure; SameSite=None; Path=/`]
    responseObj = u;
  }

  const response = responseObj && responseObj.statusCode ? responseObj : {
    statusCode: 200,
    body: JSON.stringify(responseObj),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET',
    },
  };
  if(cookieHeader) {
    response.headers['Set-Cookie'] = cookieHeader;
  }

  return response;
};

const sendProxyLogout = () => {

  let u = uuidv4();
  let cookieHeader = [`_appsbyToken=${u}; Expires=; Domain=${process.env.websiteAddress}; Max-Age=0; expires=Sat, 1-Jan-72 00:00:00 GMT; Secure; HttpOnly; SameSite=None; Path=/`, `_appsbyXSRF=${u}; Max-Age=0; Domain=${process.env.websiteAddress}; Secure; SameSite=None; Path=/`]

  const response =  {
    statusCode: 200,
    body: {},
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET',
    },
  };
  if(cookieHeader) {
    response.headers['Set-Cookie'] = cookieHeader;
  }

  return response;
};

const sendProxyError = (err) => {
  console.log('ERROR:', err.stack || err);
  let status = 500;
  let message = err.message || JSON.stringify(err);
  const m = err.message && err.message.match(/^\[(\d+)\] *(.*)$/);
  if (m) {
    [, status, message] = m;
    status = parseInt(status);
  }

  const response = {
    statusCode: status,
    body: JSON.stringify({ errorMessage: message }),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  };

  let u = uuidv4();
  let cookieHeader = [`_appsbyToken=${u}; Expires=; Domain=${process.env.websiteAddress}; Max-Age=0; expires=Sat, 1-Jan-72 00:00:00 GMT; Secure; HttpOnly; SameSite=None; Path=/`, `_appsbyXSRF=${u}; Max-Age=0; Domain=${process.env.websiteAddress}; Secure; SameSite=None; Path=/`]
  if(status === 401) {
    response.headers['Set-Cookie'] = cookieHeader;
  }

  return response;
};

const sendProxySuccessDynamicPage = (responseObj) => {
  const response = responseObj && responseObj.statusCode ? responseObj : {
    statusCode: 200,
    body: responseObj,
    headers: {
      'Content-Type': 'text/html',
      'Access-Control-Allow-Origin': '*',
    },
  };
  return response;
};

const sendProxyErrorDynamicPage = (err) => {
  console.log('ERROR:', err.stack || err);
  let status = 500;
  let message = err.message || JSON.stringify(err);
  const m = err.message && err.message.match(/^\[(\d+)\] *(.*)$/);
  if (m) {
    [, status, message] = m;
    status = parseInt(status);
  }
  const response = {
    statusCode: status,
    body: `<html lang="en"><head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <title>Error 404</title>
  </head>
  <body>
    <main>
    <h1>Uh oh - Code ${status}.</h1>
            <p>
              ${message}
            </p>
            <small>Powered by <a href="http://audallabs.com">Appsby.js</a></small>
    </main>
</body></html>`,
    headers: {
      'Content-Type': 'text/html',
      'Access-Control-Allow-Origin': '*',
    },
  };
  return response;
};
