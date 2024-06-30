import { Context } from 'node:vm';
import { SNSEvent, SNSHandler } from 'aws-lambda';
import { fromJson } from './models/notifications/video-downloaded-notification';
import { processNewEpisode } from './services/message-processing-service';
import { client_setClientToken } from 'telegram-bot-api-lightweight-client/src/core';
import { config } from './config/config';

client_setClientToken(config.telegram.token);

const processMessage = async (message: string): Promise<void> => {
    console.log('Processing message: ', message);

    const publishingRequest = fromJson(message);
    await processNewEpisode(publishingRequest);

    console.log('Message processed');
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const videoHandler: SNSHandler = async (event: SNSEvent, context: Context): Promise<void> => {
    for (const record of event.Records) {
        await processMessage(record.Sns.Message);
    }

    console.info('done');
};
