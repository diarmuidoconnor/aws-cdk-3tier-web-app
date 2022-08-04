VPC
Step Function
SNS
Dynamo Event
Cognito

-------aws commands -----------------
 $ aws cognito-idp  admin-create-user --user-pool-id eu-west-1_94tyBHlCd --username demouser --temporary-password 1Q2w3e4r%

 $ aws cognito-idp  admin-set-user-password --user-pool-id eu-west-1_94tyBHlCd --username demouser --password 1q2w3e4r%T --permanent


 $ aws cognito-idp  initiate-auth --region eu-west-1 --auth-flow USER_PASSWORD_AUTH --client-id vlgrahdq8ji8a5f45oik504p --auth-parameters USERNAME=demouser,PASSWORD=1q2w3e4r%T

--------------------
Lambda
    event source mapping - polling, batches - DynamoDB, SQS
    asyncronous - event queue - S3 SNS 

    when handler invoked async, and it performs an async task, then it must return a promise so that Lambda runtime receives the response/error from the function.