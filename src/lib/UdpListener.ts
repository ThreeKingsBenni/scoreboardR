import { createSocket, Socket } from "dgram";
import Game from "./Game.1";
import Config from "./Config";

const config = new Config().config;

export default abstract class UDPListener {
  socket: Socket;
  game: Game;

  constructor() {
    this.socket = createSocket("udp4");
    this.game = new Game();
  }

  private onError(error: Error) {
    console.error(`UDP Error: ${error.stack}`);
  }

  private onListen() {
    console.log(`Listening for UDP packets...`);
  }

  /**
   * This method needs to be implemented in the plugin for the respective scoreboard manufacturer.
   * @param packet Packet that is received by the UDP socket connection
   */
  public onMessage(packet: Buffer): void {}

  public listen() {
    const configPort = config.listenPort;
    const port = configPort ?? 8998;
    this.socket.on("listening", this.onListen);
    this.socket.on("error", this.onError);
    this.socket.on("message", this.onMessage.bind(this));
    this.socket.bind(port, "0.0.0.0", () =>
      console.log(`UDP Listening on port ${port}`)
    );
  }
}
