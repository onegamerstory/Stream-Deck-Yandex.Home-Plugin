import streamDeck, { action, KeyDownEvent, SingletonAction, WillAppearEvent, DidReceiveSettingsEvent, JsonValue, SendToPluginEvent } from "@elgato/streamdeck";
import type { DataSourcePayload, DataSourceResult } from "../sdpi";

const logger = streamDeck.logger.createScope("main-script")

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

@action({ UUID: "com.onegamerstory.yandexsmarthome.smarthome-scenario" })
export class SmarthomeScenario extends SingletonAction<ScenarioSettings> {


  override async onKeyDown(ev: KeyDownEvent<ScenarioSettings>): Promise<void> {
    const { settings } = ev.payload;

    if (settings.scenarioSelect) {
      logger.info("id сценария: " + settings.scenarioSelect)

      const url = `https://api.iot.yandex.net/v1.0/scenarios/${settings.scenarioSelect}/actions`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.token}`
        }
      });

      const isEnabled = ev.payload.state;
      if(response.ok){
        // Меняем локально
        const newState = isEnabled ? 0 : 1;
        await ev.action.setState(newState)

      	logger.info("Сценарий выполнен!")
      	await ev.action.showOk();
      }else{
      	logger.info("Сценарий не выполнен!")
      	await ev.action.showAlert();
      }
    }
  }


  override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<ScenarioSettings>): Promise<void> {
    const { settings } = ev.payload;
    if (settings.token && settings.token.trim() !== "") {
      try {
        const resp = await fetch("https://api.iot.yandex.net/v1.0/user/info", {
          headers: {
            "Authorization": `Bearer ${settings.token}`,
            "Content-Type": "application/json"
          }
        });

        if(resp.ok){
        	await ev.action.setTitle("OKAY");

        	const data = (await resp.json()) as YandexUserInfo;
	        const scenarios = data.scenarios ?? [];
	        
	        settings.scenarios = scenarios;
	        
	        await ev.action.setSettings(settings);

          await sleep(5000);
          await ev.action.setTitle("");
        }else{
        	await ev.action.setTitle("ERROR");
          await sleep(5000);
          await ev.action.setTitle("");
        }

      } catch (err) {
        logger.error("Ошибка при подключении:", err);
        await ev.action.setTitle("ERROR");
        await sleep(5000);
        await ev.action.setTitle("");
      }
    }
  }


  override async onSendToPlugin(ev: SendToPluginEvent<JsonValue, ScenarioSettings>): Promise<void> {
    if (ev.payload instanceof Object && "event" in ev.payload) {

      if(ev.payload.event === "getScenarios"){
        const settings = await ev.action.getSettings() as ScenarioSettings;

        const scenarios = settings?.scenarios ?? [];

        const sc_items = scenarios.map(scenario => ({
          value: scenario.id,
          label: scenario.name
        }));

        streamDeck.ui.current?.sendToPropertyInspector({
          event: "getScenarios",
          items: sc_items,
        } satisfies DataSourcePayload);
      }
    }
  }
}


type ScenarioSettings = {
  token?: string;
  scenarios?: any[];
  scenarioSelect? : string;
  count?: number;
  incrementBy?: number;
};


interface YandexUserInfo {
  scenarios?: {
    id: string;
    name: string;
  }[];
}