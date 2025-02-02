import { fetchSsmValue } from '../common/ts/runtime/ssm-client';

export interface Config {
    animan: {
        updatePublishingDetailsFunctionName: string;
    };
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

let cachedConfig: Config | undefined;

export const initConfig = async (): Promise<void> => {
    cachedConfig = await fetchSsmValue('/bounan/publisher/runtime-config') as Config;
}

export const config = {
    get value() {
        if (!cachedConfig) {
            throw new Error('Config not initialized');
        }

        return cachedConfig;
    },
}