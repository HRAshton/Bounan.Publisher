import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as cloudwatchActions from "aws-cdk-lib/aws-cloudwatch-actions";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as logs from "aws-cdk-lib/aws-logs";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subscriptions from "aws-cdk-lib/aws-sns-subscriptions";
import { Construct } from 'constructs';
import { CfnOutput, Duration, Stack as AwsStack, StackProps } from 'aws-cdk-lib';
import { LlrtFunction } from "cdk-lambda-llrt";
import { config } from "./config";

export class Stack extends AwsStack {
    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        const table = this.createDatabase();

        const errorsLogGroup = this.createLogGroup();
        this.SetErrorsAlarm(errorsLogGroup);

        const lambdaVideo = this.createVideoLambda(table, errorsLogGroup);
        table.grantReadWriteData(lambdaVideo);
        this.AttachDownloadedSnsEvent(lambdaVideo);

        const scenesLambda = this.createScenesLambda(table, errorsLogGroup);
        table.grantReadWriteData(scenesLambda);
        this.AttachRecognisedSnsEvent(scenesLambda);

        this.out('config', config);
        this.out('tableName', table.tableName);
    }

    private createDatabase(): dynamodb.Table {
        return new dynamodb.Table(this, 'Table', {
            partitionKey: { name: 'AnimeKey', type: dynamodb.AttributeType.STRING },
        });
    }

    private createLogGroup(): logs.LogGroup {
        return new logs.LogGroup(this, 'LogGroup', {
            retention: logs.RetentionDays.ONE_WEEK,
        });
    }

    private SetErrorsAlarm(logGroup: logs.ILogGroup): void {
        const metricFilter = logGroup.addMetricFilter('ErrorMetric', {
            metricNamespace: this.stackName,
            metricName: 'ErrorCount',
            filterPattern: { logPatternString: 'ERROR' },
            metricValue: '1',
        });

        const metric = metricFilter.metric({ period: Duration.minutes(1) });

        const alarm = new cloudwatch.Alarm(this, 'Alarm', {
            metric: metric,
            threshold: 1,
            evaluationPeriods: 1,
            comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        });

        const topic = new sns.Topic(this, 'ErrorsAlarmTopic');
        topic.addSubscription(new subscriptions.EmailSubscription(config.errorAlarmEmail));
        alarm.addAlarmAction(new cloudwatchActions.SnsAction(topic));
    }

    private createVideoLambda(table: dynamodb.Table, errorsLogGroup: logs.LogGroup): lambda.Function {
        return new LlrtFunction(this, 'VideoLambdaFunction', {
            entry: 'app/video-handler.ts',
            handler: 'videoHandler',
            logGroup: errorsLogGroup,
            environment: this.getEnvVars(table),
            timeout: Duration.seconds(30),
        });
    }

    private createScenesLambda(table: dynamodb.Table, errorsLogGroup: logs.LogGroup): lambda.Function {
        return new LlrtFunction(this, 'ScenesLambdaFunction', {
            entry: 'app/scenes-handler.ts',
            handler: 'scenesHandler',
            logGroup: errorsLogGroup,
            environment: this.getEnvVars(table),
            timeout: Duration.seconds(30),
        });
    }

    private AttachDownloadedSnsEvent(lambda: lambda.Function): void {
        const topic = sns.Topic.fromTopicArn(this, 'VideoDownloadedTopic', config.videoDownloadedTopicArn);
        lambda.addEventSource(new lambdaEventSources.SnsEventSource(topic));
    }

    private AttachRecognisedSnsEvent(lambda: lambda.Function): void {
        const topic = sns.Topic.fromTopicArn(this, 'SceneRecognisedTopic', config.sceneRecognisedTopicArn);
        lambda.addEventSource(new lambdaEventSources.SnsEventSource(topic));  // TODO: Filter
    }

    private getEnvVars(table: dynamodb.Table): { [key: string]: string } {
        return {
            DATABASE_TABLE_NAME: table.tableName,
            TELEGRAM_TOKEN: config.telegramToken,
            TELEGRAM_SOURCE_CHANNEL_ID: config.telegramSourceChannelId,
            TELEGRAM_TARGET_GROUP_ID: config.telegramTargetGroupId,
            RETRIES_MAX: config.retriesMax,
            RETRIES_DELAY_MS: config.retriesDelayMs,
        };
    }

    private out(name: string, value: any): void {
        new CfnOutput(this, name, { value: JSON.stringify(value) });
    }
}
