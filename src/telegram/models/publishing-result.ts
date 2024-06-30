import { EpisodeMessageInfo, HeaderMessageInfo } from './message-info';

export interface PublishingResult {
    threadId: number;
    headerMessageInfo: HeaderMessageInfo;
    episode: number;
    episodeMessageInfo: EpisodeMessageInfo;
}