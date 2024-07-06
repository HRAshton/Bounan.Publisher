﻿import { AnimeKey } from '../../models/anime-key';
import { HeaderMessageInfoEntity } from '../../database/entities/header-message-info-entity';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { config } from '../../config/config';
import { docClient, getTableKey } from '../../database/repository';

export const setHeader = async (
    anime: AnimeKey,
    threadId: number,
    headerPostInfo: HeaderMessageInfoEntity,
): Promise<void> => {
    const command = new UpdateCommand({
        TableName: config.database.tableName,
        Key: { AnimeKey: getTableKey(anime) },
        ConditionExpression: 'attribute_exists(AnimeKey)',
        UpdateExpression: 'SET threadId = :threadId, headerPost = :headerPost, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
            ':threadId': threadId,
            ':headerPost': headerPostInfo,
            ':updatedAt': new Date().toISOString(),
        },
    });

    const result = await docClient.send(command);
    console.log('Header and first episode set', result);
}
