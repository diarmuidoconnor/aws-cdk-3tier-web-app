import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";

const AWS = require("aws-sdk");
const moment = require("moment");

const documentClient = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS({ apiVersion: "2012-11-05" });

export interface Festival {
  name: string;
  review: string;
}

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  if (event.body) {
    const festival = JSON.parse(event.body) as Festival;

    let params = {
      TableName: process.env.DatabaseTable,
      Item: {
        ID: Math.floor(Math.random() * Math.floor(10000000)).toString(),
        created: moment().format("YYYYMMDD-hhmmss"),
        metadata: JSON.stringify(festival),
        name: festival.name,
        review: festival.review,
      },
    };
    try {
      let data = await documentClient.put(params).promise();
    } catch (err) {
      console.log(err);
      return {
        statusCode: 400,
        body: JSON.stringify(err),
      };
    }
    const queueParams = {
      MessageBody: JSON.stringify(festival),
      QueueUrl: process.env.SQSqueueURL
    }
    
    // Send to SQS
    const result = await sqs.sendMessage(queueParams).promise()
    return {
      statusCode: 200,
      body: "OK!",
    };
  }
  return {
    statusCode: 400,
    body: "No body",
  };
};
