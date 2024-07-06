/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { handler as videoHandler } from './handlers/on-video-downloaded/handler';
import { handler as scenesHandler } from './handlers/on-scenes-recognised/handler';
import { SceneRecognisedNotification, VideoDownloadedNotification } from './common/ts/interfaces';

const ep = async (message: VideoDownloadedNotification) => {
    console.log('Processing message: ', message);

    await videoHandler(
        // @ts-ignore
        { Records: [{ Sns: { Message: JSON.stringify(message) } }] },
        null as any);

    console.log('Message processed');
}

const sc = async (message: SceneRecognisedNotification) => {
    console.log('Processing message: ', message);

    await scenesHandler(
        // @ts-ignore
        { Records: [{ Sns: { Message: JSON.stringify(message) } }] },
        null as any);

    console.log('Message processed');
}

const main = async () => {
    const myAnimeListId = 1;

    await ep({
        VideoKey: {
            MyAnimeListId: myAnimeListId,
            Dub: 'AniLibria.TV',
            Episode: 1,
        },
        MessageId: 63,
        Scenes: {
            Opening: { Start: 90, End: 180 },
            Ending: { Start: 300, End: 320 },
            SceneAfterEnding: { Start: 320, End: 400 },
        },
    });

    await ep({
        VideoKey: {
            MyAnimeListId: myAnimeListId,
            Dub: 'AniLibria.TV',
            Episode: 3,
        },
        MessageId: 63,
        Scenes: {
            Opening: { Start: 90, End: 180 },
            Ending: { Start: 300, End: 320 },
        },
    });

    await ep({
        VideoKey: {
            MyAnimeListId: myAnimeListId,
            Dub: 'AniLibria.TV',
            Episode: 4,
        },
        MessageId: 63,
    });

    await ep({
        VideoKey: {
            MyAnimeListId: myAnimeListId,
            Dub: 'AniLibria.TV',
            Episode: 2,
        },
        MessageId: 63,
        Scenes: {
            Ending: { Start: 300, End: 320 },
            SceneAfterEnding: { Start: 320, End: 400 },
        },
    });

    await ep({
        VideoKey: {
            MyAnimeListId: myAnimeListId,
            Dub: 'AniLibria.TV',
            Episode: 1,
        },
        MessageId: 63,
        Scenes: {
            Ending: { Start: 300, End: 320 },
            SceneAfterEnding: { Start: 320, End: 400 },
        },
    });

    await sc({
        Items: [
            {
                VideoKey: {
                    MyAnimeListId: myAnimeListId,
                    Dub: 'AniLibria.TV',
                    Episode: 1,
                },
                Scenes: {
                    Opening: { Start: 0, End: 50 },
                    Ending: { Start: 300, End: 320 },
                    SceneAfterEnding: { Start: 320, End: 400 },
                },
            },
            {
                VideoKey: {
                    MyAnimeListId: myAnimeListId,
                    Dub: 'AniLibria.TV',
                    Episode: 2,
                },
                Scenes: {
                    Opening: { Start: 0, End: 50 },
                    Ending: { Start: 1, End: 320 },
                    SceneAfterEnding: { Start: 20, End: 400 },
                },
            },
        ],
    });
}

main();
