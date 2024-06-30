import { KeysToCamelCase, toCamelCase } from '../../utils/object-transformer';
import { VideoDownloadedNotification as RawVideoDownloadedNotification } from '../../common/ts-generated';

export type VideoDownloadedNotification = KeysToCamelCase<RawVideoDownloadedNotification>;

export const fromJson = (jsonText: string): KeysToCamelCase<VideoDownloadedNotification> => {
    const json = JSON.parse(jsonText) as unknown as Partial<RawVideoDownloadedNotification>;
    const result = toCamelCase(json);

    if (!result) {
        throw new Error('Invalid JSON: ' + result);
    }

    if (!Number.isInteger(result.myAnimeListId)) {
        throw new Error('Invalid MyAnimeListId: ' + result);
    }

    if (typeof result.dub !== 'string' || result.dub.length === 0) {
        throw new Error('Invalid Dub: ' + result);
    }

    if (!Number.isInteger(result.episode)) {
        throw new Error('Invalid Episode: ' + result);
    }

    if (!Number.isInteger(result.messageId)) {
        throw new Error('Invalid MessageId: ' + result);
    }

    return result as KeysToCamelCase<VideoDownloadedNotification>;
}
