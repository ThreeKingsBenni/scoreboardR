import express = require("express");
import { createServer, Server as HServer } from "http";
import { Server, WebSocket } from "ws";
import from "./Game";
import Game from "./Game.1";
import Config from "./Config";
import EnsureWs from "../helpers/ensureWs";

export default class WsListener {
  protected wss: Server;
  protected server: HServer;
  game: Game;
  protected ws?: WebSocket;

  constructor() {
    const app = express();
    this.server = createServer(app);
    const server = this.server;
    this.wss = new Server({ server });
    this.game = new Game();
  }

  @EnsureWs
  private sendError(error: unknown) {
    this.ws?.send(String(error));
    return;
  }

  @EnsureWs
  private respondJSON(toJson: any) {
    this.ws?.send(JSON.stringify(toJson));
    return;
  }

  private onConnection(ws: WebSocket) {
    this.ws = ws;
    this.ws.on("message", this.onMessage);
  }

  private onMessage(message: string) {
    console.log(`Recieved: ${JSON.stringify(String(message))}`);
    const [command, details] = String(message).replace("\r\n", "").split(" ");

    switch (command) {
      case "TOUCHDOWN":
      case "SAFETY":
      case "FIELDGOAL":
      case "PAT":
      case "TWOPOINT":
        console.log(`${details} team scored a ${command}`);
        const team: keyof Game["game"]["points"] = details.toLowerCase();
        const playType = command.toLowerCase() as keyof typeof playTypeScores;
        this.game
          .score(team, playType)
          .then(() => this.respondJSON(this.game.game))
          .catch((e: any) => this.sendError(e));
        break;
      case "UNDO":
        this.game
          .undoScore()
          .then(() => this.respondJSON(this.game.game))
          .catch((e) => this.sendError(e));
        break;
      case "QUARTER":
        this.game
          .quarterChange()
          .then(() => this.respondJSON(this.game.game))
          .catch((e) => this.sendError(e));
        break;
      case "DOWN":
        this.game
          .setDown(Number(details))
          .then(() => this.respondJSON(this.game.game))
          .catch((e) => this.sendError(e));
        break;
      case "DISTANCE":
        this.game
          .setDistance(details)
          .then(() => this.respondJSON(this.game.game))
          .catch((e) => this.sendError(e));
        break;
      case "TIMEOUT":
        if (details == "UNDO") {
          this.game
            .undoTimeout()
            .then(() => this.respondJSON(this.game.game))
            .catch((e) => this.sendError(e));
        } else {
          const team = details.toLowerCase() as "home" | "away";
          this.game
            .removeTimeout(team)
            .then(() => this.respondJSON(this.game.game))
            .catch((e) => this.sendError(e));
        }
      case "GAMECLOCK":
        if (details == "START") {
          this.game
            .startGameClock()
            .then(() => this.respondJSON(this.game.game))
            .catch((e) => this.sendError(e));
        } else if (details == "PAUSE") {
          this.game.pauseGameClock();
        } else if (details == "RESET") {
          this.game
            .resetGameClock()
            .then(() => this.respondJSON(this.game.game))
            .catch((e) => this.sendError(e));
        }
    }
  }

  /**
   *
   * @param port Port to listen on. Defaults to 8999
   */
  public listen() {
    const configPort = new Config().config.listenPort;
    const port = configPort ? configPort : 8999;
    this.wss.on("connection", this.onConnection.bind(this));
    this.server.listen(port, "0.0.0.0", () => {
      console.log(`WS Listening on ${JSON.stringify(this.server.address())}`);
    });
  }
}
