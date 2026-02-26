import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const logger = console;

// Путь к файлу с токеном в папке плагина
const getStoragePath = (): string => {
  // Плагин запускается из корневого каталога workspace
  // Нам нужно получить путь: {cwd}/com.onegamerstory.yandexsmarthome.sdPlugin/data
  const pluginDir = join(process.cwd(), "com.onegamerstory.yandexsmarthome.sdPlugin", "data");
  logger.log("[Storage] Storage path:", pluginDir);
  return pluginDir;
};

const getTokenFilePath = (): string => {
  return join(getStoragePath(), "token.json");
};

interface StorageData {
  token?: string;
}

/**
 * Получить сохраненный токен
 */
export const getToken = (): string | null => {
  try {
    const filePath = getTokenFilePath();
    logger.log("[Storage] Trying to read token from:", filePath);
    if (existsSync(filePath)) {
      const data = readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(data) as StorageData;
      logger.log("[Storage] Token found!");
      return parsed.token || null;
    }
    logger.log("[Storage] Token file not found");
  } catch (err) {
    logger.error("[Storage] Error reading token:", err);
  }
  return null;
};

/**
 * Сохранить токен
 */
export const saveToken = (token: string): void => {
  try {
    const filePath = getTokenFilePath();
    const dir = getStoragePath();
    
    logger.log("[Storage] Saving token to:", filePath);
    
    // Создаем папку если её нет
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      logger.log("[Storage] Created directory:", dir);
    }

    const data: StorageData = { token };
    writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    logger.log("[Storage] Token saved successfully!");
  } catch (err) {
    logger.error("[Storage] Error saving token:", err);
    throw err;
  }
};

/**
 * Удалить сохраненный токен
 */
export const clearToken = (): void => {
  try {
    const filePath = getTokenFilePath();
    if (existsSync(filePath)) {
      const fs = require("fs");
      fs.unlinkSync(filePath);
      logger.log("[Storage] Token deleted");
    }
  } catch (err) {
    logger.error("[Storage] Error deleting token:", err);
  }
};
