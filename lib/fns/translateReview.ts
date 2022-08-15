import { APIGatewayProxyResultV2, SNSHandler, SNSEvent } from "aws-lambda";

const AWS = require("aws-sdk");
const translate = new AWS.Translate();

export const handler  = async (
  event: SNSEvent
): Promise<APIGatewayProxyResultV2> => {
  return new Promise<APIGatewayProxyResultV2>(async (resolve, reject) => {
    try {
      console.log("Event: 👉", JSON.stringify(event, null, 2));
      for (const record of event.Records) {
        const { Message } = record.Sns;
        const reviewRecord = JSON.parse(Message) 
        if (reviewRecord.review ) {
            const params = {
              SourceLanguageCode: reviewRecord.language /* required */,
              TargetLanguageCode: "fr" /* required */,
              Text: reviewRecord.review,
            };
            const translatedMessage = await translate
              .translateText(params)
              .promise();
            console.log("Translation is " + JSON.stringify(translatedMessage));
          }
        }
        return resolve({
          body:  "Translations successful" ,
          statusCode: 200,
        });
      
    } catch (error) {
      console.log(JSON.stringify(error));
      return reject({
        body: JSON.stringify({ error }),
        statusCode: 500,
      });
    }
  });
};
