import type { APIGatewayProxyResultV2 } from "aws-lambda";
const AWS = require("aws-sdk");

const documentClient = new AWS.DynamoDB.DocumentClient();

export const handler = async (): Promise<APIGatewayProxyResultV2> => {
  const params = {
    TableName: process.env.DatabaseTable,
  };
  try {
    const data = await documentClient.scan(params).promise();
    return JSON.stringify(data);
  } catch (err) {
    return JSON.stringify(err);
  }
};
