import { config } from '../../config/config';
import { PublisherResultRequest, PublisherResultRequestItem } from '../../common/ts/interfaces';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { AnimeKey } from '../../models/anime-key';

const lambdaClient = new LambdaClient({});

export const updatePublishingDetails = async (
    animeKey: AnimeKey,
    threadId: number,
    messageIds: { episode: number; messageId: number }[],
): Promise<void> => {
    if (messageIds.length === 0) {
        console.log('No items to update');
        return;
    }

    const publisherResultRequestItems: PublisherResultRequestItem[] = messageIds.map(item => ({
        VideoKey: {
            MyAnimeListId: animeKey.myAnimeListId,
            Dub: animeKey.dub,
            Episode: item.episode,
        },
        PublishingDetails: {
            ThreadId: threadId,
            MessageId: item.messageId,
        },
    }));

    const request: PublisherResultRequest = { Items: publisherResultRequestItems };
    const message = JSON.stringify(request);
    console.log('Sending request: ', message);

    const result = await lambdaClient.send(new InvokeCommand({
        FunctionName: config.value.animan.updatePublishingDetailsFunctionName,
        Payload: message,
    }));
    console.log('Request sent: ', result);
}