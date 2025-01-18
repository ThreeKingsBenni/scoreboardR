import { OBSColors } from "../enum/obsColors.enum";
import { OBSSourceNames } from "../enum/obsSourceNames.enum";
import { Possesions } from "../enum/possessions";
import { Teams } from "../enum/statsandscore/teams";
import { phase } from "../types/statsnscore/phase";
import Config from "./Config";
import Logger from "./Logger";
import OBSConnector from "./ObsConnector";
import StatsnScore from "./StatsnScore";

type GameObject = {
  points: {
    [x: string]: number;
    home: number;
    away: number;
  };
  time: {
    gameRendered: string;
    gameMiliSeconds: number;
    play: number;
  };
  timeouts: {
    home: number;
    homeRendered: string;
    away: number;
    awayRendered: string;
  };
  quarter: number;
  quarterOrdinal: string;
  down: number;
  downOrdinal: string;
  distance: string;
  ball_on: number;
  possession: -1 | 0 | 1;
};

type lastPlayBuffer = {
  team: keyof GameObject["points"];
  playType: keyof typeof playTypeScores;
};

const log = new Logger("Game");

export const playTypeScores = {
  touchdown: 6,
  fieldgoal: 3,
  safety: 2,
  pat: 1,
  twopoint: 2,
  none: 0,
};

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
      `ws://${config.obsHost || "localhost"}:${config.obsPort || 4455}`
    );
    this.lastPlay = {
      team: "home",
      playType: "none",
    };
    this.lastTimeout = "home";
    this.statsnscore = new StatsnScore();
  }

  private async syncToStatsnScore() {
    const gameSeconds = this.game.time.gameMiliSeconds / 100;
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

  public async write() {
    try {
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
      await this.syncToStatsnScore();
      return;
    } catch (e) {
      log.error(`Unexpected Error while trying to write game state: ${e}`);
    }
  }

  public async score(
    team: keyof GameObject["points"],
    playType: keyof typeof playTypeScores
  ) {
    this.game.points[team] += playTypeScores[playType];
    this.lastPlay = {
      team: team,
      playType: playType,
    };
    try {
      await this.write();
      return;
    } catch (e) {
      log.error(`Unexpected error trying to write new score: ${e}`);
    }
  }

  public async undoScore() {
    this.game.points[this.lastPlay.team] -=
      playTypeScores[this.lastPlay.playType];
    try {
      await this.write();
      return;
    } catch (e) {
      log.error(`Unexpected error trying to undo score: ${e}`);
    }
  }

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

  public async quarterChange() {
    if (this.game.quarter < 4) {
      this.game.quarter++;
    } else {
      this.game.quarter = 1;
    }

    this.renderQuarter();

    try {
      await this.write();
      return;
    } catch (e) {
      log.error(`Unexpected error trying to write new quarter change: ${e}`);
    }
  }

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
      return;
    } catch (e) {
      log.error(`Unexpected error trying to write down: ${e}`);
    }
  }

  public async setDistance(distance: string) {
    this.game.distance = distance;
    try {
      await this.write();
      return;
    } catch (e) {
      log.error(`Unexpected error trying to write new distance: ${e}`);
    }
  }

  public async startPlayClock() {
    this.playClock = setInterval(async () => {
      this.game.time.play--;
      try {
        await this.write();
        return;
      } catch (e) {
        log.error(`Unexpected error trying to write new playclock state: ${e}`);
      }
    }, 100);
  }

  public async pausePlayClock() {
    clearInterval(this.playClock);
  }

  public async resetPlayClock() {
    this.game.time.play = 40;
    try {
      await this.write();
      return;
    } catch (e) {
      log.error(`Unexpected error trying to reset play clock: ${e}`);
    }
  }

  public renderTimeouts() {
    this.game.timeouts.awayRendered = "_ "
      .repeat(this.game.timeouts.away)
      .slice(0, -1);
    this.game.timeouts.homeRendered = "_ "
      .repeat(this.game.timeouts.home)
      .slice(0, -1);
  }

  public async removeTimeout(team: "home" | "away") {
    if (this.game.timeouts[team] > 0) this.game.timeouts[team]--;
    this.lastTimeout = team;
    this.renderTimeouts();
    try {
      await this.write();
      return;
    } catch (e) {
      log.error(`Unexpected error trying to remove a timeout: ${e}`);
    }
  }

  public async undoTimeout() {
    if (this.game.timeouts[this.lastTimeout] < 3)
      this.game.timeouts[this.lastTimeout]++;
    this.renderTimeouts();
    try {
      await this.write();
      return;
    } catch (e) {
      log.error(`Unexpected error trying to undo a timeout: ${e}`);
    }
  }

  public renderGameClock() {
    this.game.time.gameRendered = new Date(this.game.time.gameMiliSeconds ?? 0)
      .toISOString()
      .slice(14, 19);
  }

  public async startGameClock() {
    this.gameClock = setInterval(async () => {
      if (this.game.time.gameMiliSeconds)
        this.game.time.gameMiliSeconds -= 1000;
      this.renderGameClock();
      try {
        await this.write();
      } catch (e) {
        log.error(`Unexpected error trying to start the game clock: ${e}`);
      }
    }, 1000);
  }

  public pauseGameClock() {
    clearInterval(this.gameClock);
  }

  public async resetGameClock() {
    this.game.time.gameMiliSeconds = 12 * 60 * 1000;
    this.renderGameClock();
    try {
      await this.write();
    } catch (e) {
      log.error(`Unexpected error trying to reset the game clock: ${e}`);
    }
  }
}
