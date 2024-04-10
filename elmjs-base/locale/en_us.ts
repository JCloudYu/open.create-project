import {BuildTemplate as T} from "/lib/localization.js";
import type {LocaleMap} from "/lib/localization.js";

const locale:LocaleMap = {};

locale["MORNING_GREETINGS"] = T`Good Morning`;
locale["AFTERNOON_GREETINGS"] = T`Good Afternoon`;
locale["EVENING_GREETINGS"] = T`Good Evening`;
locale["NIGHT_GREETINGS"] = T`Good Night`;

export default locale;