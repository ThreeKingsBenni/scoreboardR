import { join } from "path";
import { readFileSync } from "fs";
import Logger from "./Logger";

type ServerConfiguration = {
  mode: "UDP" | "WS";
  listenPort: number;
  obs: {
    host: string;
    port: number;
    enable: boolean;
  };
  debug?: boolean;
  colors?: {
    RED: number;
    BRAND_BLUE: number;
  };
  pluginName?: string;
  statsnscore: {
    token?: string;
    scoreboardApiUrl: string;
    livestreamApiUrl: string;
  };
};

const log = new Logger("Config");

export default class Config {
  config: ServerConfiguration;

  constructor(filepath?: string) {
    try {
      const configPath =
        filepath ?? join(__dirname, "..", "config", "config.json");
      this.config = JSON.parse(
        readFileSync(configPath, { encoding: "utf-8", flag: "r" })
      );
    } catch (e: any) {
      log.warn(
        "No config file found or config file not readable. Using defaults."
      );
      log.warn(e);
      this.config = {
        mode: "UDP",
        listenPort: 8999,
        obs: {
          host: "127.0.0.1",
          port: 4455,
          enable: true,
        },
        pluginName: "schauf",
        statsnscore: {
          scoreboardApiUrl: "https://statsnscore.online/scoreboard/control",
          livestreamApiUrl: "https://statsnscore.online/livestream/control",
        },
      };
    }
  }
}
