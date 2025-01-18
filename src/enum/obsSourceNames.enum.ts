import Config from "../lib/Config";

const config = new Config().config;

export enum OBSSourceNames {
    POINTS_HOME = "Points Home",
    POINTS_AWAY = "Points Away",
    GAME_CLOCK = "Gameclock",
    PLAY_CLOCK = "Playclock",
    QUARTER = "Quarter",
    DOWN_DISTANCE = "Down&Distance",
    TIMEOUTS_HOME = "Timeouts Home",
    TIMEOUTS_AWAY = "Timeouts Away",
    POSSESSION_HOME = "Possession Home",
    POSSESSION_AWAY = "Possession Away"
}