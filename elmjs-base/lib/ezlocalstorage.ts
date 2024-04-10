interface DataEncoder {(data:any):string}
interface DataDecoder {(data:string):any}

export class EZLocalStorage {
	static #encoder:DataEncoder = (data)=>JSON.stringify(data);
	static #decoder:DataDecoder = (data)=>JSON.parse(data);

	static get encoder() { return this.#encoder; }
	static set encoder(_encoder:DataEncoder) {
		if ( typeof _encoder !== "function" ) {
			throw new TypeError("Given data encoder must be a function!");
		}

		this.#encoder = _encoder;
	}

	static get decoder() { return this.#decoder; }
	static set decoder(_decoder:DataDecoder) {
		if ( typeof _decoder !== "function" ) {
			throw new TypeError("Given data decoder must be a function!");
		}

		this.#decoder = _decoder;
	}
	
	static get<DataType=any>(item_id:string):DataType|undefined;
	static get<DataType=any>(item_id:string, path_route:string):DataType|undefined;
	static get<DataType=any>(arg1:string, arg2?:string):DataType|undefined {
		let [item_id, path_route] = ( arguments.length > 1 ) ? [arg1, arg2!] : [arg1, undefined];
		if ( typeof path_route !== "undefined" && typeof path_route !== "string" ) {
			throw new TypeError("Given path_root must be a string!");
		}

		const content = localStorage.getItem(item_id);
		if ( typeof content !== "string" ) return undefined;

		const root_data = this.#decoder(content);
		if ( typeof path_route === "undefined" || (path_route = path_route.trim()) === "" ) {
			return root_data as DataType;
		}


		
		const routes = `${path_route}`.split('/');


		let data = root_data;
		for(const part of routes) {
			if ( Object.prototype.toString.call(data) !== '[object Object]' ) {
				return undefined;
			}
			
			data = data[part];
		}

		return data;
	}
	
	static set<DataType=any>(item_id:string, update_data:DataType|undefined):void;
	static set<DataType=any>(item_id:string, path_route:string, update_data:DataType|undefined):void;
	static set<DataType=any>(arg1:string, arg2:DataType|string|undefined, arg3?:DataType|undefined):void {
		if ( arguments.length < 2 ) {
			throw new RangeError(`EasyStorage.set expects at least 2 argument but got ${arguments.length}!`);
		}

		let [item_id, path_route, update_data] = ( arguments.length > 2 ) ? [arg1, arg2 as string, arg3] : [arg1, undefined, arg2 as DataType|undefined];


		
		if ( typeof path_route !== "undefined" && typeof path_route !== "string" ) {
			throw new TypeError("Given path_root must be a string!");
		}

		
		if ( typeof path_route === "undefined" || (path_route = path_route.trim()) === "" ) {
			if ( typeof update_data === "undefined" ) {
				localStorage.removeItem(item_id);
			}
			else {
				localStorage.setItem(item_id, this.#encoder(update_data))
			}
			return;
		}



		const content = localStorage.getItem(item_id);
		const routes = `${path_route}`.split('/');
		const updated_part = routes.pop()!;
		
		let root_data = content ? this.#decoder(content) : undefined;
		{
			if ( typeof root_data === 'undefined' ) root_data = {};
			
			const data_type = Object.prototype.toString.call(root_data);
			if ( data_type !== '[object Object]' ) {
				throw new RangeError(`Unable to set value at route "${path_route}": Data root has ${data_type} type!`);
			}
		}


		let data = root_data, looped_parts:string[] = [];
		for(const part of routes) {
			let part_data = data[part];
			if ( typeof part_data === 'undefined' ) {
				part_data = data[part] = {};
			}
			
			const data_type = Object.prototype.toString.call(part_data);
			if ( data_type !== '[object Object]' ) {
				throw new RangeError(`Unable to set value at route "${path_route}": Route "${looped_parts.join('/')}" has ${data_type} type!`);
			}
			
			data = part_data;
			looped_parts.push(part);
		}
		
		const data_type = Object.prototype.toString.call(data);
		if ( data_type !== '[object Object]' ) {
			throw new RangeError(`Unable to set value at route "${path_route}": Route "${looped_parts.join('/')}" has ${data_type} type!`);
		}

		if ( typeof update_data === "undefined" ) {
			delete data[updated_part];
		}
		else {
			data[updated_part] = update_data;
		}
		
		localStorage.setItem(item_id, this.#encoder(root_data));
	}
}