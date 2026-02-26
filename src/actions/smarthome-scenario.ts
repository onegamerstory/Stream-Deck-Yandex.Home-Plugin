import streamDeck, { action, KeyDownEvent, SingletonAction, WillAppearEvent, DidReceiveSettingsEvent, JsonValue, SendToPluginEvent } from "@elgato/streamdeck";
import type { DataSourcePayload, DataSourceResult } from "../sdpi";
import { getToken, saveToken } from "../storage";
import { getUserInfo, runScenario, YandexScenario } from "../yandex-api";

const logger = streamDeck.logger.createScope("scenario-action");

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

@action({ UUID: "com.onegamerstory.yandexsmarthome.smarthome-scenario" })
export class SmarthomeScenario extends SingletonAction<ScenarioSettings> {

  override async onWillAppear(ev: WillAppearEvent<ScenarioSettings>): Promise<void> {
    // Загружаем сохраненный токен, если его нет
    const settings = await ev.action.getSettings() as ScenarioSettings;
    
    if (!settings.token) {
      const savedToken = getToken();
      if (savedToken) {
        await ev.action.setSettings({
          ...settings,
          token: savedToken
        });
      }
    }
  }

  override async onKeyDown(ev: KeyDownEvent<ScenarioSettings>): Promise<void> {
    const { settings } = ev.payload;

    if (settings.scenarioSelect) {
      logger.info("id сценария: " + settings.scenarioSelect);

      const token = settings.token || getToken();
      if (!token) {
        logger.info("Токен не найден!");
        await ev.action.showAlert();
        return;
      }

      try {
        const success = await runScenario(token, settings.scenarioSelect);

        const isEnabled = ev.payload.state;
        if (success) {
          // Меняем локально
          const newState = isEnabled ? 0 : 1;
          await ev.action.setState(newState);

          logger.info("Сценарий выполнен!");
          await ev.action.showOk();
        } else {
          logger.info("Сценарий не выполнен!");
          await ev.action.showAlert();
        }
      } catch (err) {
        logger.error("Ошибка:", err);
        await ev.action.showAlert();
      }
    }
  }

  override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<ScenarioSettings>): Promise<void> {
    const { settings } = ev.payload;
    logger.info("onDidReceiveSettings вызван для сценариев", settings);
    
    if (settings.token && settings.token.trim() !== "") {
      try {
        logger.info("Проверяю токен и получаю сценарии...");
        const userInfo = await getUserInfo(settings.token);

        logger.info("Успешно получены данные пользователя");

        // Сохраняем токен в глобальное хранилище
        saveToken(settings.token);
        logger.info("Токен сохранен в глобальное хранилище");

        await ev.action.setTitle("OKAY");

        const scenarios = userInfo.scenarios ?? [];
        logger.info(`Получено ${scenarios.length} сценариев`);
        
        settings.scenarios = scenarios as any[];
        
        await ev.action.setSettings(settings);

        await sleep(5000);
        await ev.action.setTitle("");
      } catch (err) {
        logger.error("Ошибка при подключении:", err);
        await ev.action.setTitle("ERROR");
        await sleep(5000);
        await ev.action.setTitle("");
      }
    } else {
      logger.warn("Токен не предоставлен или пуст");
    }
  }

  override async onSendToPlugin(ev: SendToPluginEvent<JsonValue, ScenarioSettings>): Promise<void> {
    logger.info("onSendToPlugin вызван для сценариев", ev.payload);
    
    if (ev.payload instanceof Object && "event" in ev.payload) {

      if (ev.payload.event === "getScenarios") {
        logger.info("Запрос на получение списка сценариев");
        const settings = await ev.action.getSettings() as ScenarioSettings;

        const scenarios = settings?.scenarios ?? [];
        logger.info(`Отправляю ${scenarios.length} сценариев`);

        const sc_items = scenarios.map(scenario => ({
          value: scenario.id,
          label: scenario.name
        }));

        logger.info("Отправляю данные на Property Inspector", sc_items);
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
  scenarioSelect?: string;
  count?: number;
  incrementBy?: number;
};