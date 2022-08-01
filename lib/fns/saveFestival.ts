import { APIGatewayProxyResultV2, APIGatewayProxyHandlerV2 } from 'aws-lambda';
import * as utils from '/opt/utils';
import { addUserSchema, validateAPISchema } from '/opt/schema-definitions';
import { AddConcertBody, Concert } from '../../shared/types';

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  return new Promise<APIGatewayProxyResultV2>(async (resolve, reject) => {
    try {
      // Print Event
      console.log('Event: ', JSON.stringify(event) );

      // Fetch Body from event
      const body: AddConcertBody = event.body ? JSON.parse(event.body) : {};

      // Validate Payload
    //   const validationResult = await validateAPISchema(addUserSchema, body);

    //   if (validationResult.isValid) {
        // Build User DDB Item
        const concert: Concert = {
          ID:  Math.floor(Math.random() * Math.floor(10000000)).toString(),,
          artist: body.artist,
          city: body.city,
          venus: body.venue,
          title: body.title,
        };

        // Write Item to DDB
        if (process.env.DDB_TABLE) await utils.ddbWrite(process.env.DDB_TABLE, user);

        // Return success message
        return resolve(await utils.apiSuccessResponse({ message: 'User added successfully' }));
      } else {
        // Return validation errors
        return resolve(await utils.apiErrorResponse(400, validationResult.errors?.join(',')));
      }
    } catch (error: any) {
      utils.logError(error);
      resolve(await utils.apiErrorResponse(500, error.message || error));
    }
  });
};
