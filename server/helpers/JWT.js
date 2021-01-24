import jwt from 'jsonwebtoken';
import {v4 as uuidv4} from 'uuid';
import {
    AppsbyCreateSingleDocument,
    AppsbyGetSingleDocumentByFields,
    AppsbyGetSingleDocumentById
} from "./fauna-functions";
import {shortUrlDecode} from "./ShortURL";
import {SetDocument} from "../handlers/handle-document";
const sc = require('@tsmx/string-crypto');
// eslint-disable-next-line import/prefer-default-export

export async function CreateJWT(issuer, subject, endpoint, jwtSigningKey, dataSigningKey, deviceId, deviceFingerprint, existingJWT = null) {


    let payload = {
        'deviceId': deviceId,
        'authentications': []
    };

    let jwtId;

    let existingJWTIsValid = false;

    if (existingJWT) {

        try {
            existingJWTIsValid = true;
            let existingToken = DecodeJWT(issuer, jwtSigningKey, dataSigningKey, deviceId, existingJWT);
            jwtId = existingToken.jti;

            if (endpoint !== null) {
                var updatableSession = await AppsbyGetSingleDocumentById("appsbySession", jwtId);
                updatableSession.document.lastSeen = Date.now();
                updatableSession.document.authentications[endpoint] = subject;
                await SetDocument(updatableSession.faunaDocumentRef, { lastSeen: Date.now(), authentications: { id: endpoint, subject: subject }}, updatableSession);
            }

            existingToken.sub.authentications.forEach((key) => {
                console.log('existingToken is ', existingToken.sub);
                console.log('key is ', key);
                payload.authentications.push({ id: key.id, subject: key.subject });
            })
        } catch {
            existingJWTIsValid = false;
            payload = {
                'deviceId': deviceId,
                'authentications': []
            };
        }

    }

    if (existingJWTIsValid === false) {

        if (endpoint !== null) {
            var newSession = {
                deviceId: deviceId,
                authentications: [
                    { id: endpoint, subject: subject }
                ],
                sessionCreationDate: Date.now(),
                lastSeen: Date.now()
            }

            var documentResult = await AppsbyCreateSingleDocument("appsbySession", newSession);
            jwtId = documentResult.documentId;
        } else {
            console.log(payload);
            throw new Error("[401] No area to authorize.");
        }
    }


    if (endpoint !== null) {
        //We're adding a new endpoint to either a new or existing JWT
        console.log('payload is ', payload);
        payload.authentications.forEach((item, index) => {
            if (item.id === endpoint){
                payload.authentications.splice(index, 1)
            }
        })
        payload.authentications.push({ id: endpoint, subject: subject});
    }

    let encryptedPayload = sc.encrypt(JSON.stringify(payload), { key: dataSigningKey });

    const signOptions = {
        jwtid: jwtId,
        issuer: issuer,
        expiresIn: '7d',
        algorithm: 'HS256',
    };

    return jwt.sign({ sub: encryptedPayload }, jwtSigningKey, signOptions);
}


export async function VerifyJWT(issuer, jwtKey, keyOf32Bytes, deviceId, token) {

    /*try {*/
    const decoded = jwt.verify(token, jwtKey, { issuer: issuer });
    const decodedToken = JSON.parse(sc.decrypt(decoded.sub, {key: keyOf32Bytes}));

    console.log("decodedToken is ", decodedToken);

    var jwtId = decoded.jti;

    console.log("jwtid is ", jwtId);
    var updatableSession = await AppsbyGetSingleDocumentById("appsbySession", jwtId);

    console.log("updatableSession is ", updatableSession);

    if (updatableSession === null) {
        throw new Error('[401] Session has ended. Please login again.')
    }

    if (decodedToken.deviceId === deviceId) {
        await SetDocument(updatableSession.faunaDocumentRef, { lastSeen: Date.now() }, updatableSession.document);
        return decodedToken;
    } else {
        console.log(decodedToken.deviceId);
        console.log(decodedToken);
        console.log(deviceId);
        throw new Error('[401] Unable to service request.');
    }

    /*} catch(err) {
        console.log(deviceId);
        throw new Error('[401] Unable to service request.')
    }*/
}


export function DecodeJWT(issuer, jwtSigningKey, dataSigningKey, deviceId, token) {
    const decoded = jwt.verify(token, jwtSigningKey);
    decoded.sub = JSON.parse(sc.decrypt(decoded.sub, {key: dataSigningKey}));
    return decoded;
}

