import {$L, $S, $T} from "/runtime.js";
import type {LocaleMap} from "/lib/localization.js";
import en_us from "/locale/en_us.js";

const DEFAULT_LOCALE:string = 'en_us';
const locale_map:{[locale_name:string]:LocaleMap} = {
	en_us
};

export async function init() {
	const pref_code = $L.get('USER_PREF', 'pref/locale');
	let locale = (pref_code||navigator.language||'en').replace(/[-_]/, '_').toLowerCase();
	console.log("Preferred locale:", locale);

	const {lang, country} = $T.parseLangId(locale);
	if ( !country ) {
		switch(lang) {
			case 'en':
				locale = 'en_us';
				break;
			
			default:
				locale = 'en_us';
				break;
		}
	}
	
	$T.setLocale(locale, locale_map[locale]||locale_map[DEFAULT_LOCALE]);
}