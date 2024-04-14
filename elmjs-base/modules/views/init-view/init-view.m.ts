import {ElmJS} from "/lib/elmjs.js";
import {$Router} from "/runtime.js";

export class InitView extends ElmJS.HTMLModule {
	constructor() {
		super();

		$Router.route('/', {view:this});
	}
}

ElmJS.registerModule(InitView, {tagName:'init-view', extends:'div'});