import streamDeck, { LogLevel } from "@elgato/streamdeck";

import { SmarthomeScenario } from "./actions/smarthome-scenario";
import { SmarthomeDevice } from "./actions/smarthome-device";

streamDeck.logger.setLevel(LogLevel.TRACE);

streamDeck.actions.registerAction(new SmarthomeScenario());
streamDeck.actions.registerAction(new SmarthomeDevice());

streamDeck.connect();
