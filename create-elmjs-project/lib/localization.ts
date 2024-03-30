export interface LocaleTemplate {(data?:string|{[vname:string]:any}):string};
export interface LocaleMap {[translate_key:string]:LocaleTemplate};

export class Localization {
	static #localeId:string = '';
	static #localeMap:LocaleMap = {};

	static parseLangId(id:string):{lang:string; country?:string} {
		const [lang, country] = navigator.language.toLowerCase().split(/[-_]/);
		return {lang, country};
	}

	static get localeId() {
		return this.#localeId;
	}

	static get localeMap() {
		return this.#localeMap;
	}

	static setLocale(localeId:string, localeMap:LocaleMap) {
		this.#localeId = localeId;
		this.#localeMap = localeMap;
	}

	static trans(key:string, data?:string|{[vname:string]:any}):string {
		const template = this.#localeMap[key];
		return (!template) ? key : template(data);
	}

	static transElement(element:Element|DocumentFragment, data?:string|{[vname:string]:any}) {
		// Search for all candidates
		const root_elements = (element instanceof DocumentFragment) ? Array.from(element.children) : [element];
		const elements: Element[] = [];
		for(const elm of root_elements) {
			const results = GetElementsByXPath('//*[@*[starts-with(name(), "elm-trans")]]', elm);
			elements.push(...results);
		}
		if ( !(element instanceof DocumentFragment) ) { elements.unshift(element) };
		

		
		for(const elm of elements) {
			// Check if candidates are true positives
			const attributes = elm.getAttributeNames().map((v)=>{
				const parts = v.split(':').map(i=>i.trim());
				return parts.length > 1 ? {raw:v, trans_key:parts[0], attr:parts[1]} : {raw:v, trans_key:parts[0]};
			}).filter(i=>(i.trans_key==='elm-trans')||(i.trans_key==='elm-trans-html'));
			if ( !attributes ) continue;



			for(const attr of attributes) {
				if ( attr.attr === undefined ) {
					if ( attr.trans_key === 'elm-trans' ) {
						elm.textContent = this.trans(elm.getAttribute(attr.raw)!, data);
					}
					else {
						elm.innerHTML = this.trans(elm.getAttribute(attr.raw)!, data);
					}
				}
				else
				if ( attr.trans_key === 'elm-trans' ) {
					elm.setAttribute(attr.attr, this.trans(elm.getAttribute(attr.raw)!, data));
				}
			}
		}
	}
}

export function BuildTemplate(strings:TemplateStringsArray, ...var_names:string[]):LocaleTemplate {
	return function(data?:string|{[vname:string]:any}):string {
		const data_map = (( Object.prototype.toString.call(data) !== "[object Object]" ) ? data = {'%s':data||'' } : data) as {[key:string]:any};
		const vars = Array.from(var_names).reverse();
		const strs = Array.from(strings).reverse();

		let result = strs.shift()!;
		for(const vname of vars) {
			const string = strs.pop()!;
			result += string + ((data_map[vname]||vname).toString());
		}

		return result;
	};
}

function GetElementsByXPath(xpath:string, parent:Element) {
	let results:Element[] = [];
	const query = document.evaluate(
		xpath, parent,
		null, 
		XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, 
		null
	);
	for (let i = 0, length = query.snapshotLength; i < length; ++i) {
		results.push(query.snapshotItem(i) as Element);
	}
	return results;
}

function sprintf(format:string, ...args:any[]) {
	return format.replace(/%s/g, ()=>(args.shift()||'').toString());
}