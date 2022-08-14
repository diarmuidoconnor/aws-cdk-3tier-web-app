/* eslint-disable import/extensions, import/no-absolute-path */
import { sharp } from "/opt/nodejs/sharp-utils";
import { S3Event } from "aws-lambda";
// Response type redundant - did not work
import { S3EventResponse } from "../../shared/types";
const AWS = require("aws-sdk");

const s3 = new AWS.S3();
// Base64Image encoding https://elmah.io/tools/base64-image-encoder/

export const handler = async (event: S3Event): Promise<S3EventResponse> => {
  return new Promise<S3EventResponse>(async (resolve, reject) => {
    const srcBucket = event.Records[0].s3.bucket.name;
    // Object key may have spaces or unicode non-ASCII characters.
    const srcKey = decodeURIComponent(
      event.Records[0].s3.object.key.replace(/\+/g, " ")
    );
    // Download the image from the S3 source bucket.
    let origimage = null;
    try {
      const params = {
        Bucket: srcBucket,
        Key: srcKey,
      };
      origimage = await s3.getObject(params).promise();
    } catch (error) {
      console.log(JSON.stringify(error));
      reject({
        statusCode: 500,
        message: "Failed to access source image",
      });
    }
    // set thumbnail width. Resize will set the height automatically to maintain aspect ratio.
    const width = 200;
    let buffer = null;
    // Use the sharp module to resize the image and save in a buffer.
    try {
      buffer = await sharp(origimage.Body).resize(width).toBuffer();
    } catch (error) {
      console.log(JSON.stringify(error));
      reject({
        statusCode: 400,
        message: "Resizing failed",
      });
    }
    // Upload the thumbnail image to the destination bucket
    try {
      const destparams = {
        Bucket: process.env.BUCKET_NAME,
        Key: srcKey,
        Body: buffer,
        ContentType: "image",
      };
      await s3.upload(destparams).promise();
    } catch (error) {
      console.log(JSON.stringify(error));
      reject({
        statusCode: 500,
        message: "Failed to upload thumbnail",
      });
    }
    resolve({
      statusCode: 200,
      message: "Resize successful",
    });
  });
};
