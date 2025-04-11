import { MalAnimeInfo } from './mal-anime-info';

const BASE_URL = 'https://api.jikan.moe/v4';

export const getMalAnimeInfo = async (myAnimeListId: number): Promise<MalAnimeInfo> => {
    const response = await fetch(`${BASE_URL}/anime/${myAnimeListId}`);

    return await response.json();
}