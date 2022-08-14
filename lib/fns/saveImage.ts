import type {
    APIGatewayProxyEventV2,
    APIGatewayProxyResultV2,
  } from "aws-lambda";
  
  const AWS = require("aws-sdk");
  const moment = require("moment");
  
  const s3 = new AWS.S3()
  // Base64Image encoding https://elmah.io/tools/base64-image-encoder/
 
  export const handler = async (
    event: APIGatewayProxyEventV2
  ): Promise<APIGatewayProxyResultV2> => {
    if (event.body) {
        const response = {
            isBase64Encoded: false,
            statusCode: 200,
            body: JSON.stringify({ message: "Successfully uploaded file to S3" }),
        };
    
        try {
            const parsedBody = JSON.parse(event.body);
            const imageType = parsedBody["image"]["mime"].split("/")[1]
            const base64File = parsedBody["image"]["data"];
            const decodedFile = Buffer.from(base64File.replace(/^data:image\/\w+;base64,/, ""), "base64");
            const params = {
                Bucket: process.env.BUCKET_NAME,
                // Key: `images/${new Date().toISOString()}.jpeg`,
                Key: `images/${parsedBody.image.name }.${imageType}`,
                Body: decodedFile,
                ContentType: "image/png",
            };
            const uploadResult = await s3.upload(params).promise();
            response.body = JSON.stringify({ message: "Successfully uploaded file to S3", uploadResult });
        } catch (e) {
            console.error(e);
            response.body = JSON.stringify({ message: "File failed to upload", errorMessage: e });
            response.statusCode = 500;
        }
        return response;
    }
    return {
      statusCode: 400,
      body: "No body",
    };
  };
  