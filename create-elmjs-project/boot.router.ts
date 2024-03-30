import {$EventBus, $Router} from "/runtime.js";



export async function init(viewport_selector:string|HTMLElement) {
	const ori_push_state = window.history.pushState;
	window.history.pushState = function(data:any, unused:string, url?:string|URL|null|undefined) {
		ori_push_state.call(window.history, data, unused, url);
		window.emit('pushstate', {state:data})
	};
	window.history.replaceState = function(data:any, unused:string, url?:string|URL|null|undefined) {
		ori_push_state.call(window.history, data, unused, url);
		window.emit('pushstate', {state:data})
	};
	window.on<PopStateEvent>('pushstate', (e)=>RouteChange(e.state));
	window.on<PopStateEvent>('popstate', (e)=>RouteChange(e.state));


	const view_container = typeof viewport_selector === "string" ? document.querySelector(viewport_selector)! : viewport_selector;
	function RouteChange(state:any={}) {
		const path = window.location.pathname;
		const result = $Router.locate<{view:HTMLElement}>(path);
		if ( !result ) {
			throw new Error(`No valid handler for route: ${path}!`);
		}

		
		const dest = result.meta.view;
		if ( !dest ) {
			throw new Error(`This route is not bound to a view: ${path}!`);
		}
		
		
		const curr_views = Array.from(view_container.children);
		for(const view of curr_views) {
			if ( view === dest ) continue;
			
			view.remove();
			dest.emit('state:hide', false);
		}

		view_container.append(dest);
		dest.emit('state:show', {params:result.params, data:state}, false);
	}






	document.body.on('click', (e:Event)=>{
		const target = e.target as HTMLElement;
		if ( !target ) return;

		if ( target.matches('[elm-route], [elm-route] *') ) {
			e.preventDefault(); e.stopPropagation();

			const elm = target.closest<HTMLElement>('[elm-route]')!;
			const route_path = elm.getAttribute('elm-route');
			if ( !route_path ) return;

			setTimeout(()=>window.history.pushState({}, '', route_path));
			return;
		}
		

		
		if ( target.matches('[elm-dialog], [elm-dialog] *') ) {
			e.preventDefault(); e.stopPropagation();

			const elm = target.closest<HTMLElement>('[elm-dialog]')!;
			const dialog_id = elm.getAttribute('elm-dialog');
			if ( !dialog_id ) return;

			setTimeout(()=>$EventBus.emit('dialog:' + dialog_id));
			return;
		}
	});
}