import "/boot.esext.js";

import {ElmJS} from "/lib/elmjs.js";
import {HelperTool} from "/lib/helper-tool.js";
import {$EventBus} from "/runtime.js";

import ProcInfo from "/boot.process.js";

import type {AppMain} from "/modules/app-main/app-main.m.js";



(async()=>{
	// Init mdule views
	ElmJS.registerModuleView((await import('/boot.module-env.js')).default);

	// Load prerequisit scripts
	await HelperTool.loadResources([
		{type:'js', path:'./dayjs.min.js'}
	], ProcInfo.digest.build);

	// Init localiation system
	await (await import('/boot.localization.js')).init();


	// Create app main instance
	const app = ElmJS.createElement<AppMain>('<app-main></app-main>')!;
	document.body.insertAdjacentElement('afterbegin', app);

	// Init and bind routing events
	await (await import('/boot.router.js')).init(app);
	
	// Trigger system boot
	$EventBus.emit('sys:init');
})();