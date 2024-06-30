/* eslint-disable @typescript-eslint/no-explicit-any */

import { KeysToCamelCase, toCamelCase } from '../../utils/object-transformer';
import {
    SceneRecognisedNotification as RawSceneRecognisedNotification,
    SceneRecognisedNotificationItem as RawSceneRecognisedNotificationItem,
} from '../../common/ts-generated';

export type SceneRecognisedNotification = KeysToCamelCase<RawSceneRecognisedNotification>;
export type SceneRecognisedNotificationItem = KeysToCamelCase<RawSceneRecognisedNotificationItem>;

export const fromJson = (jsonText: string): KeysToCamelCase<RawSceneRecognisedNotification> => {
    const json = JSON.parse(jsonText);
    const result = toCamelCase(json);

    if (!result) {
        throw new Error('Invalid JSON: ' + result);
    }

    if (!Array.isArray(result.items)) {
        throw new Error('Invalid Items: ' + result);
    }

    for (const item of result.items) {
        if (!Number.isInteger(item.myAnimeListId)) {
            throw new Error('Invalid MyAnimeListId: ' + item);
        }

        if (typeof item.dub !== 'string' || item.dub.length === 0) {
            throw new Error('Invalid Dub: ' + item);
        }

        if (!Number.isInteger(item.episode)) {
            throw new Error('Invalid Episode: ' + item);
        }

        if (!item.scenes) {
            throw new Error('Invalid Scenes: ' + item);
        }

        for (const scene of Object.values(item.scenes) as any[]) {
            if (scene && (!Number.isFinite(scene.start) || !Number.isFinite(scene.end))) {
                throw new Error('Invalid Scene: ' + JSON.stringify(item));
            }
        }
    }

    return result as KeysToCamelCase<SceneRecognisedNotification>;
}