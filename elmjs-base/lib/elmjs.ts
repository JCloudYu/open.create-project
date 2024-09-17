declare global {
	interface ExportedElementMap<ElementType=HTMLElement> {[key:string]:ElementType}

	interface Element {
		sharedDataStore:Record<string, any>;
		getSharedData<ReturnType=any>(prop:string|symbol):ReturnType|undefined;

		hiddenData:Record<string, any>;
		getHiddenData<ReturnType=any>(prop:string|symbol):ReturnType|undefined;

		exportedElements:ExportedElementMap;
		getExportedElement<ElementType=HTMLElement>(id:string):ElementType|null;
	}

	interface DocumentFragment {
		exportedElements:ExportedElementMap;
		getExportedElement<ElementType=HTMLElement>(id:string):ElementType|null;
	}

	interface EventTarget {
		on<EventType extends Event=Event>(event:string, callback:EventBusEventListener<EventType>):symbol;
		once<EventType extends Event=Event>(event:string, callback:EventBusEventListener<EventType>):symbol;
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
		configurable:false, enumerable:false,
		get: function():ExportedElementMap {
			let ref = Ref.get(this);
			if ( !ref ) {
				Ref.set(this, ref={});
			}
			
			return ref;
		}
	});
	
	Object.defineProperty(Element.prototype, 'getExportedElement', {
		configurable:false, enumerable:false, writable:false,
		value: function<ElementType=HTMLElement>(id:string):ElementType|null {
			const element = this.exportedElements[id];
			return element ? (element as ElementType) : null;
		}
	});

	Object.defineProperty(DocumentFragment.prototype, 'exportedElements', {
		configurable:false, enumerable:false,
		get: function():ExportedElementMap {
			let ref = Ref.get(this);
			if ( !ref ) {
				Ref.set(this, ref={});
			}
			
			return ref;
		}
	});
	
	Object.defineProperty(DocumentFragment.prototype, 'getExportedElement', {
		configurable:false, enumerable:false, writable:false,
		value: function<ElementType=HTMLElement>(id:string):ElementType|null {
			const element = this.exportedElements[id];
			return element ? (element as ElementType) : null;
		}
	});
}

{
	const Ref:WeakMap<Element, Record<string|symbol, any>> = new WeakMap;
	const ProxyHandler:ProxyHandler<any> = {
		getPrototypeOf(target) {
			let ref = Ref.get(target)!;
			if ( !ref ) Ref.set(target, ref={});

			return Object.getPrototypeOf(ref);
		},
		deleteProperty(target, prop) {
			let ref = Ref.get(target)!;
			if ( !ref ) Ref.set(target, ref={});

			delete ref[prop];
			return true;
		},
		set(target, prop, value) {
			let ref = Ref.get(target)!;
			if ( !ref ) Ref.set(target, ref={});

			ref[prop] = value;
			return true;
		},
		get(target, prop) {
			return __get_var(target, prop);
		}
	};

	Object.defineProperty(Element.prototype, 'sharedDataStore', {
		configurable: false, enumerable:false,
		get: function():ExportedElementMap {
			return new Proxy(this, ProxyHandler);
		}
	});
	
	Object.defineProperty(Element.prototype, 'getSharedData', {
		configurable:false, enumerable:false, writable:false,
		value: function<ReturnType=any>(field_name:string|symbol):ReturnType|undefined {
			return __get_var<ReturnType>(this, field_name);
		}
	});


	function __get_var<ReturnType=any>(target:Element, prop:string|symbol):ReturnType|undefined {
		let ref_target:Element|null = target;
		while(ref_target) {
			let ref = Ref.get(ref_target)!;
			if ( !ref ) Ref.set(ref_target, ref={});			
			if (ref[prop] !== undefined) {
				return ref[prop];
			}

			ref_target = ref_target.parentNode as Element|null;
		}

		return undefined;
	}
}

