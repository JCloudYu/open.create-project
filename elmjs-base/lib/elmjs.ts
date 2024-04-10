declare global {
	interface ExportedElementMap {[key:string]:HTMLElement}

	interface Element {
		exportedElements:ExportedElementMap;
		getExportedElement<ElementType=Element>(id:string):ElementType|null;
	}

	interface DocumentFragment {
		exportedElements:ExportedElementMap;
		getExportedElement<ElementType=Element>(id:string):ElementType|null;
	}

	interface EventTarget {
		on<EventType extends Event=Event>(event:string, callback:EventBusEventListener<EventType>):symbol;
		off(symbol:symbol):void;
		off(event:string, callback:{(e:Event):void}):void;
		off(arg1:symbol|string, arg2?:{(e:Event):void}|undefined):void;
		emit(event:string):void;
		emit(event:string, bubbles:boolean):void;
		emit(event:string, data:{[key:string]:any}):void;
		emit(event:string, data:{[key:string]:any}, bubbles:boolean):void;
	}
}

{
	const Ref:WeakMap<Element, ExportedElementMap> = new WeakMap;

	Object.defineProperty(Element.prototype, 'exportedElements', {
		configurable: true, enumerable:false,
		get: function():ExportedElementMap {
			let ref = Ref.get(this);
			if ( !ref ) {
				Ref.set(this, ref={});
			}
			
			return ref;
		}
	});
	
	Object.defineProperty(Element.prototype, 'getExportedElement', {
		configurable:true, enumerable:false, writable:true,
		value: function<ElementType=Element>(id:string):ElementType|null {
			const element = this.exportedElements[id];
			return element ? (element as ElementType) : null;
		}
	});

	Object.defineProperty(DocumentFragment.prototype, 'exportedElements', {
		configurable: true, enumerable:false,
		get: function():ExportedElementMap {
			let ref = Ref.get(this);
			if ( !ref ) {
				Ref.set(this, ref={});
			}
			
			return ref;
		}
	});
	
	Object.defineProperty(DocumentFragment.prototype, 'getExportedElement', {
		configurable:true, enumerable:false, writable:true,
		value: function<ElementType=Element>(id:string):ElementType|null {
			const element = this.exportedElements[id];
			return element ? (element as ElementType) : null;
		}
	});
}

{
	Object.defineProperties(EventTarget.prototype, {
		on: {
			configurable:true, enumerable:false, writable:true,
			value: function(event:string, callback:EventBusEventListener):symbol {
				const handler_symbol = Symbol(handler_count++);
				HandlerRef.set(handler_symbol, {event, func:callback});
				
				this.addEventListener(event, callback);
				return handler_symbol;
			}
		},
		off: {
			configurable:true, enumerable:false, writable:true,
			value: function(arg1:symbol|string, arg2?:{(e:Event):void}|undefined):void {
				if ( typeof arg1 === "string" ) {
					this.removeEventListener(arg1, arg2!);
					return;
				}
				
				const ref = HandlerRef.get(arg1);
				if ( !ref ) return;
		
				HandlerRef.delete(arg1);
				this.removeEventListener(ref.event, ref.func);
			}
		},
		emit: {
			configurable:true, enumerable:false, writable:true,
			value: function(event:string, data?:boolean|{[key:string]:any}, bubbles?:boolean):void {
				if ( typeof data === "boolean" ) {
					bubbles = data;
					data = {};
				}

				bubbles = bubbles === undefined ? true : !!bubbles;
				this.dispatchEvent(Object.assign(new Event(event, {bubbles}), data||{}))
			}
		}
	});
}






export interface EventBusEventListener<EventType extends Event = Event> {(e:EventType):void}


let handler_count:number = 0;
const HandlerRef:Map<Symbol, {event:string; func:EventBusEventListener<any>}> = new Map();
const ModuleViews:Record<string, string> = Object.create(null);
class HTMLModule extends HTMLElement {
	#init:boolean = false;

	constructor() {
		super();
		
		const view_key = this.tagName.toUpperCase()
		const view_html = ModuleViews[view_key];
		if ( view_html !== undefined ) {
			const temp_elm = document.createElement('template');
			temp_elm.innerHTML = view_html;
			if ( temp_elm.content.children.length > 0 ) {
				const module_elm = temp_elm.content.children[0] as HTMLElement;
				const new_elm = document.createElement('template');
				new_elm.innerHTML = module_elm.innerHTML;

				const classes:string[] = [];
				for(const cls_name of this.classList) classes.push(cls_name);

				const styles:{[k:string]:string} = {};
				for(let i=0; i<this.style.length; i++) {
					const name = this.style[i];
					styles[name] = this.style.getPropertyValue(name);
				}

				for(const attr of module_elm.attributes) this.setAttribute(attr.name, attr.value);
				for(const name of classes) this.classList.add(name);
				for(const entry of Object.entries(styles)) this.style.setProperty(entry[0], entry[1]);

				this.appendChild(new_elm.content)
			}
		}
	}
	
