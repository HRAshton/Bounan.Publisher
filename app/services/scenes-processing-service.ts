import {
    SceneRecognisedNotification, SceneRecognisedNotificationItem,
} from "../models/notifications/scene-recognised-notification";
import { getPublishedAnime, upsertEpisodes } from "../database/repository";
import { createTextForEpisodePost } from "../utils/post-maker";
import { getAnimeInfo } from "../shikimori-client/shikimori-client";
import { hashCode } from "../utils/hash";
import { updateEpisodeMessages } from "../telegram/telegram-service";
import { EpisodeMessageInfoEntity } from "../database/entities/episode-message-info-entity";

const processAnime = async (notificationItems: SceneRecognisedNotificationItem[]) => {
    const publishedAnime = await getPublishedAnime(notificationItems[0]);
    console.log("Anime retrieved: ", publishedAnime);
    if (!publishedAnime) {
        console.warn("Anime not found in database, skipping");
        return;
    }

    const animeInfo = await getAnimeInfo(publishedAnime.myAnimeListId);
    console.log("Anime info retrieved");

    const newCaptions = notificationItems.map(item => ({
        episode: item.episode,
        caption: createTextForEpisodePost(animeInfo, item),
    }));

    const captionsToUpdate = newCaptions
        .filter(x => !!publishedAnime.episodes[x.episode]
            && publishedAnime.episodes[x.episode].hash !== hashCode(x.caption));
    console.log(`Found ${captionsToUpdate.length} captions to update`);
    if (!captionsToUpdate.length) {
        console.log("No captions to update, skipping");
        return;
    }

    await updateEpisodeMessages(publishedAnime, captionsToUpdate);
    console.log("Captions updated");

    const updatedEpisodes: { [episode: number]: EpisodeMessageInfoEntity } = Object.fromEntries(captionsToUpdate
        .map(x => [x.episode, {
            ...publishedAnime.episodes[x.episode],
            hash: hashCode(x.caption),
        }]));
    await upsertEpisodes(publishedAnime, updatedEpisodes);
    console.log("Episodes upserted");
};

export const processScenes = async (updatingRequests: SceneRecognisedNotification): Promise<void> => {
    console.log("Processing scenes: ", updatingRequests);
    if (!updatingRequests.items.length) {
        console.log("No items to process, skipping");
        return;
    }

    const nonEmptyRequestItems = updatingRequests.items.filter(x => !!x.scenes);
    if (!nonEmptyRequestItems.length) {
        console.log("No scenes to process, skipping");
        return;
    }

    const groupedRequestsItems = nonEmptyRequestItems.reduce((acc, item) => {
        acc[item.myAnimeListId] = acc[`${item.myAnimeListId}_${item.dub}`] || [];
        acc[item.myAnimeListId].push(item);
        return acc;
    }, {} as Record<string, SceneRecognisedNotificationItem[]>);
    console.log("Grouped requests: ", groupedRequestsItems);

    for (const key of Object.keys(groupedRequestsItems)) {
        console.log("Processing key: ", key);
        const items = groupedRequestsItems[key];
        await processAnime(items);
        console.log("Key processed: ", key);
    }

    console.log("Scenes processed");
}