{
	const Ref:WeakMap<Element, Record<string|symbol, any>> = new WeakMap;

	Object.defineProperty(Element.prototype, 'hiddenData', {
		configurable: false, enumerable:false,
		get: function():ExportedElementMap {
			let ref = Ref.get(this)!;
			if ( !ref ) Ref.set(this, ref={});
			return ref;
		}
	});
	
	Object.defineProperty(Element.prototype, 'getHiddenData', {
		configurable:false, enumerable:false, writable:true,
		value: function<ReturnType=any>(field_name:string|symbol):ReturnType|undefined {
			let ref = Ref.get(this)!;
			if ( !ref ) Ref.set(this, ref={});

			return ref[field_name];
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
		once: {
			configurable:true, enumerable:false, writable:true,
			value: function(event:string, callback:EventBusEventListener):symbol {
				const handler_symbol = Symbol(handler_count++);
				HandlerRef.set(handler_symbol, {event, func:callback});
				
				
				this.addEventListener(event, (e:Event)=>{
					HandlerRef.delete(handler_symbol);
					callback(e);
				});
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
		ElmJS.decorateModuleView(this, this.tagName.toUpperCase());
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
	
	static createElement<ElementType extends Element=HTMLElement>(html:string|HTMLTemplateElement, resolve_exports:boolean=true):ElementType|null {
		let template:HTMLTemplateElement;

		if ( typeof html !== "string" ) {
			if ( html.tagName !== "TEMPLATE" ) {
				throw new TypeError("Given element source must be a html string or a HTMLTemplateElement");
			}

			template = html.cloneNode(true) as HTMLTemplateElement;
		}
		else {
			template = document.createElement('template');
			template.innerHTML = html.trim();
		}

		if ( template.content.children.length > 1 ) {
			throw new RangeError("Given html string must contains only one element!");
		}

		const element = template.content.children[0] as ElementType;
		if ( !element ) return null;

		template.content.removeChild(element);

		return resolve_exports ? this.resolveExports(element) : element;
	}
	static createElements(html:string|HTMLTemplateElement, resolve_exports:boolean=true):DocumentFragment {
		let template:HTMLTemplateElement;
		if ( typeof html !== "string" ) {
			if ( html.tagName !== "TEMPLATE" ) {
				throw new TypeError("Given element source must be a html string or a HTMLTemplateElement");
			}

			template = html.cloneNode(true) as HTMLTemplateElement;
		}
		else {
			template = document.createElement('template');
			template.innerHTML = html.trim();
		}

		return resolve_exports ? template.content : this.resolveExports(template.content);
	}
	static createElementsAtAnchor(anchor_selector:string, html:string|HTMLTemplateElement, options:{resolveExports?:boolean, keepAnchor?:boolean}={}):void {
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

	static resolveExports<ElementType extends Element=HTMLElement>(root_element:ElementType, force_subcontext?:boolean):ElementType;
	static resolveExports(root_element:DocumentFragment, force_subcontext?:boolean):DocumentFragment;
	static resolveExports(root_element:Element|DocumentFragment, force_subcontext:boolean=false):Element|DocumentFragment {
		if ( !(root_element instanceof Element) && !(root_element instanceof DocumentFragment) ) {
			throw new TypeError("Given argument must be an Element or a DocumentFragment or an Element array");
		}
	
		
		Object.keys(root_element.exportedElements).forEach((key)=>delete root_element.exportedElements[key]);
		RecursiveParseRelations(root_element, root_element.exportedElements, force_subcontext);
	
		return root_element;
	}

	static registerModule<InstType extends CustomElementConstructor = typeof HTMLModule>(class_inst:InstType, options:RegisterOptions):InstType {
		if ( options.view ) {
			this.registerModuleView(options.tagName.toUpperCase(), options.view);
		}

		window.customElements.define(options.tagName, class_inst);
		return class_inst;
	}

	static registerBuiltInModule<InstType extends CustomElementConstructor = typeof HTMLDivElement>(class_inst:InstType, options:RegisterOptions&Required<ElementDefinitionOptions>) {
		if ( !options.extends ) {
			throw new TypeError("extends option is required to initialize a built-in moudle!");
		}
		
		if ( options.view ) {
			this.registerModuleView(options.tagName.toUpperCase(), options.view);
		}

		window.customElements.define(options.tagName, class_inst, {extends:options.extends});
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

	static getModuleView(tagName:string):string|undefined {
		return ModuleViews[`${tagName}`.toUpperCase()]||undefined;
	}

	static decorateModuleView(elm:HTMLElement, tagName:string):boolean {
		const view_html = ModuleViews[`${tagName}`.toUpperCase()]||undefined;
		if ( !view_html ) return false;
		
		const temp_elm = document.createElement('template');
		temp_elm.innerHTML = view_html;
		if ( temp_elm.content.children.length <= 0 ) return false;

		const module_elm = temp_elm.content.children[0] as HTMLElement;
		const new_elm = document.createElement('template');
		new_elm.innerHTML = module_elm.innerHTML;

		const classes:string[] = [];
		for(const cls_name of elm.classList) classes.push(cls_name);

		const styles:{[k:string]:string} = {};
		for(let i=0; i<elm.style.length; i++) {
			const name = elm.style[i];
			styles[name] = elm.style.getPropertyValue(name);
		}

		for(const attr of module_elm.attributes) elm.setAttribute(attr.name, attr.value);
		for(const name of classes) elm.classList.add(name);
		for(const entry of Object.entries(styles)) elm.style.setProperty(entry[0], entry[1]);

		elm.appendChild(new_elm.content);
		return true;
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