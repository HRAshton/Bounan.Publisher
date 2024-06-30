import { Context } from 'node:vm';
import { SNSEvent, SNSHandler } from 'aws-lambda';
import { processScenes } from './services/scenes-processing-service';
import { client_setClientToken } from 'telegram-bot-api-lightweight-client/src/core';
import { config } from './config/config';
import { fromJson } from './models/notifications/scene-recognised-notification';

client_setClientToken(config.telegram.token);

const processMessage = async (message: string): Promise<void> => {
    console.log('Processing message: ', message);

    const updatingRequest = fromJson(message);
    await processScenes(updatingRequest);

    console.log('Message processed');
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const scenesHandler: SNSHandler = async (event: SNSEvent, context: Context): Promise<void> => {
    console.log('Processing event: ', event);
    for (const record of event.Records) {
        console.log('Processing record: ', record?.Sns?.MessageId);
        await processMessage(record.Sns.Message);
    }

    console.info('done');
};
