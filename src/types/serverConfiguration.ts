export type serverConfiguration = {
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
