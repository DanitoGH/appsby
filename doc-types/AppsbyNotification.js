import normalAuth from "../../../songtrick-static/src/app-pages/login/auth";

export class AudioUpload extends VerifyDoc {

    constructor() {
        super();
        this.appsby.authenticator = normalAuth;
        this.appsby.uploadBucketName = "sanitize-audio-assets";
        this.appsby.downloadBucketName = "sanitize-audio-assets";
        this.appsby.fileMimeTypes = ["audio/wav"];
    }

    //This is called before a file upload starts. The user has already been authenticated using
    //this.appsby.authenticator, so they're authenticated to use this part of the app, but they
    //haven't yet been authorized to upload anything. Maybe they're a document owner, and a
    //reference to this upload will be included in a document. Or maybe they're not the owner,
    //but still have access to the document, and thus should still be permitted to upload to it,
    //like if you're making a collaborative editor. Whatever the case, check their permissions here.
    //If you've sent any additional data from the front-end, this is available as an object in data.
    //If you want to authorize a user, return true, or return an object with metadata you want to be
    //attached to the upload. Return false to deny an upload.
    checkIfUserIsAuthorized = async (data) => {

    }

    //This is called after the file upload is completed.
    //Do any file validation you need on the original file,
    //then add it to whatever documents you need.
    //If you have different buckets for sanitation and serving,
    //Sanitize your asset here, then use AppsbyMoveFile() to move your asset,
    //and change this.appsby.downloadBucketName.
    //Moving a file to a new bucket will result in the callback being called again,
    //this time with callingBucket representing the new bucket name.
    //You may want to use a switch statement to create multi-step file transformations/validations.
    //The file object is { id, fileName, fileExtension, endpoint, userData, async getBytes(), async setBytes() }.
    uploadFileCallback = async (file, callingBucket) => {

    }

    //Check if a user is authorized to use the file.
    //You might check that a user is the owner of the file,
    //or has other permissions.
    //You could also change this.appsby.downloadBucketName dynamically,
    //if you're setting your buckets dynamically, or have other complex file
    //transformation/validation flows.
    verifyDownload = async () => {

    }

}
