import { VideoDownloadedNotification } from "../models/notifications/video-downloaded-notification";
import { getPublishedAnime, insertAnime, upsertEpisodes } from "../database/repository";
import { PublishedAnimeEntity } from "../database/entities/published-anime-entity";
import { publishAnime, publishEpisode } from "../telegram/telegram-service";
import { getAnimeInfo } from "../shikimori-client/shikimori-client";

const addAnime = async (publishingRequest: VideoDownloadedNotification): Promise<void> => {
    const animeInfo = await getAnimeInfo(publishingRequest.myAnimeListId);
    console.log("Got anime info");

    const messageInfo = await publishAnime(publishingRequest, animeInfo);
    console.log("Published anime with message: ", messageInfo);

    await insertAnime(
        publishingRequest,
        messageInfo.threadId,
        messageInfo.headerMessageInfo,
        publishingRequest.episode,
        messageInfo.episodeMessageInfo);
    console.log("Anime added to database");
};

const addEpisode = async (
    publishingRequest: VideoDownloadedNotification,
    publishedAnime: PublishedAnimeEntity,
): Promise<void> => {
    const animeInfo = await getAnimeInfo(publishingRequest.myAnimeListId);
    console.log("Got anime info");

    const messageInfos = await publishEpisode(publishingRequest, animeInfo, publishedAnime);
    console.log("Published episode with message: ", messageInfos);

    const newEpisodes = Object.fromEntries(messageInfos.map(x => [x.episode, x]));
    await upsertEpisodes(publishedAnime, newEpisodes);
    console.log("Anime updated in database");
};

export const processNewEpisode = async (publishingRequest: VideoDownloadedNotification): Promise<void> => {
    const anime = await getPublishedAnime(publishingRequest);

    const animeExists = !!anime;
    const episodeExists = animeExists && Object.keys(anime.episodes).map(Number).includes(publishingRequest.episode);

    if (episodeExists) {
        console.log("Episode already published, skipping");
    } else if (!animeExists) {
        console.log("Anime not found in database, adding");
        await addAnime(publishingRequest);
    } else {
        console.log("Anime found in database, updating");
        await addEpisode(publishingRequest, anime);
    }
};