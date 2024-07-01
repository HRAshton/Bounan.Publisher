import { VideoDownloadedNotification } from '../models/notifications/video-downloaded-notification';
import { PublishedAnime } from '../models/published-anime';
import { config } from '../config/config';
import { hashCode } from '../utils/hash';
import { PublishingResult } from './models/publishing-result';
import { EpisodeMessageInfo } from './models/message-info';
import { createTextForEpisodePost, createTextForHeaderPost, createTextForTopicName } from '../utils/post-maker';
import { ShikiAnimeInfo } from '../shikimori-client/shiki-anime-info';
import {
    createForumTopic,
    copyMessages,
    editMessageCaption,
    deleteMessages,
    sendPhoto,
    copyMessage,
} from 'telegram-bot-api-lightweight-client/src/client';
import { SHIKIMORI_BASE_URL } from '../shikimori-client/shikimori-client';
import { PublishedAnimeEntity } from '../database/entities/published-anime-entity';

const reorderEpisodes = async (anime: PublishedAnime, episode: number): Promise<EpisodeMessageInfo[]> => {
    console.log('Reordering episodes for anime: ', anime);

    const episodesToForward = Object.values(anime.episodes)
        .filter(x => x.episode > episode)
        .sort((a, b) => a.episode - b.episode);
    console.log('Episodes to forward: ', episodesToForward);
    if (episodesToForward.length === 0) {
        return [];
    }

    const messagesToForward = episodesToForward.map(x => x.messageId);
    const forwardedMessages = await copyMessages({
        chat_id: config.telegram.targetGroupId,
        from_chat_id: config.telegram.targetGroupId,
        message_ids: messagesToForward,
        message_thread_id: anime.threadId,
        disable_notification: true,
    });
    console.log('Forwarded messages: ', forwardedMessages);

    await deleteMessages({
        chat_id: config.telegram.targetGroupId,
        message_ids: messagesToForward,
    });
    console.log('Deleted messages');

    return episodesToForward.map((episode, index) => ({
        episode: episode.episode,
        messageId: forwardedMessages.result[index].message_id,
        hash: episode.hash,
    }));
}

const sendSingleEpisodeInternal = async (
    publishingRequest: Required<VideoDownloadedNotification>,
    animeInfo: ShikiAnimeInfo,
    threadId: number,
): Promise<EpisodeMessageInfo> => {
    const caption = createTextForEpisodePost(animeInfo, publishingRequest.videoKey);
    const episodeMessage = await copyMessage({
        chat_id: config.telegram.targetGroupId,
        from_chat_id: config.telegram.sourceChannelId,
        message_id: publishingRequest.messageId,
        caption,
        message_thread_id: threadId,
        parse_mode: 'HTML',
    });

    if (!episodeMessage.ok) {
        throw new Error(JSON.stringify(episodeMessage));
    }

    return {
        episode: publishingRequest.videoKey.episode,
        messageId: episodeMessage.result.message_id,
        hash: hashCode(caption),
    };
}

export const publishAnime = async (
    publishingRequest: Required<VideoDownloadedNotification>,
    animeInfo: ShikiAnimeInfo,
): Promise<PublishingResult> => {
    const createdTopic = await createForumTopic({
        chat_id: config.telegram.targetGroupId,
        name: createTextForTopicName(animeInfo, publishingRequest),
    });
    const threadId = createdTopic.result.message_thread_id;
    if (!createdTopic.ok) {
        throw new Error(JSON.stringify(createdTopic));
    }

    // Telegram has a limit of 1024 characters for the caption
    const firstPostText = createTextForHeaderPost(animeInfo, publishingRequest).substring(0, 1024);
    const firstPost = await sendPhoto({
        chat_id: config.telegram.targetGroupId,
        photo: SHIKIMORI_BASE_URL + animeInfo.image.original,
        caption: firstPostText,
        message_thread_id: threadId,
        parse_mode: 'HTML',
    });
    if (!firstPost.ok) {
        throw new Error(JSON.stringify(firstPost));
    }

    const episodeMessageInfo = await sendSingleEpisodeInternal(publishingRequest, animeInfo, threadId);

    return {
        episode: publishingRequest.videoKey.episode,
        threadId: threadId,
        headerMessageInfo: {
            messageId: firstPost.result.message_id,
            hash: hashCode(firstPostText),
        },
        episodeMessageInfo,
    }
}

export const publishEpisode = async (
    publishingRequest: Required<VideoDownloadedNotification>,
    animeInfo: ShikiAnimeInfo,
    anime: PublishedAnime,
): Promise<EpisodeMessageInfo[]> => {
    const episodeMessageInfo = await sendSingleEpisodeInternal(publishingRequest, animeInfo, anime.threadId);
    const forwardedMessages = await reorderEpisodes(anime, publishingRequest.videoKey.episode);

    return [
        episodeMessageInfo,
        ...forwardedMessages,
    ];
}

export const updateEpisodeMessages = async (
    publishedAnime: PublishedAnimeEntity,
    captionsToUpdate: {
        caption: string;
        episode: number;
    }[],
) => {
    console.log('Updating info');

    for (const captionToUpdate of captionsToUpdate) {
        console.log('Updating caption: ', captionToUpdate);
        const episode = publishedAnime.episodes[captionToUpdate.episode];
        console.log('Episode: ', episode);

        const result = await editMessageCaption({
            chat_id: config.telegram.targetGroupId,
            message_id: episode.messageId,
            caption: captionToUpdate.caption,
            parse_mode: 'HTML',
        });
        if (!result.ok) {
            console.error('Failed to update caption', result);
        }
    }

    console.log('Info updated');
}