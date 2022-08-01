import { APIGatewayProxyResultV2, APIGatewayProxyHandlerV2 } from "aws-lambda";
import { AddConcertBody, Concert } from "../../shared/types";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
const moment = require("moment");

const ddbClient = new DynamoDBClient({ region: "eu-west-1" });

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  return new Promise<APIGatewayProxyResultV2>(async (resolve, reject) => {
    try {
      // Print Event
      console.log("Event: ", JSON.stringify(event));

      // Fetch Body from event
      const body: AddConcertBody = event.body ? JSON.parse(event.body) : {};

      // Validate Payload
      //   const validationResult = await validateAPISchema(addUserSchema, body);
      //   if (validationResult.isValid) {

      // Build Concert DDB Item
      const concert: Concert = {
        ID: Math.floor(Math.random() * Math.floor(10000000)).toString(),
        created: moment().format("YYYYMMDD-hhmmss"),  
        artist: body.artist,
         city: body.city,
        venue: body.venue,
        title: body.title,
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
          Item: concert,
        })
      );

      // Return success message
      return resolve({
        statusCode: 200,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ message: " Concert added successfully" }),
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
