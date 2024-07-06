// process.env.AWS_PROFILE='';
// process.env.DATABASE_TABLE_NAME = '';
// process.env.TELEGRAM_TOKEN = '';
// process.env.TELEGRAM_SOURCE_CHANNEL_ID = '-';
// process.env.TELEGRAM_TARGET_GROUP_ID = '-';
// process.env.RETRIES_MAX = '';
// process.env.RETRIES_DELAY_MS = '';

const getEnv = (key: string): string => {
    const value = process.env[key];

    if (!value) {
        throw new Error(`Missing environment variable: ${key}`);
    }

    return value;
}

export interface Config {
    telegram: {
        token: string;
        sourceChannelId: string;
        targetGroupId: string;
    };
    database: {
        tableName: string;
    };
    retries: {
        max: number;
        delayMs: number;
    };
}

export const config: Config = {
    telegram: {
        token: getEnv('TELEGRAM_TOKEN'),
        sourceChannelId: getEnv('TELEGRAM_SOURCE_CHANNEL_ID'),
        targetGroupId: getEnv('TELEGRAM_TARGET_GROUP_ID'),
    },
    database: {
        tableName: getEnv('DATABASE_TABLE_NAME'),
    },
    retries: {
        max: parseInt(getEnv('RETRIES_MAX')),
        delayMs: parseInt(getEnv('RETRIES_DELAY_MS')),
    },
}