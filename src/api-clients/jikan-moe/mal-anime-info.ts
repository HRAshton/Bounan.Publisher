export interface AnimeImages {
    /**
     * Available images in JPG
     */
    jpg?: {
        /**
         * Image URL JPG
         */
        image_url?: string | null;
        /**
         * Small Image URL JPG
         */
        small_image_url?: string | null;
        /**
         * Image URL JPG
         */
        large_image_url?: string | null;
    };
    /**
     * Available images in WEBP
     */
    webp?: {
        /**
         * Image URL WEBP
         */
        image_url?: string | null;
        /**
         * Small Image URL WEBP
         */
        small_image_url?: string | null;
        /**
         * Image URL WEBP
         */
        large_image_url?: string | null;
    };
}

export interface Title {
    /**
     * Title type
     */
    type?: string;
    /**
     * Title value
     */
    title?: string;
}

/**
 * Parsed URL Data
 */
export interface MalUrl {
    /**
     * MyAnimeList ID
     */
    mal_id?: number;
    /**
     * Type of resource
     */
    type?: string;
    /**
     * Resource Name/Title
     */
    name?: string;
    /**
     * MyAnimeList URL
     */
    url?: string;
}

/**
 * Youtube Details
 */
export interface TrailerBase {
    /**
     * YouTube ID
     */
    youtube_id?: string | null;
    /**
     * YouTube URL
     */
    url?: string | null;
    /**
     * Parsed Embed URL
     */
    embed_url?: string | null;
}

/**
 * Date range
 */
export interface DateRange {
    /**
     * Date ISO8601
     */
    from?: string | null;
    /**
     * Date ISO8601
     */
    to?: string | null;
    /**
     * Date Prop
     */
    prop?: {
        /**
         * Date Prop From
         */
        from?: {
            /**
             * Day
             */
            day?: number | null;
            /**
             * Month
             */
            month?: number | null;
            /**
             * Year
             */
            year?: number | null;
        };
        /**
         * Date Prop To
         */
        to?: {
            /**
             * Day
             */
            day?: number | null;
            /**
             * Month
             */
            month?: number | null;
            /**
             * Year
             */
            year?: number | null;
        };
        /**
         * Raw parsed string
         */
        string?: string | null;
    };
}

/**
 * Broadcast Details
 */
export interface Broadcast {
    /**
     * Day of the week
     */
    day?: string | null;
    /**
     * Time in 24-hour format
     */
    time?: string | null;
    /**
     * Timezone (Tz Database format https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)
     */
    timezone?: string | null;
    /**
     * Raw parsed broadcast string
     */
    string?: string | null;
}

export interface MalAnimeInfo {
    /**
     * MyAnimeList ID
     */
    mal_id?: number;
    /**
     * MyAnimeList URL
     */
    url?: string;
    images?: AnimeImages;
    trailer?: TrailerBase;
    /**
     * Whether the entry is pending approval on MAL or not
     */
    approved?: boolean;
    /**
     * All titles
     */
    titles?: Array<Title>;
    /**
     * Title
     * @deprecated
     */
    title?: string;
    /**
     * English Title
     * @deprecated
     */
    title_english?: string | null;
    /**
     * Japanese Title
     * @deprecated
     */
    title_japanese?: string | null;
    /**
     * Other Titles
     * @deprecated
     */
    title_synonyms?: Array<(string)>;
    /**
     * Anime Type
     */
    type?: 'TV' | 'OVA' | 'Movie' | 'Special' | 'ONA' | 'Music' | null;
    /**
     * Original Material/Source adapted from
     */
    source?: string | null;
    /**
     * Episode count
     */
    episodes?: number | null;
    /**
     * Airing status
     */
    status?: 'Finished Airing' | 'Currently Airing' | 'Not yet aired' | null;
    /**
     * Airing boolean
     */
    airing?: boolean;
    aired?: DateRange;
    /**
     * Parsed raw duration
     */
    duration?: string | null;
    /**
     * Anime audience rating
     */
    rating?: 'G - All Ages' | 'PG - Children' | 'PG-13 - Teens 13 or older' | 'R - 17+ (violence & profanity)' | 'R+ - Mild Nudity' | 'Rx - Hentai' | null;
    /**
     * Score
     */
    score?: number | null;
    /**
     * Number of users
     */
    scored_by?: number | null;
    /**
     * Ranking
     */
    rank?: number | null;
    /**
     * Popularity
     */
    popularity?: number | null;
    /**
     * Number of users who have added this entry to their list
     */
    members?: number | null;
    /**
     * Number of users who have favorited this entry
     */
    favorites?: number | null;
    /**
     * Synopsis
     */
    synopsis?: string | null;
    /**
     * Background
     */
    background?: string | null;
    /**
     * Season
     */
    season?: 'summer' | 'winter' | 'spring' | 'fall' | null;
    /**
     * Year
     */
    year?: number | null;
    broadcast?: Broadcast;
    producers?: Array<MalUrl>;
    licensors?: Array<MalUrl>;
    studios?: Array<MalUrl>;
    genres?: Array<MalUrl>;
    explicit_genres?: Array<MalUrl>;
    themes?: Array<MalUrl>;
    demographics?: Array<MalUrl>;
}