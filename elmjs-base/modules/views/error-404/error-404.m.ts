import {ElmJS} from "/lib/elmjs.js";
import {$Router} from "/runtime.js";

export class Error404 extends ElmJS.HTMLModule {
	constructor() {
		super();

		$Router.route('/error/404', {view:this});
	}
}

ElmJS.registerModule(Error404, {tagName:'error-404'});