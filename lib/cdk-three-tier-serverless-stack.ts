import { RemovalPolicy, Duration, Stack, StackProps, CfnOutput } from 'aws-cdk-lib';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Architecture } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import {
  CorsHttpMethod,
  HttpApi,
  HttpMethod,
} from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { CDKContext } from '../shared/types';
export class CdkThreeTierServerlessStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps, context: CDKContext ) {
    super(scope, id, props);

    const table = new Table(this, 'NotesTable', {
      billingMode: BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: 'ID', type: AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY,
      sortKey: { name: 'created', type: AttributeType.STRING },
      tableName: 'NotesTable',
    });

    const queue = new sqs.Queue(this, 'MySqsQueue');

    const eventSource = new SqsEventSource(queue)

    // const lambdaRole = new aws_iam.Role(this, 'QueueConsumerFunctionRole', {
    //   assumedBy: new aws_iam.ServicePrincipal('lambda.amazonaws.com'),
    //   managedPolicies: [aws_iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaSQSQueueExecutionRole'), 
    //                     aws_iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')]
    // });

    const readFunction = new NodejsFunction(this, 'ReadNotesFn', {
      architecture: Architecture.ARM_64,
      // runtime: lambda.Runtime.NODEJS_12_X,
      // handler: 'app.handler',
      timeout: Duration.seconds(3),
      memorySize: 128,
      entry: `${__dirname}/fns/readFunction.ts`,
      environment: {
        DatabaseTable: table.tableName
      },
      // role: lambdaRole,
      logRetention: RetentionDays.ONE_WEEK,
    });

    const readQueueFunction = new NodejsFunction(this, 'ReadQueueFn', {
      architecture: Architecture.ARM_64,
      // runtime: lambda.Runtime.NODEJS_12_X,
      // handler: 'app.handler',
      timeout: Duration.seconds(3),
      memorySize: 128,
      entry: `${__dirname}/fns/readQueueFunction.ts`,
      logRetention: RetentionDays.ONE_WEEK,
    });

    const writeFunction = new NodejsFunction(this, 'WriteNoteFn', {
      architecture: Architecture.ARM_64,
      entry: `${__dirname}/fns/writeFunction.ts`,
      environment: {
        DatabaseTable: table.tableName,
        SQSqueueURL: queue.queueUrl
      },
      logRetention: RetentionDays.ONE_WEEK,
    });

    queue.grantSendMessages(writeFunction)
    queue.grantConsumeMessages(readQueueFunction)

    readQueueFunction.addEventSource(eventSource)
    // writeFunction.addToRolePolicy(new aws_iam.PolicyStatement({
    //   effect: aws_iam.Effect.ALLOW,
    //   resources: [queue.queueArn],
    //   actions: ["*"],
    // }))   
     
    table.grantReadData(readFunction);
    table.grantWriteData(writeFunction);

    const api = new HttpApi(this, 'NotesApi', {
      corsPreflight: {
        allowHeaders: ['Content-Type'],
        allowMethods: [CorsHttpMethod.GET, CorsHttpMethod.POST],
        allowOrigins: ['*'],
      },
    });

    const readIntegration = new HttpLambdaIntegration(
      'ReadIntegration',
      readFunction
    );

    const writeIntegration = new HttpLambdaIntegration(
      'WriteIntegration',
      writeFunction
    );

    api.addRoutes({
      integration: readIntegration,
      methods: [HttpMethod.GET],
      path: '/notes',
    });

    api.addRoutes({
      integration: writeIntegration,
      methods: [HttpMethod.POST],
      path: '/notes',
    });
    new CfnOutput(this, 'HttpApiUrl', { value: api.apiEndpoint });

  }
}