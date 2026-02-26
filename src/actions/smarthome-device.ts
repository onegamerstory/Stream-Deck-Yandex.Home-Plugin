import streamDeck, { action, KeyDownEvent, SingletonAction, WillAppearEvent, DidReceiveSettingsEvent, JsonValue, SendToPluginEvent } from "@elgato/streamdeck";
import type { DataSourcePayload, DataSourceResult } from "../sdpi";
import { getToken, saveToken } from "../storage";
import { getUserInfo, toggleDevice, YandexDevice } from "../yandex-api";

const logger = streamDeck.logger.createScope("device-action");

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

@action({ UUID: "com.onegamerstory.yandexsmarthome.smarthome-device" })
export class SmarthomeDevice extends SingletonAction<DeviceSettings> {
  
  override async onWillAppear(ev: WillAppearEvent<DeviceSettings>): Promise<void> {
    // Загружаем сохраненный токен, если его нет
    const settings = await ev.action.getSettings() as DeviceSettings;
    
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

  override async onKeyDown(ev: KeyDownEvent<DeviceSettings>): Promise<void> {
    const { settings } = ev.payload;

    if (settings.deviceSelect) {
      logger.info("ID устройства: " + settings.deviceSelect);

      const token = settings.token || getToken();
      if (!token) {
        logger.info("Токен не найден!");
        await ev.action.showAlert();
        return;
      }

      try {
        // Переключаем состояние устройства
        const isEnabled = ev.payload.state;
        const newValue = isEnabled ? false : true;

        const success = await toggleDevice(token, settings.deviceSelect, newValue);

        if (success) {
          // Меняем локально
          const newState = isEnabled ? 0 : 1;
          await ev.action.setState(newState);

          logger.info("Устройство изменено!");
          await ev.action.showOk();
        } else {
          logger.info("Ошибка при изменении устройства!");
          await ev.action.showAlert();
        }
      } catch (err) {
        logger.error("Ошибка:", err);
        await ev.action.showAlert();
      }
    }
  }

  override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<DeviceSettings>): Promise<void> {
    const { settings } = ev.payload;
    logger.info("onDidReceiveSettings вызван для устройств", settings);
    
    if (settings.token && settings.token.trim() !== "") {
      try {
        logger.info("Проверяю токен и получаю устройства...");
        const userInfo = await getUserInfo(settings.token);

        logger.info("Успешно получены данные пользователя");

        // Сохраняем токен в глобальное хранилище
        saveToken(settings.token);
        logger.info("Токен сохранен в глобальное хранилище");

        await ev.action.setTitle("OKAY");

        const devices = userInfo.devices ?? [];
        logger.info(`Получено ${devices.length} устройств`);
        
        settings.devices = devices as any[];
        
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

  override async onSendToPlugin(ev: SendToPluginEvent<JsonValue, DeviceSettings>): Promise<void> {
    logger.info("onSendToPlugin вызван для устройств", ev.payload);
    
    if (ev.payload instanceof Object && "event" in ev.payload) {

      if (ev.payload.event === "getDevices") {
        logger.info("Запрос на получение списка устройств");
        const settings = await ev.action.getSettings() as DeviceSettings;

        const devices = settings?.devices ?? [];
        logger.info(`Отправляю ${devices.length} устройств`);

        const device_items = devices.map(device => ({
          value: device.id,
          label: device.name
        }));

        logger.info("Отправляю данные на Property Inspector", device_items);
        streamDeck.ui.current?.sendToPropertyInspector({
          event: "getDevices",
          items: device_items,
        } satisfies DataSourcePayload);
      }
    }
  }
}

type DeviceSettings = {
  token?: string;
  devices?: any[];
  deviceSelect?: string;
};
