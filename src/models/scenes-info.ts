import { AnimeKey } from "./anime-key";
import { Scenes } from "./scenes";

export interface ScenesInfo extends AnimeKey {
    episode: number;
    scenes?: Scenes;
}