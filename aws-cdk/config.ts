﻿import configFile from './configuration.json';

interface Config {
    alertEmail: string;
    telegramToken: string;
    telegramSourceChannelId: string;
    telegramTargetGroupId: string;
    updatePublishingDetailsFunctionName: string;
    videoDownloadedTopicArn: string;
    sceneRecognisedTopicArn: string;
    retriesMax: string;
    retriesDelayMs: string;
}

export const config: Config = configFile;

if (!config.alertEmail) {
    throw new Error('errorAlarmEmail is required');
}
if (!config.telegramToken) {
    throw new Error('telegramToken is required');
}
if (!config.telegramSourceChannelId) {
    throw new Error('telegramSourceChannelId is required');
}
if (!config.telegramTargetGroupId) {
    throw new Error('telegramTargetGroupId is required');
}
if (!config.updatePublishingDetailsFunctionName) {
    throw new Error('updatePublishingDetailsFunctionName is required');
}
if (!config.videoDownloadedTopicArn) {
    throw new Error('videoDownloadedTopicArn is required');
}
if (!config.sceneRecognisedTopicArn) {
    throw new Error('sceneRecognisedTopicArn is required');
}
if (!config.retriesMax) {
    throw new Error('retriesMax is required');
}
if (!config.retriesDelayMs) {
    throw new Error('retriesDelayMs is required');
}