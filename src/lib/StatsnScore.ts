import { Axios } from "axios";
import { actions } from "../types/statsnscore/actions";
import { config } from "../server";
import { phase } from "../types/statsnscore/phase";
import { Teams } from "../enum/teams";
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

  private getEndpoint(action: actions) {
    return `/${action}`;
  }

  public async send(action: actions, data: Record<string, any> | string) {
    log.debug(this.getEndpoint(action));
    log.debug(JSON.stringify(data));
    try{
      const result = await this.axios.post(this.getEndpoint(action), JSON.stringify(data), {
        headers: { Token: config.statsnscore.token, "Content-Type": "application/json" },
      });
      log.debug(`Response from statsnscore: ${result.data}`);
    }catch(e: any){
      log.error(`Error sending data to StatsnScore: ${e.message}`);
    }
  }

  /**
   * Set the quarter as an ordinal number
   */
  public quarter(phase: phase) {
    return { setData_quarter: phase };
  }

  /**
   * Update the gameclock
   * @param gameclockSeconds Value of the game clock in seconds
   */
  public gameclock(gameclockSeconds: number) {
    return { setData_gameclock: String(gameclockSeconds) };
  }

  /**
   * Update the playclock
   * @param playclockSeconds Value of the playclock in seconds
   */
  public playclock(playclockSeconds: number) {
    return { setData_playclock: String(playclockSeconds) };
  }

  /**
   * Converts the down number to ordinal and updates
   * @param down Current down as number
   */
  public down(down: number) {
    log.debug(`Setting down to ${down}`);
    let downOrd = "";
    switch (down) {
      case 1:
        downOrd = "1st";
        break;
      case 2:
        downOrd = "2nd";
        break;
      case 3:
        downOrd = "3rd";
        break;
      case 4:
        downOrd = "4th";
        break;
    }
    return { "setData_down": downOrd };
  }

  /**
   * Update the distance in yards
   * @param distance Sets the distance in yards
   */
  public distance(distance: number) {
    return { "setData_distance": String(distance) };
  }

  /**
   * Update the points
   * @param points Object containing the points for home and away team
   */
  public points(points: { home: number; away: number }) {
    return { setData_homepoints: String(points.home), setData_guestpoints: String(points.away) };
  }

  /**
   * Updates the timeouts
   * @param timeouts Object containing the remaining timeouts for home and away team
   */
  public timeoutsRemaining(timeouts: { home: number; away: number }) {
    return { setData_hometimeouts: String(timeouts.home), setData_guesttimeouts: String(timeouts.away) };
  }

  /**
   * Updates the Line of scrimmage value
   * @param los Value of the yardage on LOS
   * @param side Value of the Team
   */
  public los(los: number, side: Teams) {
    return { setData_los: String(los), setData_losteam: side };
  }

  /**
   * Update the possession
   * @param team Value of the Team
   */
  public possession(team: Teams) {
    return { setData_ballteam: team };
  }
}
