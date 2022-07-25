VPC
Step Function
SNS
Dynamo Event
Cognito

-------aws commands -----------------
 $ aws cognito-idp  admin-create-user --user-pool-id eu-west-1_94tyBHlCd --username demouser --temporary-password 1Q2w3e4r%

 $ aws cognito-idp  admin-set-user-password --user-pool-id eu-west-1_94tyBHlCd --username demouser --password 1q2w3e4r%T --permanent


 $ aws cognito-idp  initiate-auth --region eu-west-1 --auth-flow USER_PASSWORD_AUTH --client-id vlgrahdq8ji8a5f45oik504p --auth-parameters USERNAME=demouser,PASSWORD=1q2w3e4r%T
