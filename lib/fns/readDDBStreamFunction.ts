import { RecordSet } from "aws-cdk-lib/aws-route53";
import type {} from "aws-lambda";
const AWS = require("aws-sdk");

const documentClient = new AWS.DynamoDB.DocumentClient();
const translate = new AWS.Translate();

export const handler = async (event: any) => {
  // var params = {
  //     TableName : process.env.DatabaseTable,
  //     Key: {
  //       HashKey: 'hashkey'
  //     }
  //   };
  for (const record of event.Records) {
    if (record.eventName == "INSERT") {
      console.log("Review :", record.dynamodb.NewImage.review.S);
      const params = {
        SourceLanguageCode: "en" /* required */,
        TargetLanguageCode: "fr" /* required */,
        Text: record.dynamodb.NewImage.review.S /* required */,
      };
      const translatedMessage = await translate.translateText(params).promise();

      console.log("Translation is " + JSON.stringify(translatedMessage));
    }
  }
};
