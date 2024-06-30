import { VideoDownloadedNotification } from '../models/notifications/video-downloaded-notification';
import {
    getOrRegisterAnimeAndLock,
    setHeaderAndFirstEpisodeUnlock, unlock,
    upsertEpisodesAndUnlock,
} from '../database/repository';
import { PublishedAnimeEntity } from '../database/entities/published-anime-entity';
import { publishAnime, publishEpisode } from '../telegram/telegram-service';
import { getAnimeInfo } from '../shikimori-client/shikimori-client';
import { config } from '../config/config';
import { AnimeLockedError } from '../errors/anime-locked-error';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';

// Creates a new topic for the anime, publishes the header message and the first episode
const createTopic = async (publishingRequest: Required<VideoDownloadedNotification>): Promise<void> => {
    const animeInfo = await getAnimeInfo(publishingRequest.myAnimeListId);
    console.log('Got anime info');

    const publishingResult = await publishAnime(publishingRequest, animeInfo);
    console.log('Published anime with message: ', publishingResult);

    await setHeaderAndFirstEpisodeUnlock(
        publishingRequest,
        publishingResult.threadId,
        publishingResult.headerMessageInfo,
        publishingRequest.episode,
        publishingResult.episodeMessageInfo);
    console.log(`Anime topic created with message: ${publishingResult}`);
};

// Publishes a new episode for the anime
const addEpisode = async (
    publishingRequest: Required<VideoDownloadedNotification>,
    publishedAnime: PublishedAnimeEntity,
): Promise<void> => {
    const animeInfo = await getAnimeInfo(publishingRequest.myAnimeListId);
    console.log('Got anime info');

    const messageInfos = await publishEpisode(publishingRequest, animeInfo, publishedAnime);
    console.log('Published episode with message: ', messageInfos);

    const newEpisodes = Object.fromEntries(messageInfos.map(x => [x.episode, x]));
    await upsertEpisodesAndUnlock(publishedAnime, newEpisodes);
    console.log('Anime updated in database');
};

const tryProcessNewEpisode = async (publishingRequest: Required<VideoDownloadedNotification>): Promise<void> => {
    const anime = await getOrRegisterAnimeAndLock(publishingRequest);

    const topicExists = 'threadId' in anime;
    const episodeExists = topicExists && !!anime.episodes?.[publishingRequest.episode];

    if (episodeExists) {
        console.log('Episode already published, skipping');
        await unlock(anime);
    } else if (!topicExists) {
        console.log('The topic was not found in the database, adding');
        await createTopic(publishingRequest);
    } else {
        console.log('The topic was found in the database, adding episode');
        await addEpisode(publishingRequest, anime);
    }
};

export const processNewEpisode = async (publishingRequest: VideoDownloadedNotification): Promise<void> => {
    if (!publishingRequest.messageId) {
        console.warn('MessageId is not set, skipping');
        return;
    }

    let totalRetries = 0;
    while (totalRetries < config.retries.max) {
        try {
            return await tryProcessNewEpisode(publishingRequest as Required<VideoDownloadedNotification>);
        } catch (e: unknown) {
            if (!(e instanceof AnimeLockedError || e instanceof ConditionalCheckFailedException)) {
                await unlock(publishingRequest);
            }

            if (totalRetries === config.retries.max - 1) {
                console.error('Failed to process anime, no retries left', e);
                throw e;
            }

            console.warn('Failed to process anime, retrying', e);
            totalRetries++;

            const timeout = totalRetries * config.retries.delayMs + Math.random() * 1000;
            await new Promise(resolve => setTimeout(resolve, timeout));
        }
    }

    throw new Error('Unexpected error');
};