import type {
  S3Event
} from "aws-lambda";

// const util = require('util');
/* eslint-disable import/extensions, import/no-absolute-path */
import {sharp } from '/opt/nodejs/sharp-utils';
const AWS = require("aws-sdk");  
const s3 = new AWS.S3()
  // Base64Image encoding https://elmah.io/tools/base64-image-encoder/

export const handler = async (
    event : any
  ) => {
    // console.log('bucket name is 👉', JSON.stringify(event.Records[0].s3.bucket.name , null, 4));
    // console.log('object is 👉', JSON.stringify(event.Records[0].s3.object.key , null, 4));
    const srcBucket = event.Records[0].s3.bucket.name;
    // Object key may have spaces or unicode non-ASCII characters.
    const srcKey    = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
    // console.log('object key is 👉', srcKey);
    // Infer the image type from the file suffix.
    const typeMatch = srcKey.match(/\.([^.]*)$/);
    if (!typeMatch) {
        console.log("Could not determine the image type.");
        return;
    }
    // Check that the image type is supported
    const imageType = typeMatch[1].toLowerCase();
    if (imageType != "jpeg" && imageType != "png") {
        console.log(`Unsupported image type: ${imageType}`);
        return {
          statusCode: 400,
          body: `Unsupported image type: ${imageType}`,
        };
    }
    // Download the image from the S3 source bucket.
    try {
        const params = {
            Bucket: srcBucket,
            Key: srcKey
        };
        var origimage = await s3.getObject(params).promise();
    } catch (error) {
        console.log(error);
        return {
          statusCode: 400,
          body: JSON.stringify(error, null,3),
        }
    }
    // const data =  s3.getObject(
      // {
      //   Bucket: event.Records[0].s3.bucket.name,
      //   Key: event.Records[0].s3.object.key
      // }
      // ).promise();
      // set thumbnail width. Resize will set the height automatically to maintain aspect ratio.
      const width  = 200;
      // Use the sharp module to resize the image and save in a buffer.
      try {
          var buffer = await sharp(origimage.Body).resize(width).toBuffer();
      } catch (error) {
          console.log(error);
          return {
            statusCode: 400,
            body: JSON.stringify(error, null,3),
          }
        }
        // Upload the thumbnail image to the destination bucket
        try {
            const destparams = {
                Bucket: process.env.bucketName,
                Key: srcKey,
                Body: buffer,
                ContentType: "image"
            }; 
            const putResult = await s3.upload(destparams).promise();
      
        } catch (error) {
            console.log(error);
            return {
              statusCode: 400,
              body: JSON.stringify(error, null,3),
            }
        }
    return {
      body: JSON.stringify({message: 'Success! 🎉🎉🎉'}),
      statusCode: 200,
    };

  };     
  