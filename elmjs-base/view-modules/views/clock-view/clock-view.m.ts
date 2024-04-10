import { $EventBus, $L, $Router, $T } from "/runtime.js";
import {ElmJS} from "/lib/elmjs.js";
import type {ClockWidget} from "/view-modules/comps/clock-widget/clock-widget.m.js";

class ClockView extends ElmJS.HTMLModule {
	#hcallbacks:symbol[] = [];

	#elm_clock_widget:ClockWidget;
	#elm_message:HTMLElement;

	constructor() {
		super();
		ElmJS.resolveExports(this);
		
		$Router.route('/clock', {view:this});
		

		this.#elm_clock_widget = this.getExportedElement<ClockWidget>('clock_widget')!;
		this.#elm_message = this.getExportedElement<HTMLElement>('message')!;
	}

	// Called when the element is mounted for the first time
	init(): void {
		this.tick();
	}

	// Call when the element is attached to the dom
	mounted(): void {
		this.#hcallbacks.push($EventBus.on('tick:second', ()=>{
			this.tick();
		}));
	}

	// Call when the element is deteached from the dom
	unmounted(): void {
		this.#hcallbacks.splice(0).forEach(i=>$EventBus.off(i));
	}

	tick() {
		const now = new Date();
		const curr_hour = now.getHours();
		if ( curr_hour >= 5 && curr_hour < 12 ) {
			this.#elm_message.textContent = $T.trans('MORNING_GREETINGS');
		}
		else
		if ( curr_hour >= 12 && curr_hour < 18 ) {
			this.#elm_message.textContent = $T.trans('AFTERNOON_GREETINGS');
		}
		else
		if ( curr_hour > 18 && curr_hour < 22 ) {
			this.#elm_message.textContent = $T.trans('EVENING_GREETINGS');
		}
		else {
			this.#elm_message.textContent = $T.trans('NIGHT_GREETINGS');
		}
	}
}

ElmJS.registerModule(ClockView, {tagName:'clock-view', extends:'div'});