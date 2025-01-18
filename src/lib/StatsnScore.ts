import { Axios } from "axios";
import { actions } from "../types/statsnscore/actions";
import { config } from "../server";
import { phase } from "../types/statsnscore/phase";
import { Teams } from "../enum/statsandscore/teams";
import Logger from "./Logger";

const log = new Logger("StatsnScore");

export default class StatsnScore {
  token: string;
  axios: Axios;

  constructor() {
    this.token = this.getToken();
    this.axios = new Axios({ baseURL: config.statsnscore.scoreboardApiUrl });
  }

  private getToken() {
    const token = config.statsnscore.token;
    if (token) return token;
    throw new Error("Token not found");
  }

  private getEndpoint(action: actions, data: any) {
    return `/${action}/${data}`;
  }

  private async send(action: actions, data: Record<string, any> | string) {
    log.info(this.getEndpoint(action, data));
    const result = await this.axios.post(this.getEndpoint(action, data), "", {
      headers: { Token: config.statsnscore.token },
    });
    log.info(`Response from statsnscore: ${result.data}`);
  }

  /**
   * Set the quarter as an ordinal number
   */
  public async quarter(phase: phase) {
    await this.send("setData_quarter", phase);
  }

  /**
   * Update the gameclock
   * @param gameclockSeconds Value of the game clock in seconds
   */
  public async gameclock(gameclockSeconds: number) {
    await this.send("setData_gameclock", String(gameclockSeconds));
  }

  /**
   * Update the playclock
   * @param playclockSeconds Value of the playclock in seconds
   */
  public async playclock(playclockSeconds: number) {
    await this.send("setData_playclock", String(playclockSeconds));
  }

  /**
   * Converts the down number to ordinal and updates
   * @param down Current down as number
   */
  public async down(down: number) {
    function nth(n: number) {
      return ["st", "nd", "rd"][((((n + 90) % 100) - 10) % 10) - 1] || "th";
    }

    const downOrd = nth(down);

    await this.send("setData_down", downOrd);
  }

  /**
   * Update the distance in yards
   * @param distance Sets the distance in yards
   */
  public async distance(distance: number) {
    await this.send("setData_distance", String(distance));
  }

  /**
   * Update the points
   * @param points Object containing the points for home and away team
   */
  public async points(points: { home: number; away: number }) {
    await this.send("setData_homepoints", String(points.home));
    await this.send("setData_guestpoints", String(points.away));
  }

  /**
   * Updates the timeouts
   * @param timeouts Object containing the remaining timeouts for home and away team
   */
  public async timeoutsRemaining(timeouts: { home: number; away: number }) {
    await this.send("setData_hometimeouts", String(timeouts.home));
    await this.send("setData_guesttimeouts", String(timeouts.away));
  }

  /**
   * Updates the Line of scrimmage value
   * @param los Value of the yardage on LOS
   * @param side Value of the Team
   */
  public async los(los: number, side: Teams) {
    await this.send("setData_los", String(los));
    await this.send("setData_losteam", side);
  }

  /**
   * Update the possession
   * @param team Value of the Team
   */
  public async possession(team: Teams) {
    await this.send("setData_ballteam", team);
  }
}
