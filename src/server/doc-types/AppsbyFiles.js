import Base from "./Base";

/** Create an instance of AppsbyFiles to provide Amazon S3 file upload/download functionality to users. */
export class AppsbyFiles extends Base {

    /**
     * Is the user allowed to upload a file with this endpoint? Check their permissions and return true or false here.
     * @return {boolean}
     */
    async componentShouldAuthorize() { return false; }

    /**
     * Is the user allowed to download/view a file from this endpoint? Check their permissions and return true or false here.
     * @return {boolean}
     */
    async componentShouldAuthorizeDownload() { return false; }

    /**
     * This function will be called when the component completes an upload to S3. It is called by the client, not S3 itself - however the file's existence will be validated before this is called.
     * You might want to use this function to add the File's ID to a user's list of uploads/a specific document/etc.
     */
    async componentDidCompleteUpload() { }

    /**
     * This name of the S3 bucket you want to upload to.
     * @param {string} bucketName - The name of your Amazon S3 bucket.
     */
    async useUploadBucket(bucketName) {
        this.props.uploadBucket = {};
        if (typeof bucketName === "string") {
            this.props.uploadBucket.name = bucketName;
        } else throw new Error("[500] Bucket name in useUploadBucket must be a string.");
    }

    /**
     * The name of the S3 bucket you want to download from.
     * In most cases, this is the same as your upload bucket name, but if you do file transforms or serve your files from a different bucket than your upload one, use this to specify that behaviour.
     * @param {string} bucketName - The name of your Amazon S3 bucket.
     * @param {string} region - The region of your S3 bucket (i.e. us-east-1).
     * @param {boolean} isPublic - Whether a bucket is public or not. Not essential, but if you specify as public, access key generation will be skipped for speed.
     */
    async useDownloadBucket(bucketName, region, isPublic) {
        this.props.downloadBucket = {};
        if (typeof bucketName === "string") {
            this.props.downloadBucket.name = bucketName;
        } else throw new Error("[500] Bucket name in useDownloadBucket must be a string.");
        if (typeof region === "string") {
            this.props.downloadBucket.region = region;
        } else throw new Error("[500] Region name in useDownloadBucket must be a string.");
        if (typeof isPublic === "boolean") {
            this.props.downloadBucket.isPublic = isPublic;
        } else throw new Error("[500] isPublic name in useDownloadBucket must be a boolean.");
    }

    /**
     * S3 Callback functions are optionally specifiable within a Files component. You can write them just like regular functions within an Appsby component.
     * Once you've done that, use this function to specify the function's name, and it'll be called whenever an S3 file upload event that matches your component hits your main Appsby entry point.
     * Quick note: This only works when you have an S3 Upload Completed event in AWS that calls the Appsby entry point. This is easiest to do with Serverless Framework.
     * Another quick note: Don't go changing to Serverless Framework just for this functionality, you can get a similar result by just using the client-initiated componentDidCompleteUpload() function.
     * @param {string} callbackString - The callback function's name as a string.
     */
    async useCallback(callbackString) {
        if (typeof callbackString === "string") {
            this.props.callback = callbackString;
        } else throw new Error("[500] Callback must referred to as a string.");
    }

    /**
     * Use this function to specify the allowable file types for an upload. Put in common file extensions (i.e. .mp3, .wav, .pdf etc) - file-type is running under the hood doing magic number checks to validate your user's content.
     * All data is cross-referenced against its MIME type, so file types that have multiple different extensions (many multimedia formats) will still work without issue.
     * @param {string/array} types - A string specifying a single file extension, or an array containing multiple file extensions as strings.
     */
    async setFileType(types) {
        if (typeof types === "string") {
            types = [types];
        }
        this.props.fileTypes = types;
    }

}
