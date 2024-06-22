import { ScenesInfo } from "../scenes-info";
import { toCamelCase } from "../../utils/object-transformer";

export interface SceneRecognisedNotificationItem extends ScenesInfo {
}

export interface SceneRecognisedNotification {
    items: SceneRecognisedNotificationItem[];
}

export const fromJson = (jsonText: string): SceneRecognisedNotification => {
    const json = JSON.parse(jsonText);
    const result = toCamelCase(json) as unknown as SceneRecognisedNotification;

    if (!result) {
        throw new Error("Invalid JSON: " + result);
    }

    if (!Array.isArray(result.items)) {
        throw new Error("Invalid Items: " + result);
    }

    for (const currItem of result.items) {
        const item: Partial<SceneRecognisedNotificationItem> = currItem;

        if (!Number.isInteger(item.myAnimeListId)) {
            throw new Error("Invalid MyAnimeListId: " + item);
        }

        if (typeof item.dub !== "string" || item.dub.length === 0) {
            throw new Error("Invalid Dub: " + item);
        }

        if (!Number.isInteger(item.episode)) {
            throw new Error("Invalid Episode: " + item);
        }

        if (!item.scenes) {
            throw new Error("Invalid Scenes: " + item);
        }

        for (const scene of Object.values(item.scenes)) {
            if (!scene || !Number.isInteger(scene.start) || !Number.isInteger(scene.end)) {
                throw new Error("Invalid Scene: " + item);
            }
        }
    }

    return result;
}