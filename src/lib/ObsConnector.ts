import OBSWebSocket from "obs-websocket-js";
import { OBSCommands } from "../enum/obsCommands.enum";
import { OBSColors } from "../enum/obsColors.enum";
import Logger from "./Logger";

const log = new Logger("OBSConnector");

/**
 * Utilities for OBS
 */
export default class OBSConnector {
  obs: OBSWebSocket;
  url: string;

  constructor(url: string) {
    this.obs = new OBSWebSocket();
    this.url = url;
    this.connect().then(
      () => null,
      (error) => log.error(error)
    );
  }

  /**
   * Connect to OBS
   * @returns Version of the OBS websocket
   */
  private async connect() {
    const { obsWebSocketVersion } = await this.obs.connect(this.url);
    log.info("Connected to OBS");
    return obsWebSocketVersion;
  }

  /**
   * JSON encode an object
   * @param responseObject Object to encode
   * @returns JSON stringified `responseObject`
   */
  private responsify(responseObject: Record<string, any>) {
    return JSON.stringify(responseObject);
  }

  /**
   * Get the value of a text source in OBS
   * @param sourceName Name of the text source in OBS
   * @returns Value of text source
   */
  public async getTextValue(sourceName: string) {
    const inputList = await this.obs.call("GetInputList");
    if (inputList.inputs.filter((i) => i.inputName === sourceName).length > 0) {
      const inputSettings = await this.obs.call("GetInputSettings", {
        inputName: "Points Home",
      });
      return this.responsify({ value: inputSettings.inputSettings.text });
    }
    return this.responsify({
      error: "No match for requested input",
      requestedInput: sourceName,
    });
  }

  /**
   * Check if a source exists
   * @param sourceName Name of the source in OBS
   * @returns If the sourceName exists
   */
  private async inputExists(sourceName: string) {
    const inputList = await this.obs.call("GetInputList");
    if (inputList.inputs.filter((i) => i.inputName === sourceName).length > 0) {
      return true;
    }
    return false;
  }

  /**
   * Set a text source to a given value
   * @param sourceName Name of the text source to set
   * @param input Text to set
   * @returns The set value
   */
  public async setText(sourceName: string, input: string) {
    try {
      if (await this.inputExists(sourceName)) {
        await this.obs.call(OBSCommands.SET_INPUT, {
          inputName: sourceName,
          inputSettings: { text: input },
        });
        return this.responsify({ value: input });
      }
      return this.responsify({
        error: "No match for requested input",
        requestedInput: sourceName,
      });
    } catch (e) {
      log.error(e);
    }
  }

  /**
   * Set text source to a OBS color
   * @param sourceName Name of the text source to modify
   * @param color OBS Color code
   */
  public async setTextColor(sourceName: string, color: OBSColors) {
    try {
      if (await this.inputExists(sourceName)) {
        await this.obs.call(OBSCommands.SET_INPUT, {
          inputName: sourceName,
          inputSettings: { color: color },
        });
      }
    } catch (error) {
      log.error(error);
    }
  }

  //? Debug function if you want to implement a new functionality and need the arguments
  public async getSourceProperties(sourceName: string, b?: any) {
    try {
      if (await this.inputExists(sourceName)) {
        log.info(
          await this.obs.call(OBSCommands.GET_INPUT, { inputName: sourceName })
        );
      }
    } catch (error) {}
  }

  /**
   * Hide a source
   * @param sourceName Name of the source
   * @returns message object on error
   */
  public async hideSource(sourceName: string) {
    try {
      const inputList = await this.obs.call("GetSceneItemList", {
        sceneName: "[OVERLAY] ScoreBug",
      });
      if (
        inputList.sceneItems.filter((i) => i.sourceName === sourceName).length >
        0
      ) {
        const sceneItemId = inputList.sceneItems.filter(
          (i) => i.sourceName === sourceName
        )[0].sceneItemId as number;
        await this.obs.call(OBSCommands.SET_SCENE_ITEM_ENABLED, {
          sceneName: "[OVERLAY] ScoreBug",
          sceneItemEnabled: false,
          sceneItemId: sceneItemId,
        });
      }
      return this.responsify({
        error: "No match for requested input",
        requestedInput: sourceName,
      });
    } catch (e) {
      log.error(e);
    }
  }

  /**
   * Show a source
   * @param sourceName Name of the source
   * @returns Message on error
   */
  public async showSource(sourceName: string) {
    try {
      const inputList = await this.obs.call("GetSceneItemList", {
        sceneName: "[OVERLAY] ScoreBug",
      });
      if (
        inputList.sceneItems.filter((i) => i.sourceName === sourceName).length >
        0
      ) {
        const sceneItemId = inputList.sceneItems.filter(
          (i) => i.sourceName === sourceName
        )[0].sceneItemId as number;
        await this.obs.call(OBSCommands.SET_SCENE_ITEM_ENABLED, {
          sceneName: "[OVERLAY] ScoreBug",
          sceneItemEnabled: true,
          sceneItemId: sceneItemId,
        });
        return;
      }
      return this.responsify({
        error: "No match for requested input",
        requestedInput: sourceName,
      });
    } catch (e) {
      log.error(e);
    }
  }
}
