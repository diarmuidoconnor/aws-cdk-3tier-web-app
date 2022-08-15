import { SQSHandler } from "aws-lambda";
const AWS = require("aws-sdk");
const comprehend = new AWS.Comprehend();

//    Supported languages at https://docs.aws.amazon.com/translate/latest/dg/what-is-languages.html

export const handler: SQSHandler = async (event) => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      for (const record of event.Records) {
        const body = JSON.parse(record.body);
        const message = JSON.parse(body.Message);
        let comprehendParams = {
          LanguageCode: null,
          Text: message.review,
        };
        let dominantLanguage: any = await comprehend
          .detectDominantLanguage(comprehendParams)
          .promise();
        comprehendParams.LanguageCode =
          dominantLanguage.Languages[0].LanguageCode;

        let sentiment = await comprehend
          .detectSentiment(comprehendParams)
          .promise();
        console.log(" language ", JSON.stringify(sentiment, null, 3));
      }
      resolve();
    } catch (error) {
      console.log(JSON.stringify(error));
      reject();
    }
  });
};
