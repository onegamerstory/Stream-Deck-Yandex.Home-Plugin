# Stream-Deck-Yandex.Home-Plugin
Плагин для Elgato Stream Deck, который позволяет привязывать выбранный сценарий умного дома к кнопке на Stream Deck.

![GitHub Downloads (all assets, all releases)](https://img.shields.io/github/downloads/onegamerstory/Stream-Deck-Yandex.Home-Plugin/total)
![GitHub Repo stars](https://img.shields.io/github/stars/onegamerstory/Stream-Deck-Yandex.Home-Plugin)
![GitHub Release](https://img.shields.io/github/v/release/onegamerstory/Stream-Deck-Yandex.Home-Plugin)

### Если у вас Stream Deck от брендов Fifine, Miracast, Ajazz - устанавливайте [вот этот плагин](https://github.com/qwertyonek/yandex-smarthome-ajazz-plugin) 

<br>

# Получение токена Умного дома Яндекс 

## 1. Создаем/регистрируем приложение на сервере авторизации Яндекс OAuth 

Переходим по [ссылке](https://passport.yandex.ru/auth?retpath=https%3A%2F%2Foauth.yandex.ru%2Fclient%2Fnew%2F&noreturn=1) на Яндекс OAuth.

Нажимаем `Создать приложение` или сайт сам предложит это сделать. Выбираем пункт `Для доступа к API или отладки`:

<img width="465" height="439" alt="image" src="https://github.com/user-attachments/assets/6eb53c26-2aa2-4b95-a812-ab4e198c9432" />

На странице заполняем название (любое), а ниже в поле `Доступ к данным` сами прописываем два доступа: 
- `iot:view`
- `iot:control`

<img width="639" height="324" alt="image" src="https://github.com/user-attachments/assets/0f48040c-a19d-42f1-9c3a-d3a72783f224" />


## 2. Получаем токен для нашего приложения

После того, как приложение будет создано, нужно перейти по адресу:

`https://oauth.yandex.ru/authorize?response_type=token&client_id=<идентификатор приложения>`

В качестве идентификатора приложения подставляем _ClientID_ нашего приложения:
<img width="1150" height="400" alt="image" src="https://github.com/user-attachments/assets/43bc0afb-340c-4113-ac93-e75e8651714e" />

После перехода по этой ссылке, мы попадаем на страницу с токеном - копируем его и сохраняем в укромном месте!
<img width="1150" height="119" alt="image" src="https://github.com/user-attachments/assets/786aa06a-5c06-4ac9-8635-e0da62a92575" />


# Установка и использование плагина Stream Deck

## 1. Установка

Устанавливаем файл **com.onegamerstory.yandexsmarthome.sdPlugin.streamDeckPlugin**, скачанный со [страницы релизов](https://github.com/onegamerstory/Stream-Deck-Yandex.Home-Plugin/releases)
После этого плагин появится в списке:
<img width="267" height="160" alt="image" src="https://github.com/user-attachments/assets/a6bf2fb9-7a31-4f6d-83ef-233473e80d75" />

## 2. Использование

Перетаскиваем действие на нужную кнопку Stream Deck:
<img width="546" height="714" alt="image" src="https://github.com/user-attachments/assets/dbbecde4-ef55-467a-b210-0efdc899ef58" />

В поле _Enter the token_ вставляем токен Умного дома Яндекс
Далее, нажимаем кнопку _Подключиться_ - плагин оповестит надписью **OKAY** на экране самой кнопки в случае успеха, иначе - надписью **ERROR**.

После успешного подключения нажать кнопку _Получить список сценариев_, а затем выбрать нужный сценарий из выпадающего списка.

Сценарий привязан к кнопке и готов к работе.
