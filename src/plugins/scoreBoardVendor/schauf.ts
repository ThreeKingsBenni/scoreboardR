import Config from "../../lib/Config";
import Logger from "../../lib/Logger";
import UDPListener from "../../lib/UdpListener";

export interface ScoreboardMessage {
  home: TeamDetails;
  away: TeamDetails;
  quarter: number;
  down: number;
  distance: number;
  ball_on: number;
  possession: -1 | 0 | 1;
  clock: Clock;
}

interface Clock {
  game: string;
  state: 0 | 1;
  play: number;
}

interface TeamDetails {
  points: number;
  timeouts: 1 | 2 | 3;
}

const config = new Config().config;
const log = new Logger("SchaufPlugin");

export default class SchaufListener extends UDPListener {
  constructor() {
    super();
  }

  /**
   * Unpacks and transforms the raw JSON string coming from S-MOTION
   * @param rawUDPmessage Raw UDP message string
   * @returns `ScoreBoardMessage` object after mapping
   */
  private unpackMessage(rawUDPmessage: string): ScoreboardMessage {
    const scoreboardDetails = JSON.parse(rawUDPmessage) as ScoreboardMessage;
    return {
      ...scoreboardDetails,
      home: {
        ...scoreboardDetails.home,
        timeouts: (3 -
          scoreboardDetails.home.timeouts) as TeamDetails["timeouts"],
      },
      away: {
        ...scoreboardDetails.away,
        timeouts: (3 -
          scoreboardDetails.away.timeouts) as TeamDetails["timeouts"],
      },
    };
  }

  /**
   * This method is called by the `listen()` method of the superclass and carries out all the mapping and transformation
   * of the game information coming from the SCHAUF S-MOTION software.
   * @param packet The packet that is received by the UDP socket
   */
  public onMessage(packet: Buffer) {
    const msg = packet.toString();
    log.debug(msg);
    const message = this.unpackMessage(msg);
    this.game.game = {
      ...this.game.game,
      distance: String(message.distance),
      points: { home: message.home.points, away: message.away.points },
      timeouts: {
        ...this.game.game.timeouts,
        home: message.home.timeouts,
        away: message.away.timeouts,
      },
      time: {
        ...this.game.game.time,
        gameRendered: message.clock.game,
        play: message.clock.play,
      },
      quarter: Number(message.quarter),
      ball_on: message.ball_on,
      possession: message.possession,
    };

    this.game.setDown(Number(message.down));
    this.game.renderQuarter();
    this.game.renderTimeouts();
    this.game.write().then(
      () => log.debug("UdpListener/onMessage: sent update to game scoreboard."),
      (error: any) => log.error(`ERROR: UdpListener/onMessage: ${error}`)
    );
  }
}
