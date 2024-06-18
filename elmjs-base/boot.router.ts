import {$EventBus, $Route} from "/runtime.js";



export async function init() {
	document.body.on('click', (e:Event)=>{
		const target = e.target as HTMLElement;
		if ( !target ) return;

		if ( target.matches('[elm-route], [elm-route] *, [elm-route-replace], [elm-route-replace]') ) {
			e.preventDefault(); e.stopPropagation();

			let replace = false, route_path:string|null = '', elm = target.closest<HTMLElement>('[elm-route]')!;
			if ( elm ) {
				route_path = elm.getAttribute('elm-route');
			}
			else {
				elm = target.closest<HTMLElement>('[elm-route-replace]')!;
				route_path = elm.getAttribute('elm-route-replace');
				replace = true;
			}
			if ( !route_path ) return;

			
			setTimeout(()=>{
				if (!replace) {
					$Route.push(route_path, {});
				}
				else {
					$Route.replace(route_path, {});
				}
			});
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