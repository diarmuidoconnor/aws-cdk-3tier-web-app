import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";

const AWS = require("aws-sdk");

const moment = require("moment");

const documentClient = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS({ apiVersion: "2012-11-05" });
const comprehend = new AWS.Comprehend()

export interface Festival {
  artist: string;
  city: string,
  venue: string,
  review: string;
}

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  if (event.body) {
    const festival = JSON.parse(event.body) as Festival;

    let dbParams = {
      TableName: process.env.DatabaseTable,
      Item: {
        ID: Math.floor(Math.random() * Math.floor(10000000)).toString(),
        created: moment().format("YYYYMMDD-hhmmss"),
        metadata: JSON.stringify(festival),
        artist: festival.artist,
        city: festival.city,
        venue: festival.venue,
        review: festival.review,
      },
    };
    let comprehendParams = {
      LanguageCode: null,
      Text: festival.review
    };
    // console.log('sentimant params ', JSON.stringify(,null,3))
    try {
      // let dominantLanguage : any = await comprehend.detectDominantLanguage(comprehendParams).promise()
      // comprehendParams.LanguageCode = dominantLanguage.Languages[0].LanguageCode
           
      // let sentiment = await comprehend.detectSentiment(comprehendParams).promise()
      
      // console.log(' language ', JSON.stringify(sentiment, null,3) )

      // , function(err : any, data : any) {
      //   if (err) console.log(err, err.stack); // an error occurred
      //   else     console.log(data);           // successful response
      // });
      let data = await documentClient.put(dbParams).promise();
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
    // const result = await sqs.sendMessage(queueParams).promise()
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
