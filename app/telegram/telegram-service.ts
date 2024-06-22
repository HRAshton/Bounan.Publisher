import { VideoDownloadedNotification } from "../models/notifications/video-downloaded-notification";
import { PublishedAnime } from "../models/published-anime";
import { config } from "../config/config";
import { hashCode } from "../utils/hash";
import { PublishingResult } from "./models/publishing-result";
import { EpisodeMessageInfo } from "./models/message-info";
import { createTextForEpisodePost, createTextForHeaderPost } from "../utils/post-maker";
import { ShikiAnimeInfo } from "../shikimori-client/shiki-anime-info";
import {
    createForumTopic,
    copyMessages,
    editMessageCaption,
    deleteMessage,
    deleteMessages,
    forwardMessage,
    sendPhoto,
    sendVideo,
} from "telegram-bot-api-lightweight-client/src/client";
import { SHIKIMORI_BASE_URL } from "../shikimori-client/shikimori-client";
import { PublishedAnimeEntity } from "../database/entities/published-anime-entity";

const reorderEpisodes = async (anime: PublishedAnime, episode: number): Promise<EpisodeMessageInfo[]> => {
    console.log("Reordering episodes for anime: ", anime);

    const episodesToForward = Object.values(anime.episodes)
        .filter(x => x.episode > episode)
        .sort((a, b) => a.episode - b.episode);
    console.log("Episodes to forward: ", episodesToForward);
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
    console.log("Forwarded messages: ", forwardedMessages);

    await deleteMessages({
        chat_id: config.telegram.targetGroupId,
        message_ids: messagesToForward,
    });
    console.log("Deleted messages");

    return episodesToForward.map((episode, index) => ({
        episode: episode.episode,
        messageId: forwardedMessages.result[index].message_id,
        hash: episode.hash,
    }));
}

const getFileIdFromMessage = async (messageId: number): Promise<string> => {
    const message = await forwardMessage({
        chat_id: config.telegram.intermediateChannelId,
        from_chat_id: config.telegram.sourceChannelId,
        message_id: messageId,
    });

    if (!message.result) {
        throw new Error(message.toString());
    }

    await deleteMessage({
        chat_id: config.telegram.intermediateChannelId,
        message_id: message.result.message_id,
    });

    if (!message.result.video) {
        throw new Error('Message is not a video');
    }

    return message.result.video.file_id;
}

const sendSingleEpisodeInternal = async (
    publishingRequest: VideoDownloadedNotification,
    animeInfo: ShikiAnimeInfo,
    threadId: number,
): Promise<EpisodeMessageInfo> => {
    const fileId = await getFileIdFromMessage(publishingRequest.messageId);
    if (!fileId) {
        throw new Error('File id is not found');
    }

    const caption = createTextForEpisodePost(animeInfo, publishingRequest);
    const episodeMessage = await sendVideo({
        chat_id: config.telegram.targetGroupId,
        video: fileId,
        caption,
        message_thread_id: threadId,
        parse_mode: 'HTML',
    });

    return {
        episode: publishingRequest.episode,
        messageId: episodeMessage.result.message_id,
        hash: hashCode(caption),
    };
}

export const publishAnime = async (
    publishingRequest: VideoDownloadedNotification,
    animeInfo: ShikiAnimeInfo,
): Promise<PublishingResult> => {
    const createdTopic = await createForumTopic({
        chat_id: config.telegram.targetGroupId,
        name: [
            animeInfo.russian || animeInfo.name,
            publishingRequest.dub,
            animeInfo.aired_on?.substring(0, 4)
        ]
            .filter(Boolean)
            .join(' | '),
    });
    const threadId = createdTopic.result.message_thread_id;

    const firstPostText = createTextForHeaderPost(animeInfo, publishingRequest);
    const firstPost = await sendPhoto({
        chat_id: config.telegram.targetGroupId,
        photo: SHIKIMORI_BASE_URL + animeInfo.image.original,
        caption: firstPostText,
        message_thread_id: threadId,
        parse_mode: 'HTML',
    });

    const episodeMessageInfo = await sendSingleEpisodeInternal(publishingRequest, animeInfo, threadId);

    return {
        episode: publishingRequest.episode,
        threadId: threadId,
        headerMessageInfo: {
            messageId: firstPost.result.message_id,
            hash: hashCode(firstPostText),
        },
        episodeMessageInfo,
    }
}

export const publishEpisode = async (
    publishingRequest: VideoDownloadedNotification,
    animeInfo: ShikiAnimeInfo,
    anime: PublishedAnime,
): Promise<EpisodeMessageInfo[]> => {
    const episodeMessageInfo = await sendSingleEpisodeInternal(publishingRequest, animeInfo, anime.threadId);
    const forwardedMessages = await reorderEpisodes(anime, publishingRequest.episode);

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
    console.log("Updating info");

    for (const captionToUpdate of captionsToUpdate) {
        console.log("Updating caption: ", captionToUpdate);
        const episode = publishedAnime.episodes[captionToUpdate.episode];
        console.log("Episode: ", episode);

        const result = await editMessageCaption({
            chat_id: config.telegram.targetGroupId,
            message_id: episode.messageId,
            caption: captionToUpdate.caption,
            parse_mode: 'HTML',
        });
        if (!result.ok) {
            console.error(`Failed to update caption: ${result}`);
        }
    }

    console.log("Info updated");
}