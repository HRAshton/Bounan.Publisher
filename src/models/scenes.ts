import { Interval } from './interval';

export interface Scenes {
    opening?: Interval<number>;
    ending?: Interval<number>;
    sceneAfterEnding?: Interval<number>;
}
