import { EpisodeMessageInfo, HeaderMessageInfo } from "./message-info";

export interface PublishingResult {
    episode: number;
    threadId: number;
    headerMessageInfo: HeaderMessageInfo;
    episodeMessageInfo: EpisodeMessageInfo;
}