import streamDeck, { action, KeyDownEvent, SingletonAction, WillAppearEvent, DidReceiveSettingsEvent, JsonValue, SendToPluginEvent, WillDisappearEvent } from "@elgato/streamdeck";
import type { DataSourcePayload, DataSourceResult } from "../sdpi";
import { getToken, saveToken } from "../storage";
import { getUserInfo, toggleDevice, getDeviceState, YandexDevice } from "../yandex-api";

const logger = streamDeck.logger.createScope("device-action");

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

@action({ UUID: "com.onegamerstory.yandexsmarthome.smarthome-device" })
export class SmarthomeDevice extends SingletonAction<DeviceSettings> {
  private pollInterval: NodeJS.Timeout | null = null;
  private currentSettings: DeviceSettings | null = null;
  private currentAction: any = null;
  
  override async onWillAppear(ev: WillAppearEvent<DeviceSettings>): Promise<void> {
    // Загружаем сохраненный токен, если его нет
    const settings = await ev.action.getSettings() as DeviceSettings;
    this.currentSettings = settings;
    this.currentAction = ev.action;
    
    if (!settings.token) {
      const savedToken = getToken();
      if (savedToken) {
        await ev.action.setSettings({
          ...settings,
          token: savedToken
        });
        settings.token = savedToken;
      }
    }

    // Начинаем периодический опрос состояния устройства
    this.startPolling();
  }

  override async onWillDisappear(ev: WillDisappearEvent<DeviceSettings>): Promise<void> {
    // Останавливаем периодический опрос
    this.stopPolling();
    this.currentAction = null;
  }

  private startPolling(): void {
    // Останавливаем предыдущий опрос, если он был
    this.stopPolling();

    // Сразу проверяем состояние
    this.updateDeviceState();

    // Затем проверяем каждые 60 секунд
    this.pollInterval = setInterval(() => {
      this.updateDeviceState();
    }, 60000); // 60 секунд
  }

  private stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
      logger.info("Опрос состояния устройства остановлен");
    }
  }

  private async updateDeviceState(): Promise<void> {
    if (!this.currentAction) {
      logger.warn("Текущее действие не установлено");
      return;
    }

    if (!this.currentSettings?.deviceSelect) {
      logger.warn("ID устройства не выбран, опрос пропущен");
      return;
    }

    const token = this.currentSettings.token || getToken();
    if (!token) {
      logger.warn("Токен не найден для опроса состояния");
      return;
    }

    try {
      const deviceState = await getDeviceState(token, this.currentSettings.deviceSelect);
      
      if (deviceState !== null) {
        // Преобразуем состояние в state для Stream Deck
        // true (вкл) = state 0 (первый/ВКЛ), false (выкл) = state 1 (второй/ВЫКЛ)
        const streamDeckState = deviceState ? 0 : 1;
        await this.currentAction.setState(streamDeckState);
        logger.info(`Состояние устройства ${this.currentSettings.deviceSelect} обновлено: ${deviceState ? 'ВКЛ' : 'ВЫКЛ'}`);
      }
    } catch (err) {
      logger.error("Ошибка при обновлении состояния устройства:", err);
    }
  }
  
  override async onKeyDown(ev: KeyDownEvent<DeviceSettings>): Promise<void> {
    const { settings } = ev.payload;
    this.currentSettings = settings;

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
        // Текущее состояние: 0 = ВКЛ, 1 = ВЫКЛ
        const currentState = ev.payload.state;
        const newState = currentState === 0 ? 1 : 0; // Переключаем на противоположное
        const newValue = newState === 0; // true если нужно включить, false если выключить

        const success = await toggleDevice(token, settings.deviceSelect, newValue);

        if (success) {
          // Обновляем state на кнопке
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
    this.currentSettings = settings;
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
