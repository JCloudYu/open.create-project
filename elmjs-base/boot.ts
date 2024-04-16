import "/boot.esext.js";
import {ElmJS} from "/lib/elmjs.js";
import {HelperTool} from "/lib/helper-tool.js";
import {$EventBus, $App} from "/runtime.js";



(async()=>{
	// Hook promise errors
	window.addEventListener('unhandledrejection', (e)=>{
		console.error("Received unhandled promise rejection!", e.reason);
	});
	
	// Init mdule views
	ElmJS.registerModuleView((await import('/boot.module-env.js')).default);

	// Load prerequisit scripts
	await HelperTool.loadResources([
		{type:'js', path:'./dayjs.min.js'}
	], $App.digest.build);

	// Init localiation system
	await (await import('/boot.localization.js')).init();


	// Create app main instance
	Object.defineProperty($App, 'inst', {
		configurable:false, writable:false, enumerable:true,
		value:ElmJS.createElement('<app-main></app-main>')!
	});
	document.body.insertAdjacentElement('afterbegin', $App.inst);

	// Init and bind routing events
	await (await import('/boot.router.js')).init();
	
	// Trigger system boot
	$EventBus.emit('sys:init');
})();