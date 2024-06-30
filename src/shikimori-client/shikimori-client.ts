import { ShikiAnimeInfo } from "./shiki-anime-info";

export const SHIKIMORI_BASE_URL = `https://shikimori.one`;

export const getAnimeInfo = async (myAnimeListId: number): Promise<ShikiAnimeInfo> => {
    return await fetch(
        `${SHIKIMORI_BASE_URL}/api/animes/${myAnimeListId}`,
        {
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "Bounan.Publisher",
            },
        })
        .then(response => response.json());
}