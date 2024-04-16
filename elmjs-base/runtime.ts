import {Router, Route} from "/lib/router.js";
import {EZLocalStorage} from "/lib/ezlocalstorage.js";
import {Localization} from "/lib/localization.js";

import ProcInfo from "/boot.process.js";

import type {AppMain} from "/modules/app-main/app-main.m.js";


export const $EventBus = new EventTarget();
export const $App:{inst:AppMain;digest:typeof ProcInfo['digest']}&AppData = {} as any;
Object.defineProperty($App, 'digest', {
	configurable:false, writable:false, enumerable:true,
	value:Object.freeze(Object.assign({}, ProcInfo.digest))
});

export const $S:RuntimeData = {} as any;
export const $Router:Router = new Router();
export {
	EZLocalStorage as $L,
	Localization as $T,
	Route as $Route
};



