VPC
Step Function
SNS
Dynamo Event
Cognito

-------aws commands -----------------
Create a Cognito user with a temporary password
 $ aws cognito-idp  admin-create-user --user-pool-id eu-west-1_94tyBHlCd --username demouser --temporary-password 1Q2w3e4r%

Change user's password and make it permenant
 $ aws cognito-idp  admin-set-user-password --user-pool-id eu-west-1_94tyBHlCd --username demouser --password 1q2w3e4r%T --permanent

Generate an auth token for the user
 $ aws cognito-idp  initiate-auth --region eu-west-1 --auth-flow USER_PASSWORD_AUTH --client-id vlgrahdq8ji8a5f45oik504p --auth-parameters USERNAME=demouser,PASSWORD=1q2w3e4r%T

============
Save festival request.

In Postman:
1. Enter the correct URL for the API endpoint.
2. Select the body tab and add the JSON body of the POST request.
3. Select the Authorization tab, choose the Bearer Token option, and paste the token generated from AWS CLI command above.

Sample body:
{
    "artist": "Kylie",
    "city": "Cork",
    "venue": "venue",
    "title": "Reunion"
}
=============
Get Festivals request.
In Postman, set two query  string parameters:
+ artist, e.g. Kylie
+ returnAttributes, e.g. city,title

and set Bearer token.
Sample body:
 {
    "concertID": "5421268",
    "language": "en",
    "review": "the best ever because I said so and that's final.",
    "author": "Joe Bloggs"
  }

---------------------------------------------------------------
Lambda
    event source mapping - polling, batches - DynamoDB, SQS
    asyncronous - event queue - S3 SNS 

    when handler invoked async, and it performs an async task, then it must return a promise so that Lambda runtime receives the response/error from the function.

