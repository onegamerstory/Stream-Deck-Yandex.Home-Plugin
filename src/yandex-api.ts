/**
 * Вспомогательные функции для работы с API Яндекс Умного Дома
 */

const logger = console;

export interface YandexScenario {
  id: string;
  name: string;
}

export interface YandexDevice {
  id: string;
  name: string;
  type: string;
  capabilities?: Array<{
    type: string;
    state?: {
      instance: string;
      value: boolean | string | number;
    };
  }>;
}

export interface YandexUserInfo {
  scenarios?: YandexScenario[];
  devices?: YandexDevice[];
  households?: Array<{
    id: string;
    name: string;
  }>;
}

/**
 * Получить информацию о пользователе (сценарии и устройства)
 */
export const getUserInfo = async (token: string): Promise<YandexUserInfo> => {
  try {
    logger.log("[Yandex API] Fetching user info with token:", token.substring(0, 10) + "...");
    const response = await fetch("https://api.iot.yandex.net/v1.0/user/info", {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    logger.log("[Yandex API] Response status:", response.status);

    if (!response.ok) {
      logger.error("[Yandex API] API error:", response.status, response.statusText);
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as YandexUserInfo;
    logger.log("[Yandex API] User info received:", {
      scenarios: data.scenarios?.length || 0,
      devices: data.devices?.length || 0
    });
    return data;
  } catch (err) {
    logger.error("[Yandex API] Error fetching user info:", err);
    throw err;
  }
};

/**
 * Запустить сценарий
 */
export const runScenario = async (token: string, scenarioId: string): Promise<boolean> => {
  try {
    const url = `https://api.iot.yandex.net/v1.0/scenarios/${scenarioId}/actions`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.ok;
  } catch (err) {
    logger.error("Ошибка при выполнении сценария:", err);
    throw err;
  }
};

/**
 * Включить/выключить устройство
 * @param token - Токен доступа
 * @param deviceId - ID устройства
 * @param value - true для включения, false для выключения
 */
export const toggleDevice = async (
  token: string,
  deviceId: string,
  value: boolean
): Promise<boolean> => {
  try {
    const url = "https://api.iot.yandex.net/v1.0/devices/actions";
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        devices: [
          {
            id: deviceId,
            actions: [
              {
                type: 'devices.capabilities.on_off',
                state: {
                  instance: 'on',
                  value: value
                }
              }
            ]
          }
        ]
      })
    });

    return response.ok;
  } catch (err) {
    logger.error("Ошибка при управлении устройством:", err);
    throw err;
  }
};

/**
 * Получить состояние конкретного устройства
 * @param token - Токен доступа
 * @param deviceId - ID устройства
 * @returns true если устройство включено, false если выключено, или null если ошибка
 */
export const getDeviceState = async (
  token: string,
  deviceId: string
): Promise<boolean | null> => {
  try {
    const userInfo = await getUserInfo(token);
    const device = userInfo.devices?.find(d => d.id === deviceId);
    
    if (!device || !device.capabilities) {
      logger.error(`[Yandex API] Устройство ${deviceId} не найдено или нет capabilities`);
      return null;
    }

    // Ищем capability типа on_off
    const onOffCapability = device.capabilities.find(
      cap => cap.type === 'devices.capabilities.on_off'
    );

    if (!onOffCapability || !onOffCapability.state) {
      logger.warn(`[Yandex API] Capability on_off не найдена для устройства ${deviceId}`);
      return null;
    }

    const state = onOffCapability.state.value as boolean;
    logger.log(`[Yandex API] Состояние устройства ${deviceId}: ${state}`);
    return state;
  } catch (err) {
    logger.error(`[Yandex API] Ошибка при получении состояния устройства:`, err);
    return null;
  }
};

