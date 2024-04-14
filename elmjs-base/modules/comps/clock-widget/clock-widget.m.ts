import {ElmJS} from "/lib/elmjs.js";
import { $EventBus } from "/runtime.js";

export class ClockWidget extends ElmJS.HTMLModule {
	#hcallbacks:symbol[] = [];
	
	#elm_hour:HTMLSpanElement;
	#elm_minute:HTMLSpanElement;
	#elm_tick:HTMLSpanElement;

	constructor() {
		super();
		this.toggleAttribute('elm-root', true);
		ElmJS.resolveExports(this);

		this.#elm_hour	 = this.getExportedElement<HTMLSpanElement>('hour')!;
		this.#elm_minute = this.getExportedElement<HTMLSpanElement>('minute')!;
		this.#elm_tick	 = this.getExportedElement<HTMLSpanElement>('tick')!;
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
		this.#elm_tick.classList.toggle('on');
		this.#elm_hour.textContent	 = now.getHours().toString().padStart(2, '0');
		this.#elm_minute.textContent = now.getMinutes().toString().padStart(2, '0');
	}
}

ElmJS.registerModule(ClockWidget, {tagName:'clock-widget', extends:'div'});