import { VideoDownloadedNotification } from './models';
import { getAnimeInfo } from '../../api-clients/shikimori/shikimori-client';
import { publishAnime, publishEpisode } from '../../api-clients/telegram/telegram-service';
import { getOrRegisterAnimeAndLock, unlock, upsertEpisodesAndUnlock } from '../../database/repository';
import { setHeader } from './repository';
import { PublishedAnimeEntity } from '../../database/entities/published-anime-entity';
import { config } from '../../config/config';
import { AnimeLockedError } from '../../errors/anime-locked-error';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { ShikiAnimeInfo } from '../../api-clients/shikimori/shiki-anime-info';
import { AnimeKey } from '../../models/anime-key';

const createTopic = async (
    animeInfo: ShikiAnimeInfo,
    animeKey: AnimeKey,
): Promise<Pick<PublishedAnimeEntity, 'threadId' | 'episodes'>> => {
    console.log('The topic was not found in the database, adding');
    const headerPublishingResult = await publishAnime(animeInfo, animeKey.dub);
    console.log('Published anime with message: ', headerPublishingResult);

    await setHeader(animeKey, headerPublishingResult.threadId, headerPublishingResult.headerMessageInfo);
    return {
        threadId: headerPublishingResult.threadId,
        episodes: {},
    };
}

const addEpisode = async (
    publishingRequest: Required<VideoDownloadedNotification>,
    animeInfo: ShikiAnimeInfo,
    threadId: number,
    publishedEpisodes: PublishedAnimeEntity['episodes'],
): Promise<void> => {
    const messageInfos = await publishEpisode(publishingRequest, animeInfo, threadId, publishedEpisodes);
    console.log('Published episode with message: ', messageInfos);

    const newEpisodes = Object.fromEntries(messageInfos.map(x => [x.episode, x]));
    await upsertEpisodesAndUnlock(publishingRequest.videoKey, publishedEpisodes, newEpisodes);
    console.log('Anime updated in database');
};

const tryProcessNewEpisode = async (publishingRequest: Required<VideoDownloadedNotification>): Promise<void> => {
    const anime = await getOrRegisterAnimeAndLock(publishingRequest.videoKey);

    const episodeExists = 'episodes' in anime && !!anime.episodes?.[publishingRequest.videoKey.episode];
    if (episodeExists) {
        console.log('Episode already published, skipping');
        await unlock(anime);
        return;
    }

    const animeInfo = await getAnimeInfo(anime.myAnimeListId);
    console.log('Got anime info');

    const { threadId, episodes } = 'threadId' in anime
        ? anime
        : await createTopic(animeInfo, anime);

    console.log('The topic was found in the database, adding episode');
    const episodeMessageId = await addEpisode(publishingRequest, animeInfo, threadId, episodes);
    console.log('Episode added to the database' + episodeMessageId);


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
                await unlock(publishingRequest.videoKey);
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