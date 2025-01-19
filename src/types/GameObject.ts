export type GameObject = {
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
