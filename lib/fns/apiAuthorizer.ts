
import jwt from 'jsonwebtoken';
import axios from 'axios';
import jwkToPem from 'jwk-to-pem';

// import * as utils from '/opt/utils';
// Types
import { APIAuthorizerEvent, APIAuthValidationResult } from '/opt/types';

export const handler = async (event: APIAuthorizerEvent): Promise<APIAuthValidationResult> => {
  return new Promise(async (resolve, reject) => {
    try {
      // Print event for debugging
      console.log('Event: ', JSON.stringify(event))
      // utils.logInfo(event, 'Event');

      // Extract data from event
      const token = event.headers.authorization;
      const jwtToken = token.replace('Bearer', '').trim();

      // Decode JWT Token
      const decodedJwtToken = jwt.decode(jwtToken, { complete: true });
      if (!decodedJwtToken) {
        return resolve({ isAuthorized: false });
      }
      // utils.logInfo(decodedJwtToken, 'Decoded Token');
      console.log('Decoded token: ', JSON.stringify(decodedJwtToken))

      // Get PEMS based on Allowd Apps
      let jwks: any[] = [];
      const jwksRes = await axios.get(`https://cognito-idp.eu-west-1.amazonaws.com/${process.env.USER_POOL_ID}/.well-known/jwks.json`);
      if (jwksRes.data.keys) {
        jwks = [...jwks, ...jwksRes.data.keys];
      }

      // Find JWK from token in the JWKs list
      const jwk = jwks.find((j) => j.kid === decodedJwtToken.header.kid);
      // utils.logInfo(jwk, 'JWK');
      console.log('JWK: ', JSON.stringify(jwk))

      // Access Denied if PEM not found
      if (!jwk) {
        return resolve({
          isAuthorized: false,
        });
      }

      // Validate Token using PEM
      jwt.verify(jwtToken, jwkToPem(jwk), (err: any) => {
        if (err) {
          console.log('JWT token is invalid');
          return resolve({ isAuthorized: false });
        }
        console.log('JWT token is valid');
        return resolve({
          isAuthorized: true,
        });
      });
    } catch (error) {
      console.error(error);
      return resolve({
        isAuthorized: false,
      });
    }
  });
};
