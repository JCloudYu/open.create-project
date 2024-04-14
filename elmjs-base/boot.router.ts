import {$EventBus, $Route} from "/runtime.js";



export async function init(view_manager:string|EventTarget) {
	document.body.on('click', (e:Event)=>{
		const target = e.target as HTMLElement;
		if ( !target ) return;

		if ( target.matches('[elm-route], [elm-route] *') ) {
			e.preventDefault(); e.stopPropagation();

			const elm = target.closest<HTMLElement>('[elm-route]')!;
			const route_path = elm.getAttribute('elm-route');
			if ( !route_path ) return;

			setTimeout(()=>$Route.push(route_path, {}));
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