import {
  RemovalPolicy,
  Duration,
  Stack,
  StackProps,
  CfnOutput,
} from "aws-cdk-lib";
import {
  AttributeType,
  BillingMode,
  Table,
  StreamViewType,
} from "aws-cdk-lib/aws-dynamodb";
import { Architecture, StartingPosition } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import {
  SqsEventSource,
  DynamoEventSource,
} from "aws-cdk-lib/aws-lambda-event-sources";

import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";
import {
  CorsHttpMethod,
  HttpApi,
  HttpMethod,
} from "@aws-cdk/aws-apigatewayv2-alpha";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import * as sqs from "aws-cdk-lib/aws-sqs";
import { CDKContext } from "../shared/types";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as lambda from "aws-cdk-lib/aws-lambda";

export class EventDrivenServerlessStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: StackProps,
    context: CDKContext
  ) {
    super(scope, id, props);

    const table = new Table(this, "NotesTable", {
      billingMode: BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "ID", type: AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY,
      sortKey: { name: "created", type: AttributeType.STRING },
      tableName: "FestivalsTable",
      stream: StreamViewType.NEW_IMAGE,
    });

    const queue = new sqs.Queue(this, "MySqsQueue");

    const imagesBucket = new s3.Bucket(this, "images", {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const thumbnailImagesBucket = new s3.Bucket(this, "thumbnail-images", {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const sharpLayer = new lambda.LayerVersion(this, "sharp-layer", {
      compatibleRuntimes: [
        lambda.Runtime.NODEJS_12_X,
        lambda.Runtime.NODEJS_14_X,
      ],
      code: lambda.Code.fromAsset("layers/sharp-utils"),
      description: "Uses a 3rd party library called sharp",
    });

    const eventSource = new SqsEventSource(queue);

    // const lambdaRole = new aws_iam.Role(this, 'QueueConsumerFunctionRole', {
    //   assumedBy: new aws_iam.ServicePrincipal('lambda.amazonaws.com'),
    //   managedPolicies: [aws_iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaSQSQueueExecutionRole'),
    //                     aws_iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')]
    // });

    const readFunction = new NodejsFunction(this, "ReadNotesFn", {
      architecture: Architecture.ARM_64,
      // runtime: lambda.Runtime.NODEJS_12_X,
      // handler: 'app.handler',
      timeout: Duration.seconds(3),
      memorySize: 128,
      entry: `${__dirname}/fns/readFunction.ts`,
      environment: {
        DatabaseTable: table.tableName,
      },
      // role: lambdaRole,
      logRetention: RetentionDays.ONE_WEEK,
    });

    // Translate review report retrieved from the SQS.
    const readQueueFunction = new NodejsFunction(this, "ReadQueueFn", {
      architecture: Architecture.ARM_64,
      // runtime: lambda.Runtime.NODEJS_12_X,
      // handler: 'app.handler',
      timeout: Duration.seconds(3),
      memorySize: 128,
      entry: `${__dirname}/fns/readQueueFunction.ts`,
      logRetention: RetentionDays.ONE_WEEK,
    });

    const writeImageFunction = new NodejsFunction(this, "WriteImageFn", {
      architecture: Architecture.ARM_64,
      // runtime: lambda.Runtime.NODEJS_12_X,
      // handler: 'app.handler',
      timeout: Duration.seconds(3),
      memorySize: 128,
      entry: `${__dirname}/fns/writeImageFunction.ts`,
      environment: {
        bucketName: imagesBucket.bucketName,
      },
      // role: lambdaRole,
      logRetention: RetentionDays.ONE_WEEK,
    });

    const resizeImageFunction = new NodejsFunction(this, "ResizeImageFn", {
      // architecture: Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_14_X,
      // handler: 'app.handler',
      timeout: Duration.seconds(5),
      memorySize: 128,
      entry: `${__dirname}/fns/imageResizeFunction.ts`,
      environment: {
        bucketName: thumbnailImagesBucket.bucketName,
      },
      // role: lambdaRole,
      logRetention: RetentionDays.ONE_WEEK,
      bundling: {
        minify: false,
        // 👇 don't bundle `yup` layer
        // layers are already available in the lambda env
        externalModules: ["aws-sdk", "sharp"],
      },
      layers: [sharpLayer],
    });

    // Save review to DDB and push it to SQS
    const writeFunction = new NodejsFunction(this, "WriteNoteFn", {
      architecture: Architecture.ARM_64,
      entry: `${__dirname}/fns/writeFunction.ts`,
      environment: {
        DatabaseTable: table.tableName,
        SQSqueueURL: queue.queueUrl,
      },
      logRetention: RetentionDays.ONE_WEEK,
    });

    // Triggered when record added to DDB
    const readDDBStreamFunction = new NodejsFunction(this, "ReadDDBStreamFn", {
      architecture: Architecture.ARM_64,
      entry: `${__dirname}/fns/readDDBStreamFunction.ts`,
      environment: {
        DatabaseTable: table.tableName,
      },
      logRetention: RetentionDays.ONE_WEEK,
    });

    queue.grantSendMessages(writeFunction);
    queue.grantConsumeMessages(readQueueFunction);

    readQueueFunction.addEventSource(eventSource);
    readDDBStreamFunction.addEventSource(
      new DynamoEventSource(table, {
        startingPosition: StartingPosition.LATEST,
      })
    );

    readQueueFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: ["*"],
        actions: ["translate:TranslateText"],
      })
    );

    readDDBStreamFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: ["*"],
        actions: ["translate:TranslateText"],
      })
    );
    
    writeFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: ["*"],
        actions: ["comprehend:*"],
      })
    );

    imagesBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(resizeImageFunction),
      // 👇 only invoke lambda if object matches the filter
      { prefix: "images/", suffix: ".png" }
    );

    imagesBucket.grantWrite(writeImageFunction);
    imagesBucket.grantRead(resizeImageFunction);
    thumbnailImagesBucket.grantWrite(resizeImageFunction);
    table.grantReadData(readFunction);
    table.grantWriteData(writeFunction);

    const api = new HttpApi(this, "NotesApi", {
      corsPreflight: {
        allowHeaders: ["Content-Type"],
        allowMethods: [CorsHttpMethod.GET, CorsHttpMethod.POST],
        allowOrigins: ["*"],
      },
    });

    const readIntegration = new HttpLambdaIntegration(
      "ReadIntegration",
      readFunction
    );

    const writeIntegration = new HttpLambdaIntegration(
      "WriteIntegration",
      writeFunction
    );

    const writeImageIntegration = new HttpLambdaIntegration(
      "WriteImageIntegration",
      writeImageFunction
    );

    api.addRoutes({
      integration: readIntegration,
      methods: [HttpMethod.GET],
      path: "/notes",
    });

    api.addRoutes({
      integration: writeIntegration,
      methods: [HttpMethod.POST],
      path: "/notes",
    });

    api.addRoutes({
      integration: writeImageIntegration,
      methods: [HttpMethod.POST],
      path: "/images",
    });

    new CfnOutput(this, "HttpApiUrl", { value: api.apiEndpoint });
  }
}
