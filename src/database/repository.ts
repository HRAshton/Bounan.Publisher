import { AnimeKey } from "../models/anime-key";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { PublishedAnimeEntity, RegisteredAnimeEntity } from "./entities/published-anime-entity";
import { config } from "../config/config";
import { EpisodeMessageInfoEntity } from "./entities/episode-message-info-entity";
import { HeaderMessageInfoEntity } from "./entities/header-message-info-entity";
import { AnimeLockedError } from "../errors/anime-locked-error";

const dynamoDbClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(dynamoDbClient);

const getTableKey = (animeKey: AnimeKey): string => {
    return `${animeKey.myAnimeListId}#${animeKey.dub}`;
}

const lock = async (key: AnimeKey): Promise<void> => {
    await docClient.send(new UpdateCommand({
        TableName: config.database.tableName,
        Key: { AnimeKey: getTableKey(key) },
        ConditionExpression: "attribute_exists(AnimeKey) AND attribute_not_exists(Locked)",
        UpdateExpression: "SET Locked = :locked",
        ExpressionAttributeValues: {
            ":locked": true,
        },
    }));
}

export const unlock = async (key: AnimeKey): Promise<void> => {
    await docClient.send(new UpdateCommand({
        TableName: config.database.tableName,
        Key: { AnimeKey: getTableKey(key) },
        ConditionExpression: "attribute_exists(AnimeKey) AND Locked = :locked",
        UpdateExpression: "REMOVE Locked",
        ExpressionAttributeValues: {
            ":locked": true,
        },
    }));
}

export const getOrRegisterAnimeAndLock = async (
    key: AnimeKey,
): Promise<PublishedAnimeEntity | RegisteredAnimeEntity> => {
    const command = new GetCommand({
        TableName: config.database.tableName,
        Key: { AnimeKey: getTableKey(key) },
    });

    const response = await docClient.send(command);
    if (response.Item) {
        if (response.Item.Locked) {
            throw new AnimeLockedError("Anime is locked");
        }

        await lock(key);
        return response.Item as PublishedAnimeEntity;
    }

    const anime: RegisteredAnimeEntity = {
        myAnimeListId: key.myAnimeListId,
        dub: key.dub,
        updatedAt: new Date().toISOString(),
    };

    await docClient.send(new PutCommand({
        TableName: config.database.tableName,
        Item: {
            ...anime,
            AnimeKey: getTableKey(key),
            Locked: true,
        },
        ConditionExpression: "attribute_not_exists(AnimeKey)",
    }));

    return anime;
}

export const setHeaderAndFirstEpisodeUnlock = async (
    anime: AnimeKey,
    threadId: number,
    headerPostInfo: HeaderMessageInfoEntity,
    episode: number,
    episodePostInfo: EpisodeMessageInfoEntity,
): Promise<void> => {
    const command = new UpdateCommand({
        TableName: config.database.tableName,
        Key: { AnimeKey: getTableKey(anime) },
        ConditionExpression: "attribute_exists(AnimeKey)",
        UpdateExpression: "SET threadId = :threadId, headerPost = :headerPost, episodes = :episodes, updatedAt = :updatedAt REMOVE Locked",
        ExpressionAttributeValues: {
            ":threadId": threadId,
            ":headerPost": headerPostInfo,
            ":episodes": {
                [episode]: episodePostInfo,
            },
            ":updatedAt": new Date().toISOString(),
        },
    });

    await docClient.send(command);
}

export const upsertEpisodesAndUnlock = async (
    originalValue: PublishedAnimeEntity,
    newEpisodes: { [episode: number]: EpisodeMessageInfoEntity },
): Promise<void> => {
    const command = new UpdateCommand({
        TableName: config.database.tableName,
        Key: { AnimeKey: getTableKey(originalValue) },
        ConditionExpression: "attribute_exists(AnimeKey)",
        UpdateExpression: "SET #episodes = :episodes, updatedAt = :updatedAt REMOVE Locked",
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