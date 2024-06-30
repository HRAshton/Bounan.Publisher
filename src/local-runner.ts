/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { videoHandler } from './video-handler';
import { scenesHandler } from './scenes-handler';

export interface RawVideoPayload {
    MyAnimeListId: number;
    Dub: string;

    Episode: number;
    MessageId: number;
    Scenes?: {
        Opening?: { Start: number; End: number };
        Ending?: { Start: number; End: number };
        SceneAfterEnding?: { Start: number; End: number };
    }
}

export interface RawScenesPayload {
    Items: {
        MyAnimeListId: number;
        Dub: string;
        Episode: number;

        Scenes?: {
            Opening?: { Start: number; End: number };
            Ending?: { Start: number; End: number };
            SceneAfterEnding?: { Start: number; End: number };
        }
    }[];
}

const ep = async (message: RawVideoPayload) => {
    console.log('Processing message: ', message);

    await videoHandler(
        // @ts-ignore
        { Records: [{ Sns: { Message: JSON.stringify(message) } }] },
        null as any,
        () => null);

    console.log('Message processed');
}

const sc = async (message: RawScenesPayload) => {
    console.log('Processing message: ', message);

    await scenesHandler(
        // @ts-ignore
        { Records: [{ Sns: { Message: JSON.stringify(message) } }] },
        null as any,
        () => null);

    console.log('Message processed');
}

const main = async () => {
    const myAnimeListId = 1;

    await ep({
        MyAnimeListId: myAnimeListId,
        Dub: 'AniLibria.TV',
        Episode: 1,
        MessageId: 63,
        Scenes: {
            Opening: { Start: 90, End: 180 },
            Ending: { Start: 300, End: 320 },
            SceneAfterEnding: { Start: 320, End: 400 },
        }
    });

    await ep({
        MyAnimeListId: myAnimeListId,
        Dub: 'AniLibria.TV',
        Episode: 3,
        MessageId: 63,
        Scenes: {
            Opening: { Start: 90, End: 180 },
            Ending: { Start: 300, End: 320 },
        }
    });

    await ep({
        MyAnimeListId: myAnimeListId,
        Dub: 'AniLibria.TV',
        Episode: 4,
        MessageId: 63,
    });

    await ep({
        MyAnimeListId: myAnimeListId,
        Dub: 'AniLibria.TV',
        Episode: 2,
        MessageId: 63,
        Scenes: {
            Ending: { Start: 300, End: 320 },
            SceneAfterEnding: { Start: 320, End: 400 },
        }
    });

    await ep({
        MyAnimeListId: myAnimeListId,
        Dub: 'AniLibria.TV',
        Episode: 1,
        MessageId: 63,
        Scenes: {
            Ending: { Start: 300, End: 320 },
            SceneAfterEnding: { Start: 320, End: 400 },
        }
    });

    await sc({
        Items: [
            {
                MyAnimeListId: myAnimeListId,
                Dub: 'AniLibria.TV',
                Episode: 1,
                Scenes: {
                    Opening: { Start: 0, End: 50 },
                    Ending: { Start: 300, End: 320 },
                    SceneAfterEnding: { Start: 320, End: 400 },
                }
            },
            {
                MyAnimeListId: myAnimeListId,
                Dub: 'AniLibria.TV',
                Episode: 2,
                Scenes: {
                    Opening: { Start: 0, End: 50 },
                    Ending: { Start: 1, End: 320 },
                    SceneAfterEnding: { Start: 20, End: 400 },
                }
            },
        ],
    });
}

main();
