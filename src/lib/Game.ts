import { OBSColors } from "../enum/obsColors.enum";
import { OBSSourceNames } from "../enum/obsSourceNames.enum";
import { Possesions } from "../enum/possessions";
import { Teams } from "../enum/teams";
import { config } from "../server";
import { phase } from "../types/statsnscore/phase";
import Config from "./Config";
import { GameObject } from "../types/GameObject";
import Logger from "./Logger";
import OBSConnector from "./ObsConnector";
import StatsnScore from "./StatsnScore";
import { lastPlayBuffer } from "../types/lastPlayBuffer";

const log = new Logger("Game");

/**
 * The Game object holds all information for a game
 */
export default class Game {
  game: GameObject;
  connector: OBSConnector;
  lastPlay: lastPlayBuffer;
  playClock: NodeJS.Timer | undefined;
  gameClock: NodeJS.Timer | undefined;
  lastTimeout: "home" | "away";
  statsnscore: StatsnScore;

  constructor() {
    this.game = {
      points: {
        home: 0,
        away: 0,
      },
      time: {
        gameRendered: "12:00",
        gameMiliSeconds: 12 * 60 * 1000,
        play: 40,
      },
      timeouts: {
        home: 3,
        homeRendered: "___",
        away: 3,
        awayRendered: "___",
      },
      quarter: 1,
      quarterOrdinal: "1st",
      down: 1,
      downOrdinal: "1st",
      distance: "10",
      ball_on: 50,
      possession: -1,
    };
    const config = new Config().config;
    this.connector = new OBSConnector(
      `ws://${config.obs.host || "localhost"}:${config.obs.port || 4455}`
    );
    this.lastPlay = {
      team: Teams.HOME,
      playType: "none",
    };
    this.lastTimeout = "home";
    this.statsnscore = new StatsnScore();
  }

  /**
   * Syncs the current game object to statsnscore
   */
  private async syncToStatsnScore() {
    const [minutesRemaining, secondsRemaining] =
      this.game.time.gameRendered.split(":");

    const gameSeconds =
      Number(minutesRemaining) * 60 + Number(secondsRemaining);
    log.info(this.game.quarter);
    await this.statsnscore.quarter(this.game.quarterOrdinal as phase);
    await this.statsnscore.gameclock(gameSeconds);
    await this.statsnscore.playclock(this.game.time.play);
    await this.statsnscore.down(this.game.down);
    await this.statsnscore.distance(Number(this.game.distance));
    await this.statsnscore.points({
      home: this.game.points.home,
      away: this.game.points.away,
    });
    await this.statsnscore.timeoutsRemaining({
      home: this.game.timeouts.home,
      away: this.game.timeouts.away,
    });
    await this.statsnscore.los(
      this.game.ball_on,
      this.game.ball_on < 0 ? Teams.HOME : Teams.AWAY
    );
    await this.statsnscore.possession(
      this.game.ball_on < 0 ? Teams.HOME : Teams.AWAY
    );
  }

  /**
   * Renders the current game state to OBS
   */
  private async renderObs() {
    try {
      if (config.obs.enable) {
        await this.connector.setText(
          OBSSourceNames.POINTS_HOME,
          String(this.game.points["home"])
        );
        await this.connector.setText(
          OBSSourceNames.POINTS_AWAY,
          String(this.game.points["away"])
        );
        await this.connector.setText(
          OBSSourceNames.GAME_CLOCK,
          this.game.time.gameRendered
        );
        if (this.game.time.play <= 5) {
          await this.connector.setTextColor(
            OBSSourceNames.PLAY_CLOCK,
            OBSColors.RED
          );
        } else {
          await this.connector.setTextColor(
            OBSSourceNames.PLAY_CLOCK,
            OBSColors.BRAND_BLUE
          );
        }
        await this.connector.getSourceProperties(OBSSourceNames.PLAY_CLOCK);
        await this.connector.setText(
          OBSSourceNames.PLAY_CLOCK,
          String(this.game.time.play)
        );
        await this.connector.setText(
          OBSSourceNames.QUARTER,
          this.game.quarterOrdinal
        );
        await this.connector.setText(
          OBSSourceNames.DOWN_DISTANCE,
          `${this.game.downOrdinal} & ${this.game.distance}`
        );
        await this.connector.setText(
          OBSSourceNames.TIMEOUTS_HOME,
          this.game.timeouts.homeRendered ?? ""
        );
        await this.connector.setText(
          OBSSourceNames.TIMEOUTS_AWAY,
          this.game.timeouts.awayRendered ?? ""
        );
        switch (Number(this.game.possession)) {
          case Possesions.NONE:
            await this.connector.hideSource(OBSSourceNames.POSSESSION_HOME);
            await this.connector.hideSource(OBSSourceNames.POSSESSION_AWAY);
            break;
          case Possesions.HOME:
            await this.connector.hideSource(OBSSourceNames.POSSESSION_AWAY);
            await this.connector.showSource(OBSSourceNames.POSSESSION_HOME);
            break;
          case Possesions.AWAY:
            await this.connector.hideSource(OBSSourceNames.POSSESSION_HOME);
            await this.connector.showSource(OBSSourceNames.POSSESSION_AWAY);
            break;
        }
      }
    } catch (e) {
      log.error(`OBS write failed: ${e}`);
    }
  }

  /**
   * Writes the game object to OBS
   */
  public async write() {
    try {
      await this.syncToStatsnScore();
      await this.renderObs();
    } catch (e) {
      log.error(`Unexpected Error while trying to write game state: ${e}`);
    }
  }

  /**
   * Renders the quarter number to a ordinal number
   */
  public renderQuarter() {
    switch (this.game.quarter) {
      case 1:
        this.game.quarterOrdinal = "1st";
        break;
      case 2:
        this.game.quarterOrdinal = "2nd";
        break;
      case 3:
        this.game.quarterOrdinal = "3rd";
        break;
      case 4:
        this.game.quarterOrdinal = "4th";
        break;
    }
  }

  /**
   * Set a down
   * @param down Down number
   */
  public async setDown(down: number) {
    this.game.down = down;
    switch (down) {
      case 1:
        this.game.downOrdinal = "1st";
        break;
      case 2:
        this.game.downOrdinal = "2nd";
        break;
      case 3:
        this.game.downOrdinal = "3rd";
        break;
      case 4:
        this.game.downOrdinal = "4th";
        break;
    }
    try {
      await this.write();
    } catch (e) {
      log.error(`Unexpected error trying to write down: ${e}`);
    }
  }

  /**
   * Renders the timeouts for OBS
   */
  public renderTimeouts() {
    this.game.timeouts.awayRendered = "_ "
      .repeat(this.game.timeouts.away)
      .slice(0, -1);
    this.game.timeouts.homeRendered = "_ "
      .repeat(this.game.timeouts.home)
      .slice(0, -1);
  }

  /**
   * Renders the game clock for display
   */
  public renderGameClock() {
    this.game.time.gameRendered = new Date(this.game.time.gameMiliSeconds ?? 0)
      .toISOString()
      .slice(14, 19);
  }
}
