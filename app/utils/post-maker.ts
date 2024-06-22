import { ShikiAnimeInfo } from "../shikimori-client/shiki-anime-info";
import { secToTime } from "./sec-to-time";
import { ScenesInfo } from "../models/scenes-info";
import { VideoDownloadedNotification } from "../models/notifications/video-downloaded-notification";

const escapeLinks = (text: string): string => {
    return text.replaceAll('.', '');
}

export const createTextForHeaderPost = (
    animeInfo: ShikiAnimeInfo,
    publishingRequest: VideoDownloadedNotification,
): string => {
    const genres = animeInfo.genres
        ?.map(genre => genre.russian)
        .filter(genre => genre)
        .map(genre => `#${genre.replace(/ /g, '_')}`)
        .sort()
        .join(' ');

    const allNamesSet = new Set([animeInfo.name, animeInfo.license_name_ru]);
    animeInfo.english?.forEach(name => allNamesSet.add(name));
    animeInfo.synonyms?.forEach(name => allNamesSet.add(name));
    const otherNames = Array.from(allNamesSet).sort().join('; ');

    const hashtag = animeInfo.url
        ?.replace(/^[^-]+-/, '')
        .replaceAll('-', '_');

    return [
        `<b>${animeInfo.russian || animeInfo.name}</b>`,
        publishingRequest.dub && `В озвучке ${escapeLinks(publishingRequest.dub)}`,
        animeInfo.aired_on && `Год выпуска: ${animeInfo.aired_on.substring(0, 4)}`,
        genres && `Жанры: ${genres}`,
        animeInfo.franchise && `Франшиза: #${animeInfo.franchise}`,
        `Другие озвучки: #header_${hashtag}`,
        `<a href="https://shikimori.one/animes/${animeInfo.id}">Shikimori >> </a> | <a href="https://myanimelist.net/anime/${animeInfo.id}">MAL >></a>`,
        otherNames && `Другие названия: ${otherNames}`,
    ]
        .filter(Boolean)
        .join('\n');
}

export const createTextForEpisodePost = (
    animeInfo: ShikiAnimeInfo,
    publishingRequest: ScenesInfo,
): string => {
    return [
        `<b>${animeInfo.russian || animeInfo.name}</b> ${publishingRequest.dub && `(${escapeLinks(publishingRequest.dub)})`}`,
        animeInfo.episodes && animeInfo.episodes > 1 && `Серия ${publishingRequest.episode}`,

        publishingRequest.scenes?.opening
        && `${secToTime(publishingRequest.scenes.opening.end)} - Конец опенинга (от ${secToTime(publishingRequest.scenes.opening.start)})`,

        publishingRequest.scenes?.sceneAfterEnding
        && `${secToTime(publishingRequest.scenes.sceneAfterEnding.start)} - Сцена-после-титров`
    ]
        .filter(Boolean)
        .join('\n');
}