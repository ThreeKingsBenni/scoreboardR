import { GameObject } from "../types/GameObject";
import { playTypeScores } from "./Game";

export type lastPlayBuffer = {
  team: keyof GameObject["points"];
  playType: keyof typeof playTypeScores;
};
