import {Router, Route} from "/lib/router.js";
import {EZLocalStorage} from "/lib/ezlocalstorage.js";
import {Localization} from "/lib/localization.js";
export const $EventBus = new EventTarget();


export const $S:RuntimeData = {} as any;
export const $Router:Router = new Router();
export {
	EZLocalStorage as $L,
	Localization as $T,
	Route as $Route
};