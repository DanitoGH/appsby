import {GetObjectCommand, HeadObjectCommand, S3Client} from '@aws-sdk/client-s3';
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import remove from "confusables";
const streamingS3 = require('streaming-s3');
const S3ReadableStream = require("s3-readable-stream");
const { Converter } = require("ffmpeg-stream")
const streamz = require("stream");
const path = require("path");
const FileType = require('file-type');
const {ReReadable} = require("./rereadable-stream");

var s3Credentials = {
    accessKeyId: process.env.s3AccessKeyId,
    secretAccessKey: process.env.s3SecretAccessKey
}

// eslint-disable-next-line import/prefer-default-export
export function generateS3() {
    return new S3Client({
        region: 'us-east-1',
        signatureVersion: 'v4',
        accessKeyId: s3Credentials.accessKeyId,
        secretAccessKey: s3Credentials.secretAccessKey,
    });
}

export async function GenerateUploadKey(uuid, amazonMetadata, fileTypes, bucketName, userId, userType, fullFileName, magicBytes100Sample, endpoint, callback) {
    const s3 = generateS3();

    console.log("generate a key")

    magicBytes100Sample = Uint8Array.from(JSON.parse(magicBytes100Sample))

    console.log("checkpoint 1")

    let fileExtension = path.extname(fullFileName) || "";
    let fileMIME = null;

    console.log("checkpoint 2")

    let fileName = path.basename(fullFileName, fileExtension);
    fileName = remove(fileName);
    fileName = fileName.toLowerCase();

    console.log("checkpoint 3")

    let goodFileType = false;

    let underlyingFileType = await FileType.fromBuffer(magicBytes100Sample);

    console.log("checkpoint 4")

    console.log("underlying file type is");
    console.log(underlyingFileType)

    fileTypes.forEach((type) => {
        if (underlyingFileType.ext && typeof underlyingFileType.ext === "string" && type === underlyingFileType.ext) {
            goodFileType = true;
            fileExtension = underlyingFileType.ext;
            fileMIME = underlyingFileType.mime;
        }
    })

    if (!goodFileType) return;

    let amzObject = {
        Bucket: bucketName,
        Fields: {
            key: uuid, // totally random
        },
        Expires: 60*60*12,
        Conditions: [
            ["content-length-range", 0, 2147483648], // content length restrictions: 0-2GB
            ["starts-with", "$Content-Type", fileMIME], // content type restriction
            ["eq", "$x-amz-meta-appsbyuserid", userId], // tag with userid <= the user can see this!
            ["eq", "$x-amz-meta-appsbyusertype", userType],
            ["eq", "$x-amz-meta-appsbyfilename", fileName],
            ["eq", "$x-amz-meta-appsbyfileextension", fileExtension],
            ["eq", "$x-amz-meta-appsbyfilemime", fileMIME],
            ["eq", "$x-amz-meta-appsbyendpoint", endpoint],
            ["eq", "$x-amz-meta-appsbycallback", callback],
        ]
    }

    Object.keys(amazonMetadata).forEach((item) => {
        let key = item;
        let value = amazonMetadata[item];
        key = key.replace(/[^a-z0-9]/gi,'');
        amzObject.Conditions.push(["eq", `$x-amz-meta-${key}`, value]);
    })

    const data = await createPresignedPost(amzObject);

    data.fields["x-amz-meta-appsbyuserid"] = userId; // Don't forget to add this field too
    data.fields["x-amz-meta-appsbyusertype"] = userType;
    data.fields["x-amz-meta-appsbyfilename"] = fileName;
    data.fields["x-amz-meta-appsbyfileextension"] = fileExtension;
    data.fields["x-amz-meta-appsbyfilemime"] = fileMIME;
    data.fields["x-amz-meta-appsbyendpoint"] = endpoint;
    data.fields["x-amz-meta-appsbycallback"] = callback;

    Object.keys(amazonMetadata).forEach((item) => {
        let key = item;
        let value = amazonMetadata[item];
        key = key.replace(/[^a-z0-9]/gi,'');
        data.fields[`x-amz-meta-${key}`] = value;
    })

    return { s3GeneratedLink: data, fileType: fileMIME, fileExtension: fileExtension };
}

export async function GenerateDownloadKey(bucket, key) {
    const s3 = generateS3();
    return getSignedUrl(s3, new GetObjectCommand({Bucket: bucket, Key: key}), {expiresIn: 3600});
}

