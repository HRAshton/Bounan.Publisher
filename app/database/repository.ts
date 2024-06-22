import { AnimeKey } from "../models/anime-key";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { PublishedAnimeEntity } from "./entities/published-anime-entity";
import { config } from "../config/config";
import { EpisodeMessageInfoEntity } from "./entities/episode-message-info-entity";
import { HeaderMessageInfoEntity } from "./entities/header-message-info-entity";

const dynamoDbClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(dynamoDbClient);

const getTableKey = (animeKey: AnimeKey): string => {
    return `${animeKey.myAnimeListId}#${animeKey.dub}`;
}

export const getPublishedAnime = async (key: AnimeKey): Promise<PublishedAnimeEntity | undefined> => {
    const command = new GetCommand({
        TableName: config.database.tableName,
        Key: {
            AnimeKey: getTableKey(key),
        },
    });

    const response = await docClient.send(command);

    return response.Item as PublishedAnimeEntity | undefined;
}

export const insertAnime = async (
    anime: AnimeKey,
    threadId: number,
    headerPostInfo: HeaderMessageInfoEntity,
    episode: number,
    episodePostInfo: EpisodeMessageInfoEntity,
): Promise<void> => {
    const command = new PutCommand({
        TableName: config.database.tableName,
        Item: {
            AnimeKey: getTableKey(anime),
            myAnimeListId: anime.myAnimeListId,
            dub: anime.dub,
            threadId,
            headerPost: headerPostInfo,
            episodes: {
                [episode]: episodePostInfo,
            },
            updatedAt: new Date().toISOString(),
        } as PublishedAnimeEntity,
        ConditionExpression: "attribute_not_exists(AnimeKey)",
    });

    await docClient.send(command);
}

export const upsertEpisodes = async (
    originalValue: PublishedAnimeEntity,
    newEpisodes: { [episode: number]: EpisodeMessageInfoEntity },
): Promise<void> => {
    const command = new UpdateCommand({
        TableName: config.database.tableName,
        Key: {
            AnimeKey: getTableKey(originalValue),
        },
        ConditionExpression: "attribute_exists(AnimeKey)",
        UpdateExpression: "SET #episodes = :episodes, updatedAt = :updatedAt",
        ExpressionAttributeNames: {
            "#episodes": "episodes",
        },
        ExpressionAttributeValues: {
            ":episodes": {
                ...originalValue.episodes,
                ...newEpisodes,
            },
            ":updatedAt": new Date().toISOString(),
        },
    });

    await docClient.send(command);
}