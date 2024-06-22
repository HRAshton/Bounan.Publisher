import { Scenes } from "../scenes";
import { ScenesInfo } from "../scenes-info";
import { RawVideoPayload } from "./raw-models";
import { toCamelCase } from "../../utils/object-transformer";

export interface VideoDownloadedNotification extends ScenesInfo {
    myAnimeListId: number;
    dub: string;
    episode: number;
    messageId: number;
    scenes?: Scenes;
}

export const fromJson = (jsonText: string): VideoDownloadedNotification => {
    const json = JSON.parse(jsonText);
    const result = toCamelCase(json) as unknown as Partial<VideoDownloadedNotification>;

    if (!result) {
        throw new Error("Invalid JSON: " + result);
    }

    if (!Number.isInteger(result.myAnimeListId)) {
        throw new Error("Invalid MyAnimeListId: " + result);
    }

    if (typeof result.dub !== "string" || result.dub.length === 0) {
        throw new Error("Invalid Dub: " + result);
    }

    if (!Number.isInteger(result.episode)) {
        throw new Error("Invalid Episode: " + result);
    }

    if (!Number.isInteger(result.messageId)) {
        throw new Error("Invalid MessageId: " + result);
    }

    return result as VideoDownloadedNotification;
}