export async function AppsbyMoveFileBetweenBuckets(previousBucket, previousKey, nextBucket, nextKey, deletePreviousFile = false, dataTransformer = null) {
    const s3 = generateS3();

    let existingMeta = S3GetMetadata(previousBucket, previousKey);

    //Stream the existing file in from S3 bucket
    const stream = new S3ReadableStream(s3, {Bucket: previousBucket, Key: previousKey});

    //Set up input stream error handling
    stream.on("error", function(error){
        throw new Error(`[500] S3 Stream Error Type 1: ${error}`);
    });

    // We'll need this passthrough later
    const pass = new streamz.PassThrough(); // This is just normal stream.Passthrough, but needed to be imported as streamz due to naming conflict in other package (was messing with CLion).

    //We're piping the passthrough stream to a Re-Readable stream (keeps buffers in memory to be re-read later).
    let rereadable = pass.pipe(new ReReadable({objectMode: false, length: 3, highWaterMark: 2}));
    let hasMagicked = false;
    let magicLength = 0;
    let magicBuffers;

    //Create our new stream for later (our re-readable, from the start)
    let rewound = rereadable.rewind();

    //When pass is piped data, we want to read ~2 chunks of data to determine what file type we are outputting. This allows us to dynamically set content type for S3, which makes file handling easier later.
    //It also means that we do not have to set MIME type in our middleware (which we may get wrong, or may be dynamic)
    pass.on("data", (chunk) => {

        //hasMagicked = true means that we've read magic byte and determined file type. hasMagicked = false means we need to read the stream here to determine file type.
        if (!hasMagicked) {
            magicLength += chunk.length;

            //If no magic buffers yet (first time through), set magicBuffers variable to the current chunk, otherwise, concatenate existing chunk and new chunk.
            if (magicBuffers === undefined) {
                magicBuffers = chunk;
            } else {
                let bufarr = [magicBuffers, chunk];
                magicBuffers = Buffer.concat(bufarr);
            }

            //If the length of our magicBuffers is 150, then we have all the data we need for checking MIME.
            //I don't know why 150 bytes is necessary when most file formats (that I know of) have that data much earlier,
            //but every guide said 100-200 bytes is necessary.
            if (magicLength > 150) {
                hasMagicked = true;
                FileType.fromBuffer(magicBuffers).then((result) => {

                    //We got the file type from the magicBuffers.
                    //Now we're going to use the existing metadata on our new S3 upload, but change the mime, ext, content-type.
                    existingMeta.appsbyfilemime = result.mime;
                    existingMeta.appsbyfileextension = result.ext;

                    //We're using our re-wound stream to do this
                    let uploader = new streamingS3(rewound, {
                        accessKeyId: s3Credentials.accessKeyId,
                        secretAccessKey: s3Credentials.secretAccessKey,
                        region: "ap-southeast-2",
                        signatureVersion: 'v4'
                    }, {
                        Bucket: nextBucket,
                        Key: nextKey,
                        ContentType: result.mime,
                        Metadata: existingMeta
                    }, function (e, resp, status) {
                        if (e) throw new Error(`[500] S3 Stream Error Type 2: ${e}`); // Error with uploading stream to S3
                        if (status && resp) {
                            console.log(status, resp);

                            //Should delete previous file?
                            if (deletePreviousFile) {
                                let x = generateS3();


                                x.deleteObject({Bucket: previousBucket, Key: previousKey}, function(err, data) {
                                    if (err) console.log(err, err.stack); // an error occurred
                                    else console.log(data);           // successful response
                                }).promise(); // This is what always catches without try/catch block

                            }
                        }
                    })

                });
            }
        }
    });


    //This is where all the actual work gets started. Everything is async, so will not begin until this.
    //We check if we are transforming the data (via something like FFMPEG or Sharp), or simply changing the location of the file.
    if (!dataTransformer){
        stream.pipe(pass);
    } else {
        await dataTransformer(stream, pass);
    }

}

//This function is an example of a dataTransformer for the MoveFileBetweenBuckets() function. FFMPEG_PATH will be changed to Lambda Layer location later on.
//This does work if you have FFMPEG installed - just change the path location to wherever it is.
async function WavToMP3(inputStream, outputPipe) {

    process.env.FFMPEG_PATH = "../ffmpeg";
    let converter = new Converter();
    let input = converter.createInputStream({
        f: 'wav'
    });

    let output = converter.createOutputStream({
        f: 'mp3'
    })
    inputStream.pipe(input);
    output.pipe(outputPipe);
    await converter.run();

}



export async function MagicByteFileType(buffer) {
    return await FileType.fromBuffer(buffer);
}

export async function S3CheckIfFileExists(bucketName, key){
    let s3 = generateS3();
    return await s3.send(new HeadObjectCommand({Bucket: bucketName, Key: key})).then(() => true, err => {
        if (err.code === 'NotFound') {
            return false;
        }
        throw err;
    })
    /*return await s3
        .headObject({

        })
        .promise()
        .then(
            () => true,
            err => {
                if (err.code === 'NotFound') {
                    return false;
                }
                throw err;
            }
        );*/
}

export async function S3GetMetadata(bucketName, key){
    let s3 = generateS3();
    //let res = await s3.headObject({Bucket: bucketName, Key: key,}).promise();
    let res = await s3.send(new HeadObjectCommand({Bucket: bucketName, Key: key}));
    return res.Metadata;
}


export { Converter as FFMPEGConverter };