	connectedCallback() {
		if ( !this.#init ) {
			this.init();
			this.#init = true;
		}
		this.mounted();
	}
	adoptedCallback() { this.remounted(); }
	disconnectedCallback() { this.unmounted(); }
	attributeChangedCallback(attr:string, prev:string, curr:string) {
		this.propchanged(attr, prev, curr);
	}

	
	init() {

	}
	mounted() {

	}
	remounted() {
		
	}
	unmounted() {

	}
	propchanged(attr:string, prev:string, curr:string) {

	}
}

interface RegisterOptions { tagName:string; view?:string; };
export class ElmJS {
	static get HTMLModule() { return HTMLModule }
	
	static createElement<ElementType extends Element=Element>(html:string, resolve_exports:boolean=true):ElementType|null {
		const template = document.createElement('template');
		template.innerHTML = html.trim();
		if ( template.content.children.length > 1 ) {
			throw new RangeError("Given html string must contains only one element!");
		}

		const element = template.content.children[0] as ElementType;
		if ( !element ) return null;

		template.content.removeChild(element);

		return resolve_exports ? this.resolveExports(element) : element;
	}
	static createElements(html:string, resolve_exports:boolean=true):DocumentFragment {
		const template = document.createElement('template');
		template.innerHTML = html.trim();
		return resolve_exports ? template.content : this.resolveExports(template.content);
	}
	static createElementsAtAnchor(anchor_selector:string, html:string, options:{resolveExports?:boolean, keepAnchor?:boolean}={}):void {
		const resolve_exports = options.resolveExports === undefined ? true : !!options.resolveExports;
		const keep_anchor = options.keepAnchor === undefined ? false : !!options.keepAnchor;


		const anchor = document.querySelector(anchor_selector)!;
		const fragment = this.createElements(html, resolve_exports);

		
		let looper = anchor;
		for(const frag of Array.prototype.slice.call(fragment.children)) {
			looper.insertAdjacentElement('afterend', frag as HTMLElement);
			looper = frag;
		}
	
		if ( !keep_anchor ) {
			anchor.remove();
		}
	}

	static resolveExports<ElementType extends Element=Element>(root_element:ElementType, force_subcontext?:boolean):ElementType;
	static resolveExports(root_element:DocumentFragment, force_subcontext?:boolean):DocumentFragment;
	static resolveExports(root_element:Element|DocumentFragment, force_subcontext:boolean=false):Element|DocumentFragment {
		if ( !(root_element instanceof Element) && !(root_element instanceof DocumentFragment) ) {
			throw new TypeError("Given argument must be an Element or a DocumentFragment or an Element array");
		}
	
		
		Object.keys(root_element.exportedElements).forEach((key)=>delete root_element.exportedElements[key]);
		RecursiveParseRelations(root_element, root_element.exportedElements, force_subcontext);
	
		return root_element;
	}

	static registerModule(class_inst:typeof HTMLModule, options:RegisterOptions&ElementDefinitionOptions):typeof HTMLModule {
		const extended = (typeof options.extends === "undefined") ? {extends:options.extends} : undefined;
		if ( options.view ) {
			this.registerModuleView(options.tagName.toUpperCase(), options.view);
		}
		window.customElements.define(options.tagName, class_inst, extended);

		return class_inst;
	}

	static registerModuleView(tagName:string, content:string):void;
	static registerModuleView(tagName:Record<string, string>):void;
	static registerModuleView(arg1:string|Record<string, string>, arg2?:string):void {
		if ( arguments.length > 1 ) {
			ModuleViews[`${arg1}`.toUpperCase()] = `${arg2}`;
			return;
		}
		
		for(const entry of Object.entries(arg1 as Record<string, string>)) {
			ModuleViews[entry[0].toUpperCase()] = `${entry[1]}`;
		}
	}
}




function RecursiveParseRelations(root:Element|DocumentFragment, root_map:ExportedElementMap, force_subcontext:boolean):void {
	for(const element of root.children) {
		const export_name = (element.getAttribute('elm-export')||'').trim();
		const var_name = (element.getAttribute('elm-var')||'').trim();

		if ( export_name ) root_map[export_name] = element as HTMLElement;
		if ( var_name ) root.exportedElements[var_name] = element as HTMLElement;
	}

	for(const element of root.children) {
		const is_root = element.hasAttribute('elm-root');

		if ( !is_root ) {
			RecursiveParseRelations(element, root_map, force_subcontext)
		}
		
		if ( force_subcontext ) {
			Object.keys(element.exportedElements).forEach((key)=>delete element.exportedElements[key]);
			RecursiveParseRelations(element, element.exportedElements, force_subcontext);
		}
	}
}