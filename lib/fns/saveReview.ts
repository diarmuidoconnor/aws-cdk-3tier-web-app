import { APIGatewayProxyResultV2, APIGatewayProxyHandlerV2 } from "aws-lambda";
import { AddReviewBody, Review } from "../../shared/types";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
const moment = require("moment");

const AWS = require("aws-sdk");

const ddbClient = new DynamoDBClient({ region: "eu-west-1" });

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  return new Promise<APIGatewayProxyResultV2>(async (resolve, reject) => {
    try {
      console.log("Event is : ", JSON.stringify(event));
      // Fetch Body from event
      const body: AddReviewBody = event.body ? JSON.parse(event.body) : {};

      // Build Concert DDB Item
      const review: Review = {
        concertID: body.concertID,
        language: body.language,
        review: body.review,
        author: body.author,
        created: moment().format("YYYYMMDD-hhmmss"),
      };

      const marshallOptions = {
        convertEmptyValues: true,
        removeUndefinedValues: true,
        convertClassInstanceToMap: true,
      };
      const unmarshallOptions = {
        wrapNumbers: false,
      };
      const translateConfig = { marshallOptions, unmarshallOptions };
      const ddbDocClient = DynamoDBDocumentClient.from(
        ddbClient,
        translateConfig
      );
      await ddbDocClient.send(
        new PutCommand({
          TableName: process.env.DDB_TABLE,
          Item: review,
        })
      );

      // let comprehendParams = {
      //   LanguageCode: null,
      //   Text: festival.review
      // };
      // console.log('sentimant params ', JSON.stringify(,null,3))
      // try {
      // let dominantLanguage : any = await comprehend.detectDominantLanguage(comprehendParams).promise()
      // comprehendParams.LanguageCode = dominantLanguage.Languages[0].LanguageCode

      // let sentiment = await comprehend.detectSentiment(comprehendParams).promise()

      // console.log(' language ', JSON.stringify(sentiment, null,3) )

      // , function(err : any, data : any) {
      //   if (err) console.log(err, err.stack); // an error occurred
      //   else     console.log(data);           // successful response
      // });

      // const queueParams = {
      //   MessageBody: JSON.stringify(festival),
      //   QueueUrl: process.env.SQSqueueURL
      // }

      // Send to SQS
      // const result = await sqs.sendMessage(queueParams).promise()

      // Return success message
      return resolve({
        statusCode: 200,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ message: " Review added successfully" }),
      });
    } catch (error: any) {
      console.log(JSON.stringify(error));
      resolve({
        statusCode: 500,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ error }),
      });
    }
  });
};
