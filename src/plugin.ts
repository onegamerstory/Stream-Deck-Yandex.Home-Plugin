import streamDeck, { LogLevel } from "@elgato/streamdeck";

import { SmarthomeScenario } from "./actions/smarthome-scenario";

streamDeck.logger.setLevel(LogLevel.TRACE);

streamDeck.actions.registerAction(new SmarthomeScenario());

streamDeck.connect();
