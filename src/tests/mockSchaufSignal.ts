import { createSocket, Socket } from "dgram";
import { ScoreboardMessage } from "../plugins/scoreBoardVendor/schauf";
import Logger from "../lib/Logger";
import { randomInt } from "crypto";

const log = new Logger("MockSchaufSignal");

export default class MessageMocker {
  socket: Socket;
  gameclockValue: string;
  playclockValue: number;
  scoreHome: number;
  scoreAway: number;
  timeoutsHome: 1 | 2 | 3;
  timeoutsAway: 1 | 2 | 3;
  down: number;
  distance: number;
  possession: -1 | 0 | 1;
  ball_on: number;
  quarter: number;
  playClock?: NodeJS.Timer;
  gameClock?: NodeJS.Timer;

  constructor() {
    this.socket = createSocket({ reuseAddr: true, type: "udp4" });

    this.gameclockValue = "12:00";
    this.playclockValue = 40;
    this.scoreHome = 0;
    this.scoreAway = 0;
    this.timeoutsHome = 3;
    this.timeoutsAway = 3;
    this.down = 1;
    this.distance = 10;
    this.possession = -1;
    this.ball_on = 0;
    this.quarter = 1;
  }

  private send(message: string) {
    this.socket.send(message, 8999, "localhost");
  }

  public mockMessage() {
    this.runGameClock();
    this.runPlayClock();
    setInterval(() => {
      this.randomizeScores();
      const schaufMessage: ScoreboardMessage = {
        ball_on: this.ball_on,
        distance: this.distance,
        quarter: this.quarter,
        down: this.down,
        possession: this.possession,
        home: { points: this.scoreHome, timeouts: this.timeoutsHome },
        away: { points: this.scoreAway, timeouts: this.timeoutsAway },
        clock: {
          game: this.gameclockValue,
          play: this.playclockValue,
          state: 1,
        },
      };

      log.info(JSON.stringify(schaufMessage));
      this.send(JSON.stringify(schaufMessage));
    }, 1000);
  }

  private randomizeScores() {
    setInterval(() => {
      this.scoreAway = randomInt(0, 60);
      this.scoreHome = randomInt(0, 60);
      this.timeoutsAway = randomInt(1, 3) as 1 | 2 | 3;
      this.timeoutsHome = randomInt(1, 3) as 1 | 2 | 3;
      this.possession = randomInt(-1, 1) as -1 | 0 | 1;
      this.ball_on = randomInt(-50, 50);
      this.distance = randomInt(1, 10);
      this.quarter = randomInt(1, 4);
      this.down = randomInt(1, 4);
    }, 3000);
  }

  private runGameClock() {
    const baseDate = new Date(0, 0, 0, 0, 0, 0, 0);
    this.gameClock = setInterval(() => {
      const mmSSArray = this.gameclockValue.split(":");
      const date = new Date(
        0,
        0,
        0,
        0,
        Number(mmSSArray[0]),
        Number(mmSSArray[1])
      );
      const ms =
        Number(baseDate) - Number(date) != Number(baseDate)
          ? Number(date)
          : Number(baseDate) - Number(date);
      const subtracted = ms - 100;
      this.gameclockValue = new Date(subtracted).toISOString().slice(14, 19);
    }, 1000);
  }

  private runPlayClock() {
    this.playClock = setInterval(() => {
      this.playclockValue =
        this.playclockValue - 1 == 0 ? 40 : this.playclockValue - 1;
    }, 1000);
  }

  private stopPlayClock() {
    clearInterval(this.playClock);
  }

  private stopGameClock() {
    clearInterval(this.gameClock);
  }
}
