/* eslint-disable @typescript-eslint/no-explicit-any */

import {
    SceneRecognisedNotification as RawSceneRecognisedNotification,
    SceneRecognisedNotificationItem as RawSceneRecognisedNotificationItem,
} from '../../common/ts/interfaces';
import { KeysToCamelCase, toCamelCase } from '../../utils/object-transformer';

export type SceneRecognisedNotification = KeysToCamelCase<RawSceneRecognisedNotification>;
export type SceneRecognisedNotificationItem = KeysToCamelCase<RawSceneRecognisedNotificationItem>;

export const fromJson = (jsonText: string): KeysToCamelCase<RawSceneRecognisedNotification> => {
    const json = JSON.parse(jsonText) as unknown as Partial<RawSceneRecognisedNotification> | any;
    const result = toCamelCase(json);

    if (!result) {
        throw new Error('Invalid JSON: ' + JSON.stringify(result));
    }

    if (!Array.isArray(result.items)) {
        throw new Error('Invalid Items: ' + JSON.stringify(result));
    }

    for (const item of result.items) {
        if (!Number.isInteger(item.videoKey.myAnimeListId)) {
            throw new Error('Invalid MyAnimeListId: ' + JSON.stringify(item));
        }

        if (typeof item.videoKey.dub !== 'string' || item.videoKey.dub.length === 0) {
            throw new Error('Invalid Dub: ' + JSON.stringify(item));
        }

        if (!Number.isInteger(item.videoKey.episode)) {
            throw new Error('Invalid Episode: ' + JSON.stringify(item));
        }

        if (!item.scenes) {
            throw new Error('Invalid Scenes: ' + JSON.stringify(item));
        }

        for (const scene of Object.values(item.scenes) as any[]) {
            if (scene && (!Number.isFinite(scene.start) || !Number.isFinite(scene.end))) {
                throw new Error('Invalid Scene: ' + JSON.stringify(item));
            }
        }
    }

    return result as KeysToCamelCase<SceneRecognisedNotification>;
}