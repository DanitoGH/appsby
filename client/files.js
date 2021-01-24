import {DeliverRequest} from "./requests";

var Axios = require ("axios");
var { AppsbyGlobalState } = require("./auth");
const FileType = require('file-type/browser');


async function GetFileMIME(endpoint, connectionParameters) {

    let toSend = {};
    toSend.endpoint = endpoint;
    toSend.connectionParameters = connectionParameters;
    return DeliverRequest(toSend, "mime", false, 120);
}

async function CompleteFileUpload(endpoint, key) {

    let toSend = {};
    toSend.endpoint = endpoint;
    toSend.key = key;

    return DeliverRequest(toSend, "postupload", false, 0.001);
}

async function GenerateUploadURLAndVerifyAccess(endpoint, fileName, magicBytes100Sample, connectionParameters) {

    let toSend = {
        endpoint: endpoint,
        fileName: fileName,
        magicBytes100Sample: JSON.stringify(Array.from(magicBytes100Sample)),
        connectionParameters: connectionParameters,
    };

    return DeliverRequest(toSend, "upload", false, 0.001);

}

async function UploadFile(uploadUrl, metadata, file, fileName, fileType, uploadProgressCallback){


    const formData = new FormData();
    formData.append("Content-Type", fileType.mime);
    Object.entries(metadata).forEach(([k, v]) => {
        formData.append(k, v);
    });
    formData.append("file", file); // must be the last one

    const config = {
        headers: {
            contentType: 'multipart/form-data'
        },
    };

    if(uploadProgressCallback) {
        config.onUploadProgress = progressEvent => {
            const totalLength = progressEvent.lengthComputable ? progressEvent.total : progressEvent.target.getResponseHeader('content-length') || progressEvent.target.getResponseHeader('x-decompressed-content-length');
            uploadProgressCallback({fileName: fileName, uploadPercentage: (progressEvent.loaded * 100) / totalLength});
        }
    }

    try {
        return Axios.post(uploadUrl, formData, config).then(result => {
            if (result.status === 204 || result.status === 200) {
                return { success: true, result: "" }
            }

        }).catch(result => {
            if (result.response.status === 401) {
                AppsbyGlobalState.signOut()
            } else {
                if (result.response && result.response.statusText) {
                    return { success: false, result: `There was an issue with your upload: ${result.response.statusText}` }
                } else {
                    return { success: false, result: "Your internet connection may be offline. Check it and refresh this page."}
                }
            }
        });
    } catch (e) {
        return { success: false, result: e }
    }


}

function GetFileAddress(file, endpoint, requiresAuth = true){
    if (requiresAuth)
    return global.baseUrl + "files/" + endpoint + "/" + file;
}

export async function AppsbyUploadFile(endpoint, file, connectionParameters, uploadProgressCallback) {
    let mimeTypes = await GetFileMIME(endpoint, connectionParameters);

    if (!mimeTypes.success) { return { success: false, result: mimeTypes.result }}

    let buf = await file.arrayBuffer();
    let magicBytes100Sample = (new Uint8Array(buf)).subarray(0, 100);

    let fileType = await FileType.fromBuffer(buf);
    let safeMime = false;

    mimeTypes.result.forEach((mime) => {
        if (mime === fileType.ext) {
            safeMime = true;
        }
    })

    if (safeMime === false) { return { success: false, result: `This file type is not supported. You may upload: ${mimeTypes.result.join(", ")}` }}

    let fileName = file.name;
    let generateURLResult = await GenerateUploadURLAndVerifyAccess(endpoint, fileName, magicBytes100Sample, connectionParameters)

    if (!generateURLResult.success) { return { success: false, result: mimeTypes.result }}

    let uploadResult = await UploadFile(generateURLResult.result.url, generateURLResult.result.fields, file, fileName, fileType, uploadProgressCallback);

    if (!uploadResult.success) { return { success: false, result: uploadResult.result }}

    let finalizeResult = await CompleteFileUpload(endpoint, generateURLResult.result.fields.key)

    if (!finalizeResult.success) { return { success: false, result: finalizeResult.result }}

    return { success: true, result: finalizeResult.result }

}

export async function AppsbyGetFile(endpoint, file, requiresAuthentication){
    return GetFileAddress(file, endpoint, requiresAuthentication);
}

export async function AppsbySaveFile(endpoint, file, requiresAuthentication) {
    const address = GetFileAddress(file, endpoint, requiresAuthentication);
    window.open(address, "_blank");
}
