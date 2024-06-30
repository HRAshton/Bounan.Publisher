import {
    SceneRecognisedNotification, SceneRecognisedNotificationItem,
} from '../models/notifications/scene-recognised-notification';
import { getOrRegisterAnimeAndLock, unlock, upsertEpisodesAndUnlock } from '../database/repository';
import { createTextForEpisodePost } from '../utils/post-maker';
import { getAnimeInfo } from '../shikimori-client/shikimori-client';
import { hashCode } from '../utils/hash';
import { updateEpisodeMessages } from '../telegram/telegram-service';
import { EpisodeMessageInfoEntity } from '../database/entities/episode-message-info-entity';

const processAnime = async (notificationItems: SceneRecognisedNotificationItem[]): Promise<void> => {
    const publishedAnime = await getOrRegisterAnimeAndLock(notificationItems[0].videoKey);
    console.log('Anime retrieved: ', publishedAnime);

    if (!('threadId' in publishedAnime)) {
        console.log('The topic was not found in the database, skipping');
        await unlock(publishedAnime);
        return;
    }

    const animeInfo = await getAnimeInfo(publishedAnime.myAnimeListId);
    console.log('Anime info retrieved');

    const newCaptions = notificationItems.map(item => ({
        episode: item.videoKey.episode,
        caption: createTextForEpisodePost(animeInfo, item.videoKey),
    }));

    const captionsToUpdate = newCaptions
        .filter(x => !!publishedAnime.episodes[x.episode]
            && publishedAnime.episodes[x.episode].hash !== hashCode(x.caption));
    console.log(`Found ${captionsToUpdate.length} captions to update`);
    if (!captionsToUpdate.length) {
        console.log('No captions to update, skipping');
        await unlock(publishedAnime);
        return;
    }

    await updateEpisodeMessages(publishedAnime, captionsToUpdate);
    console.log('Captions updated');

    const updatedEpisodes: { [episode: number]: EpisodeMessageInfoEntity } = Object.fromEntries(captionsToUpdate
        .map(x => [x.episode, {
            ...publishedAnime.episodes[x.episode],
            hash: hashCode(x.caption),
        }]));
    await upsertEpisodesAndUnlock(publishedAnime, updatedEpisodes);
    console.log('Episodes upserted');
};

export const processScenes = async (updatingRequests: SceneRecognisedNotification): Promise<void> => {
    console.log('Processing scenes: ', updatingRequests);
    const items = updatingRequests.items as SceneRecognisedNotificationItem[];
    const nonEmptyRequestItems = items.filter((x: SceneRecognisedNotificationItem) => !!x.scenes);
    if (!nonEmptyRequestItems.length) {
        console.log('No scenes to process, skipping');
        return;
    }

    const requestItemsWithNonEmptyScenes = nonEmptyRequestItems
        .filter((x: SceneRecognisedNotificationItem) => Object.values(x.scenes!).filter(x => !!x).length > 0);
    if (!requestItemsWithNonEmptyScenes.length) {
        console.log('No non-empty scenes to process, skipping');
        return;
    }

    const groupedRequestsItems = nonEmptyRequestItems.reduce(
        (acc: Record<string, SceneRecognisedNotificationItem[]>, item: SceneRecognisedNotificationItem) => {
            const key = `${item.videoKey.myAnimeListId}_${item.videoKey.dub}`;
            acc[key] = acc[key] || [];
            acc[key].push(item);
            return acc;
        },
        {},
    );
    console.log('Grouped requests: ', groupedRequestsItems);

    for (const key of Object.keys(groupedRequestsItems)) {
        console.log('Processing key: ', key);
        const items = groupedRequestsItems[key];
        await processAnime(items);
        console.log('Key processed: ', key);
    }

    console.log('Scenes processed');
}