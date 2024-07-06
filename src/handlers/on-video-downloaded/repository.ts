import { AnimeKey } from '../../models/anime-key';
import { HeaderMessageInfoEntity } from '../../database/entities/header-message-info-entity';
import { EpisodeMessageInfoEntity } from '../../database/entities/episode-message-info-entity';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { config } from '../../config/config';
import { docClient, getTableKey } from '../../database/repository';

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
        ConditionExpression: 'attribute_exists(AnimeKey)',
        UpdateExpression: 'SET threadId = :threadId, headerPost = :headerPost, episodes = :episodes, updatedAt = :updatedAt REMOVE Locked',
        ExpressionAttributeValues: {
            ':threadId': threadId,
            ':headerPost': headerPostInfo,
            ':episodes': {
                [episode]: episodePostInfo,
            },
            ':updatedAt': new Date().toISOString(),
        },
    });

    await docClient.send(command);
}
