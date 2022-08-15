import { RecordSet } from "aws-cdk-lib/aws-route53";
import type { DynamoDBStreamHandler } from "aws-lambda";

const AWS = require("aws-sdk");
const sns = new AWS.SNS();

export const handler: DynamoDBStreamHandler = async (event) => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      console.log("event : ", JSON.stringify(event));
      for (const record of event.Records) {
        if (record.eventName == "INSERT") {
          const message = {
            review: record.dynamodb?.NewImage?.review.S,
            ID: record.dynamodb?.NewImage?.ID.S,
            language: record.dynamodb?.NewImage?.language.S,
          };
          if (message.review) {
            const params = {
              Message: JSON.stringify(message),
              Subject: "New Concert Review",
              TopicArn: process.env.SNS_ARN,
            };
            await sns.publish(params).promise();
          }
        }
        resolve();
      }
    } catch (error) {
      console.log(JSON.stringify(error));
      reject();
    }
  });
};
