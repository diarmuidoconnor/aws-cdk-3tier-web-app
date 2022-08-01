import { APIGatewayProxyHandlerV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { QueryCommand, QueryCommandInput } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const ddbClient = new DynamoDBClient({ region: "eu-west-1" });

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  return new Promise<APIGatewayProxyResultV2>(async (resolve, reject) => {
    try {
      // Print Event
      console.log("Event: ", JSON.stringify(event));

      // Fetch Params from event
      const params: any = event.queryStringParameters
        ? event.queryStringParameters
        : {};

      //  Get DDB DocClient
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

      // Query command input with attributes to get
      const queryCommandInput: QueryCommandInput = {
        TableName: process.env.DDB_TABLE,
        // ExclusiveStartKey: params.nextToken
        //   ? JSON.parse(
        //       Buffer.from(params.nextToken, "base64").toString("ascii")
        //     )
        //   : undefined,
        ProjectionExpression: params.returnAttributes
          ? params.returnAttributes
          : undefined,
        // Limit: params.limit ? params.limit : undefined,
        ExpressionAttributeValues: {},
      };

      // Add Query Expression
      if (params.ID) {
        queryCommandInput.KeyConditionExpression = "ID = :ID";
        queryCommandInput.ExpressionAttributeValues = {
          ...queryCommandInput.ExpressionAttributeValues,
          ":ID": params.ID,
        };
      } else {
        queryCommandInput.IndexName = "artist-index";
        queryCommandInput.KeyConditionExpression = "artist = :artist";
        queryCommandInput.ExpressionAttributeValues = {
          ...queryCommandInput.ExpressionAttributeValues,
          ":artist": params.artist,
        };
      }

      // Execute Query
      const queryCommandOutput = await ddbDocClient.send(
        new QueryCommand(queryCommandInput)
      );
      let body = {
        data: queryCommandOutput.Items ? queryCommandOutput.Items : [],
        nextToken: queryCommandOutput.LastEvaluatedKey
          ? Buffer.from(
              JSON.stringify(queryCommandOutput.LastEvaluatedKey)
            ).toString("base64")
          : "",
      };
      // Return Response
      return resolve({
        statusCode: 200,
        headers: {
          "content-type": "application/json",
        },
        body:
          typeof body === "string"
            ? JSON.stringify({ message: body })
            : JSON.stringify(body),
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
