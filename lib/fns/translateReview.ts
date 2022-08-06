import { RecordSet } from "aws-cdk-lib/aws-route53";
import type { DynamoDBStreamHandler } from "aws-lambda";

const AWS = require("aws-sdk");

const documentClient = new AWS.DynamoDB.DocumentClient();
const translate = new AWS.Translate();

export const handler: DynamoDBStreamHandler = async (event) => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      console.log("event : ", JSON.stringify(event))
      // var params = {
      //     TableName : process.env.DatabaseTable,
      //     Key: {
      //       HashKey: 'hashkey'
      //     }
      //   };
      for (const record of event.Records) {
        if (record.eventName == "INSERT") {
          console.log(record)
          const review = record.dynamodb?.NewImage?.review.S;
          if (review) { 
            console.log("Review :", review);
            const params = {
              SourceLanguageCode: "en" /* required */,
              TargetLanguageCode: "fr" /* required */,
              Text: review,
            };
            const translatedMessage = await translate
              .translateText(params)
              .promise();
            console.log("Translation is " + JSON.stringify(translatedMessage));
          }
        }
      }
      resolve()
    } catch (error) {
      console.log(JSON.stringify(error));
      reject();
    }
  });
};
