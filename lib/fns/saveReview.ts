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
        ID: Math.floor(Math.random() * Math.floor(10000000)).toString(),
        created: moment().format("YYYYMMDD-hhmmss"),  
        concertID: body.concertID,
        language: body.language,
        review: body.review,
        author: body.author,
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
 
      // const queueParams = {
      //   MessageBody: JSON.stringify(festival),
      //   QueueUrl: process.env.SQSqueueURL
      // }

      // Send to SQS
      // const result = await sqs.sendMessage(queueParams).promise()

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
