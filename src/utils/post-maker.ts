import { ShikiAnimeInfo } from '../api-clients/shikimori/shiki-anime-info';
import { secToTime } from './sec-to-time';
import { SceneRecognisedNotificationItem } from '../common/ts/interfaces';
import { KeysToCamelCase } from './object-transformer';

const escapeLinks = (text: string): string => {
    return text.replaceAll('.', '');
}

export const createTextForTopicName = (animeInfo: ShikiAnimeInfo, dub: string): string => {
    return [
        animeInfo.russian || animeInfo.name,
        dub,
        animeInfo.aired_on?.substring(0, 4),
    ]
        .filter(Boolean)
        .join(' | ');
}

export const createTextForHeaderPost = (animeInfo: ShikiAnimeInfo, dub: string): string => {
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
        dub && `В озвучке ${escapeLinks(dub)}`,
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
    publishingRequest: KeysToCamelCase<SceneRecognisedNotificationItem>,
): string => {
    return [
        `<b>${animeInfo.russian || animeInfo.name}</b> ${publishingRequest.videoKey.dub && `(${escapeLinks(publishingRequest.videoKey.dub)})`}`,
        animeInfo.episodes && animeInfo.episodes > 1 && `Серия ${publishingRequest.videoKey.episode}`,

        publishingRequest.scenes?.opening
        && `${secToTime(publishingRequest.scenes.opening.end)} - Конец опенинга (от ${secToTime(publishingRequest.scenes.opening.start)})`,

        publishingRequest.scenes?.sceneAfterEnding
        && `${secToTime(publishingRequest.scenes.sceneAfterEnding.start)} - Сцена-после-титров`,
    ]
        .filter(Boolean)
        .join('\n');
}