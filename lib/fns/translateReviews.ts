import { SQSHandler } from "aws-lambda";
import {Festival } from './saveReview';
const AWS = require("aws-sdk");

const translate = new AWS.Translate();

export const isFestival = (festival: unknown ): festival is Festival => {
    if (typeof festival === 'object' ) {
       if ( festival !== null && "name" in festival &&  "review" in festival) return true
    }
    return false
  };

export const handler : SQSHandler = async (event )  => {
    for (const record of event.Records ) {
        const festival = JSON.parse(record.body)  as Festival
    //    Supported languages at https://docs.aws.amazon.com/translate/latest/dg/what-is-languages.html
        const params  = {
            SourceLanguageCode: 'en', /* required */
            TargetLanguageCode: 'fr', /* required */
            Text: festival.review, /* required */
        }
        const translatedMessage = await translate.translateText(params).promise() ;

        console.log('Artist is ' + JSON.stringify(translatedMessage))
    }
};
