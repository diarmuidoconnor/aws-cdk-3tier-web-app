import { SQSHandler, SQSRecord } from "aws-lambda";
import {Festival } from './writeFunction';

export const isFestival = (festival: unknown ): festival is Festival => {
    if (typeof festival === 'object' ) {
       if ( festival !== null && "name" in festival &&  "review" in festival) return true

    }
    return false
  };

export const handler : SQSHandler = async (event )  => {
    
    for (const record of event.Records ) {
        const festival = JSON.parse(record.body)  as Festival
        console.log('Artist is ' + festival.name)
    }
};
