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
        intermediateChannelId: string;
        targetGroupId: string;
    };
    database: {
        tableName: string;
    };
    loanApi: {
        token: string;
    };
}

export const config: Config = {
    telegram: {
        token: getEnv("TELEGRAM_TOKEN"),
        sourceChannelId: getEnv("TELEGRAM_SOURCE_CHANNEL_ID"),
        intermediateChannelId: getEnv("TELEGRAM_INTERMEDIATE_CHANNEL_ID"),
        targetGroupId: getEnv("TELEGRAM_TARGET_GROUP_ID"),
    },
    database: {
        tableName: getEnv("DATABASE_TABLE_NAME"),
    },
    loanApi: {
        token: getEnv("LOAN_API_TOKEN"),
    },
}