import "/boot.esext.js";
import {ElmJS} from "/lib/elmjs.js";
import {$EventBus, $Route, $Router} from "/runtime.js";

(async()=>{
	// Load and initialize dynamic process runtime info
	await import('/boot.process.js');

	// Init mdule views
	ElmJS.registerModuleView((await import('/boot.module-env.js')).default);

	// Init localiation system
	await (await import('/boot.localization.js')).init();


	// Create app instance
	const app_view = ElmJS.createElement(/*html*/`
		<app-view>
			<div elm-export="viewport" class="viewport">
				<init-view class="assigned-init-class" elm-root></init-view>
				<clock-view elm-root>
					<div>
						<clock-widget class="assigned-widget-class" elm-export="clock"></clock-widget>
						<div class="message" elm-export="message"></div>
					</div>
				</clock-view>
			</div>
		</app-view>
	`)!;
	document.body.insertAdjacentElement('afterbegin', app_view);



	// Init router system
	// Modify app if the main view container is not app
	await (await import('/boot.router.js')).init(app_view.exportedElements.viewport);
	

	// Remove all views from viewport
	app_view.exportedElements.viewport.innerHTML = '';

	
	$Route.permData = {"beta-testing":''};
	$Route.replace('/home');
	
	setInterval(()=>$EventBus.emit('tick:second'), 1_000);
})();