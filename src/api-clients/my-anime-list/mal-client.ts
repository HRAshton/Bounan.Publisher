import { config } from '../../config/config';
import { MalAnimeInfo } from './mal-info';

export const MAL_BASE_URL = 'https://api.myanimelist.net/v2';

export const getMalAnimeInfo = async (myAnimeListId: number): Promise<MalAnimeInfo> => {
    const response = await fetch(
        `${MAL_BASE_URL}/anime/${myAnimeListId}?fields=main_picture`,
        {
            headers: {
                'Content-Type': 'application/json',
                'X-MAL-CLIENT-ID': config.value.malApiConfig.token,
            },
        });

    return await response.json();
}