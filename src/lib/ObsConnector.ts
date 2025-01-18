import OBSWebSocket from "obs-websocket-js";
import { OBSCommands } from "../enum/obsCommands.enum";



export default class OBSConnector {
    obs: OBSWebSocket;
    url: string

    constructor(url: string) {
        this.obs = new OBSWebSocket();
        this.url = url
        this.connect().then(
            () => null,
            (error) => console.error(error)
        );
    }

    private async connect() {
        const { obsWebSocketVersion } = await this.obs.connect(this.url);
        console.log("Connected to OBS")
        return obsWebSocketVersion;
    }

    private responsify(responseObject: Record<string, any>) {
        return JSON.stringify(responseObject);
    }

    public async getTextValue(sourceName: string) {
        // await this.connect()

        const inputList = await this.obs.call("GetInputList");
        if (inputList.inputs.filter(i => i.inputName === sourceName).length > 0) {
            const inputSettings = await this.obs.call("GetInputSettings", { inputName: "Points Home" })
            return this.responsify({ value: inputSettings.inputSettings.text });
        }
        return this.responsify(
            {
                error: "No match for requested input",
                requestedInput: sourceName
            }
        )
    }

    private async inputExists(sourceName: string) {
        const inputList = await this.obs.call("GetInputList");
        if (inputList.inputs.filter(i => i.inputName === sourceName).length > 0) {
            return true;
        }
        return false;
    }

    public async setText(sourceName: string, input: string) {
        try {
            // const obsWebSocketVersion = await this.connect()
            // console.log(obsWebSocketVersion);
            if (await this.inputExists(sourceName)) {
                await this.obs.call(OBSCommands.SET_INPUT, { inputName: sourceName, inputSettings: { text: input } });
                return this.responsify({ value: input });
            }
            return this.responsify(
                {
                    error: "No match for requested input",
                    requestedInput: sourceName
                }
            )
        } catch (e) {
            console.log(e);
        }
    }

    public async setTextColor(sourceName: string, color: number) {
        try {
            if (await this.inputExists(sourceName)) {
                await this.obs.call(OBSCommands.SET_INPUT, { inputName: sourceName, inputSettings: { color: color } });
            }
        } catch (error) {
            console.log(error)
        }
    }

    //? Debug function if you want to implement a new functionality and need the arguments
    public async getSourceProperties(sourceName: string, b?: any){
        try {
            if(await this.inputExists(sourceName)){
                console.log(await this.obs.call(OBSCommands.GET_INPUT, { inputName: sourceName}));
            }
        } catch (error) {
            
        }
    }

    public async hideSource(sourceName: string) {
        try {
            // const obsWebSocketVersion = await this.connect()
            // console.log(obsWebSocketVersion);
            const inputList = await this.obs.call("GetSceneItemList", { sceneName: "[OVERLAY] ScoreBug" });
            if (inputList.sceneItems.filter(i => i.sourceName === sourceName).length > 0) {
                const sceneItemId = (inputList.sceneItems.filter(i => i.sourceName === sourceName))[0].sceneItemId as number
                await this.obs.call(OBSCommands.SET_SCENE_ITEM_ENABLED, { sceneName: "[OVERLAY] ScoreBug", sceneItemEnabled: false, sceneItemId: sceneItemId });
                return;
            }
            return this.responsify(
                {
                    error: "No match for requested input",
                    requestedInput: sourceName
                }
            )
        } catch (e) {
            console.log(e);
        }
    }

    public async showSource(sourceName: string) {
        try {
            // const obsWebSocketVersion = await this.connect()
            // console.log(obsWebSocketVersion);
            const inputList = await this.obs.call("GetSceneItemList", { sceneName: "[OVERLAY] ScoreBug" });
            if (inputList.sceneItems.filter(i => i.sourceName === sourceName).length > 0) {
                const sceneItemId = (inputList.sceneItems.filter(i => i.sourceName === sourceName))[0].sceneItemId as number
                await this.obs.call(OBSCommands.SET_SCENE_ITEM_ENABLED, { sceneName: "[OVERLAY] ScoreBug", sceneItemEnabled: true, sceneItemId: sceneItemId });
                return;
            }
            return this.responsify(
                {
                    error: "No match for requested input",
                    requestedInput: sourceName
                }
            )
        } catch (e) {
            console.log(e);
        }
    }

}