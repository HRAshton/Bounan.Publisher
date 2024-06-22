import { HeaderMessageInfoEntity } from "./header-message-info-entity";
import { EpisodeMessageInfoEntity } from "./episode-message-info-entity";

export interface PublishedAnimeEntity {
    myAnimeListId: number;
    dub: string;
    threadId: number;
    headerPost: HeaderMessageInfoEntity;
    episodes: { [episode: number]: EpisodeMessageInfoEntity };

    updatedAt: string;
}
