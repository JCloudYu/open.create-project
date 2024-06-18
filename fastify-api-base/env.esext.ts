declare global {
	// JSON
	interface JSON {
		encode: { <DataType = any>(data: DataType): string };
		decode: { <DataType = any>(json_str: string): DataType | undefined };
	}
}
JSON.encode = function(data) {
	return JSON.stringify(data);
};
JSON.decode = function(json) {
	try {
		return JSON.parse(json);
	} catch (e) { return undefined; }
}


declare global {
	// Date
	interface DateConstructor {
		present: Date;
		from(value: number | string): Date;
		unix(): number;
		zoneShift(): number;
	}
	interface Date {
		unix: number;
		time: number;
		zoneShift: number;
		getUnixTime(): number;
		toLocaleISOString(milli?: boolean): string;
		toLocalISOString(milli?: boolean): string;
	}
}
Object.defineProperty(Date, 'from', {
	configurable: true, enumerable: false, writable: true,
	value: function(value: string | number) {
		return new Date(value);
	}
})
Object.defineProperty(Date, 'unix', {
	configurable: true, enumerable: false, writable: true,
	value: function() {
		return Math.floor(Date.now() / 1000);
	}
});
Object.defineProperty(Date, 'zoneShift', {
	configurable: true, enumerable: false, writable: true,
	value: function() {
		let date = new Date();
		return date.getTimezoneOffset() * 60000;
	}
});
Object.defineProperty(Date, 'present', {
	configurable: true, enumerable: false,
	get: function() { return new Date(); }
});
Object.defineProperty(Date.prototype, 'getUnixTime', {
	configurable: true, enumerable: false, writable: true,
	value: function() {
		return Math.floor(this.getTime() / 1000);
	}
});
Object.defineProperty(Date.prototype, 'toLocaleISOString', {
	configurable: true, enumerable: false, writable: true,
	value: function(show_milli: boolean = false) {
		show_milli = !!show_milli;
		let offset, zone = this.getTimezoneOffset();
		if (zone === 0) {
			offset = 'Z';
		}
		else {
			let sign = zone > 0 ? '-' : '+';
			zone = Math.abs(zone);
			let zone_hour = ('' + Math.floor(zone / 60)).padStart(2, '0');
			let zone_min = ('' + (zone % 60)).padStart(2, '0');
			offset = sign + zone_hour + zone_min;
		}

		let milli = show_milli ? ('.' + ('' + (this.getMilliseconds() % 1000)).padStart(3, '0')) : '';
		return this.getFullYear() +
			'-' + ('' + (this.getMonth() + 1)).padStart(2, '0') +
			'-' + ('' + (this.getDate())).padStart(2, '0') +
			'T' + ('' + (this.getHours())).padStart(2, '0') +
			':' + ('' + (this.getMinutes())).padStart(2, '0') +
			':' + ('' + (this.getSeconds())).padStart(2, '0') +
			milli + offset;
	}
});
Object.defineProperty(Date.prototype, 'toLocalISOString', {
	configurable: true, enumerable: false, writable: true,
	value: function(show_milli: boolean = false) {
		show_milli = !!show_milli;
		let offset, zone = this.getTimezoneOffset();
		if (zone === 0) {
			offset = 'Z';
		}
		else {
			let sign = zone > 0 ? '-' : '+';
			zone = Math.abs(zone);
			let zone_hour = ('' + Math.floor(zone / 60)).padStart(2, '0');
			let zone_min = ('' + (zone % 60)).padStart(2, '0');
			offset = sign + zone_hour + zone_min;
		}

		let milli = show_milli ? ('.' + ('' + (this.getMilliseconds() % 1000)).padStart(3, '0')) : '';
		return this.getFullYear() +
			'-' + ('' + (this.getMonth() + 1)).padStart(2, '0') +
			'-' + ('' + (this.getDate())).padStart(2, '0') +
			'T' + ('' + (this.getHours())).padStart(2, '0') +
			':' + ('' + (this.getMinutes())).padStart(2, '0') +
			':' + ('' + (this.getSeconds())).padStart(2, '0') +
			milli + offset;
	}
});
Object.defineProperty(Date.prototype, 'unix', {
	configurable: true, enumerable: false,
	get: function() {
		return Math.floor(this.getTime() / 1000);
	}
});
Object.defineProperty(Date.prototype, 'time', {
	configurable: true, enumerable: false,
	get: function() {
		return this.getTime();
	}
});
Object.defineProperty(Date.prototype, 'zoneShift', {
	configurable: true, enumerable: false,
	get: function() {
		return this.getTimezoneOffset() * 60000;
	}
});



// Error
declare global {
	interface Error {
		stack_trace: string[];
	}
}
if (typeof Error !== "undefined") {
	Object.defineProperty(Error.prototype, 'stack_trace', {
		enumerable: false,
		configurable: true,
		get: function() {
			if (!this.stack)
				return [];
			return this.stack.split(/\r\n|\n/g).map(function(item: string) { return item.trim(); });
		}
	});
}



// String
declare global {
	interface StringConstructor {
		utf8Encode:{(str:string, pure_js?:boolean):Uint8Array};
		utf8Decode:{(buff:ArrayBuffer|BufferView, pure_js?:boolean):string};
	}
}
(()=>{
	const encoder = typeof TextEncoder !== "undefined" ? new TextEncoder() : null;
	const decoder = typeof TextDecoder !== "undefined" ? new TextDecoder() : null;

	Object.defineProperty(String, 'utf8Encode', {
		configurable:false, enumerable:false, writable:true,
		value: function(js_str:string, pure_js:boolean=false) {
			if (typeof js_str !== "string") {
				throw new TypeError("Given input argument must be a js string!");
			}

			if ( !pure_js && encoder ) {
				return encoder.encode(js_str);
			}

			let code_points = [];
			for (let i = 0; i < js_str.length;) {
				let point = js_str.codePointAt(i)!;
				// 1-byte sequence
				if ((point & 0xffffff80) === 0) {
					code_points.push(point);
				}
				// 2-byte sequence
				else if ((point & 0xfffff800) === 0) {
					code_points.push(0xc0 | (0x1f & (point >> 6)), 0x80 | (0x3f & point));
				}
				// 3-byte sequence
				else if ((point & 0xffff0000) === 0) {
					code_points.push(0xe0 | (0x0f & (point >> 12)), 0x80 | (0x3f & (point >> 6)), 0x80 | (0x3f & point));
				}
				// 4-byte sequence
				else if ((point & 0xffe00000) === 0) {
					code_points.push(0xf0 | (0x07 & (point >> 18)), 0x80 | (0x3f & (point >> 12)), 0x80 | (0x3f & (point >> 6)), 0x80 | (0x3f & point));
				}
				i += (point > 0xFFFF) ? 2 : 1;
			}
			return new Uint8Array(code_points);
		}
	});


	const UTF8_DECODE_CHUNK_SIZE = 100;
	Object.defineProperty(String, 'utf8Decode', {
		configurable:true, enumerable:false, writable:true,
		value: function(uint8:ArrayBuffer|BufferView, pure_js:boolean=false) {
			if (uint8 instanceof ArrayBuffer) {
				uint8 = new Uint8Array(uint8);
			}
			
			if ( ArrayBuffer.isView(uint8) ) {
				uint8 = new Uint8Array(uint8.buffer);
			}

			if (!(uint8 instanceof Uint8Array)) {
				throw new TypeError("Given input must be an Uint8Array contains UTF8 encoded value!");
			}
			
			if ( !pure_js && decoder ) {
				return decoder.decode(uint8);
			}
			

			
			let code_points = [];
			for (let i = 0; i < uint8.length;) {
				let codePoint = uint8[i] & 0xff;
				// 1-byte sequence (0 ~ 127)
				if ((codePoint & 0x80) === 0) {
					code_points.push(codePoint);
					i += 1;
				}
				// 2-byte sequence (192 ~ 223)
				else if ((codePoint & 0xE0) === 0xC0) {
					codePoint = ((0x1f & uint8[i]) << 6) | (0x3f & uint8[i + 1]);
					code_points.push(codePoint);
					i += 2;
				}
				// 3-byte sequence (224 ~ 239)
				else if ((codePoint & 0xf0) === 0xe0) {
					codePoint = ((0x0f & uint8[i]) << 12)
						| ((0x3f & uint8[i + 1]) << 6)
						| (0x3f & uint8[i + 2]);
					code_points.push(codePoint);
					i += 3;
				}
				// 4-byte sequence (249 ~ )
				else if ((codePoint & 0xF8) === 0xF0) {
					codePoint = ((0x07 & uint8[i]) << 18)
						| ((0x3f & uint8[i + 1]) << 12)
						| ((0x3f & uint8[i + 2]) << 6)
						| (0x3f & uint8[i + 3]);
					code_points.push(codePoint);
					i += 4;
				}
				else {
					i += 1;
				}
			}
			let result_string = "";
			while (code_points.length > 0) {
				let chunk = code_points.splice(0, UTF8_DECODE_CHUNK_SIZE);
				result_string += String.fromCodePoint.apply(String, chunk);
			}
			return result_string;
		}
	});
})();



// Typed Array
declare global {
	type BufferView = Uint8ClampedArray | Uint8Array | Int8Array | Uint16Array | Int16Array | Uint32Array | Int32Array | Float32Array | Float64Array | DataView;
	type BinaryConversionType_Numeric = 2|16|32|62|64;
	type BinaryConversionType_String = 'bits'|'hex'|'b32hex'|'b62hex'|'base64'|'b64url'|'utf8';
	type BinaryConversionType = BinaryConversionType_Numeric|BinaryConversionType_String;
	interface ArrayBuffer {
		bytes: Uint8Array;
	}
	interface Uint8ArrayConstructor {
		readFrom(data: ArrayBuffer | BufferView | number[]): Uint8Array;
		readFrom(data: string, conversion:BinaryConversionType): Uint8Array;
		binaryCompare(a: ArrayBuffer | BufferView, b: ArrayBuffer | BufferView): -1 | 0 | 1;
		binaryFrom(data: ArrayBuffer | BufferView | number[]): Uint8Array;
		binaryFrom(data: string, conversion:BinaryConversionType): Uint8Array;
		binaryDump(buffer: ArrayBuffer | BufferView, format?:BinaryConversionType, padding?: boolean): string;
		binaryConcat(buffers:(ArrayBuffer|BufferView)[]):Uint8Array;
	}
}
(function(){
	const BIT_FORMAT = /^(0b|0B)?([01]+)$/;
	
	const HEX_FORMAT = /^(0x)?([0-9a-fA-F]+)$/;
	const HEX_MAP = "0123456789abcdef";
	const HEX_MAP_R:{[enc:string]:number} = Object.fromEntries(
		HEX_MAP.split('').map((v, i)=>[v,i]).concat(
			HEX_MAP.substring(10).toUpperCase().split('').map((v,i)=>[v,i])
		)
	);

	const B32HEX_FORMAT = /^([0-9a-vA-V]+)$/;
	const B32HEX_MAP = "0123456789abcdefghijklmnopqrstuv";
	const B32HEX_MAP_R:{[enc:string]:number} = Object.fromEntries(
		B32HEX_MAP.split('').map((v, i)=>[v,i]).concat(
			B32HEX_MAP.substring(10).toUpperCase().split('').map((v,i)=>[v,i])
		)
	);

	const B62HEX_FORMAT = /^([0-9a-zA-Z]+)$/;
	const B62HEX_MAP = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
	const B62HEX_MAP_R:{[enc:string]:number} = Object.fromEntries(B62HEX_MAP.split('').map((v, i)=>[v,i]));

	const B64_FORMAT = /^([0-9a-zA-Z-_+/]+)={0,2}$/;
	const B64MAP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
	const B64URLMAP = B64MAP.substring(0, B64MAP.length-2) + '-_';
	const B64MAP_R:{[enc:string]:number} = Object.fromEntries(B64MAP.split('').map((v, i)=>[v,i]).concat([['-', 62], ['_', 63]]));
	

	Object.defineProperty(ArrayBuffer.prototype, 'bytes', {
		configurable:true, enumerable:false, 
		get: function() { return new Uint8Array(this); }
	});


	Object.defineProperty(Uint8Array, 'binaryDump', {
		configurable: true, enumerable: false, writable: true,
        value: function (buffer:ArrayBuffer|BufferView, format?:BinaryConversionType):string {
            if (format === void 0) { format = 16; }
            let bytes = ExtractBytes(buffer);
            if (bytes === null) {
                throw new TypeError("Argument 1 expects an instance of ArrayBuffer, TypedArray or DataView!");
            }
			
            let result = '';
			if ( bytes.length < 1 ) return result;

            switch (format) {
				case 64: 
				case 'base64': 
				case 'b64url': {
					const is_b64url = format === 'b64url';
					const ENCODE_MAP = is_b64url ? B64URLMAP : B64MAP;

					var v1, v2, v3, base64Str = '', length = bytes.length;
					for( var i = 0, count = ((length/3)>>>0) * 3; i < count; ){
						v1 = bytes[i++];
						v2 = bytes[i++];
						v3 = bytes[i++];
						base64Str += ENCODE_MAP[v1 >>> 2] +
							ENCODE_MAP[(v1 << 4 | v2 >>> 4) & 63] +
							ENCODE_MAP[(v2 << 2 | v3 >>> 6) & 63] +
							ENCODE_MAP[v3 & 63];
					}
					
					// remain char
					var remain = length - count;
					if( remain === 1 ){
						v1 = bytes[i];
						base64Str += ENCODE_MAP[v1 >>> 2] + ENCODE_MAP[(v1 << 4) & 63];
						
						if ( !is_b64url ) { base64Str += '=='; }
					}
					else if( remain === 2 ){
						v1 = bytes[i++];
						v2 = bytes[i];
						base64Str += ENCODE_MAP[v1 >>> 2] +
							ENCODE_MAP[(v1 << 4 | v2 >>> 4) & 63] +
							ENCODE_MAP[(v2 << 2) & 63];
							
						if ( !is_b64url ) { base64Str += '='; }
					}
					return base64Str;
				}
				case 62:
				case 'b62hex': {
					let data:string[] = [], zeros:string = '', end = 0;
					for(; end<bytes.length; end++) {
						if ( bytes[end] !== 0x00 ) break;
						zeros += '0';
					}

					let i = bytes.length-1, pow = 0, num = 0n;
					while(i>=end) {
						num += BigInt(bytes[i]) * (256n**BigInt(pow));
						i--; pow++;
					}

					while(num > 0n) {
						data.push(B62HEX_MAP[Number(num%62n)]);
						num /= 62n;
					}
					return zeros + data.reverse().join('');
				}
				case 32: 
				case 'b32hex': {
					// Run complete bundles
					let begin, loop = Math.floor(bytes.length/5);
					for (let run=0; run<loop; run++) {
						begin = run * 5;
						result += B32HEX_MAP[  bytes[begin]           >> 3];								// 0
						result += B32HEX_MAP[ (bytes[begin  ] & 0x07) << 2 | (bytes[begin+1] >> 6)];	// 1
						result += B32HEX_MAP[ (bytes[begin+1] & 0x3E) >> 1];								// 2
						result += B32HEX_MAP[ (bytes[begin+1] & 0x01) << 4 | (bytes[begin+2] >> 4)];	// 3
						result += B32HEX_MAP[ (bytes[begin+2] & 0x0F) << 1 | (bytes[begin+3] >> 7)];	// 4
						result += B32HEX_MAP[ (bytes[begin+3] & 0x7C) >> 2];								// 5
						result += B32HEX_MAP[ (bytes[begin+3] & 0x03) << 3 | (bytes[begin+4] >> 5)];	// 6
						result += B32HEX_MAP[  bytes[begin+4] & 0x1F];										// 7
					}
					
					// Run remains
					let remain = bytes.length % 5;
					if ( remain === 0 ) { return result; }
					
					
					begin = loop*5;
					if ( remain === 1 ) {
						result += B32HEX_MAP[  bytes[begin]           >> 3];								// 0
						result += B32HEX_MAP[ (bytes[begin  ] & 0x07) << 2];								// 1
					}
					else
					if ( remain === 2 ) {
						result += B32HEX_MAP[  bytes[begin]           >> 3];								// 0
						result += B32HEX_MAP[ (bytes[begin  ] & 0x07) << 2 | (bytes[begin+1] >> 6)];	// 1
						result += B32HEX_MAP[ (bytes[begin+1] & 0x3E) >> 1];								// 2
						result += B32HEX_MAP[ (bytes[begin+1] & 0x01) << 4];								// 3
					}
					else
					if ( remain === 3 ) {
						result += B32HEX_MAP[  bytes[begin]           >> 3];								// 0
						result += B32HEX_MAP[ (bytes[begin  ] & 0x07) << 2 | (bytes[begin+1] >> 6)];	// 1
						result += B32HEX_MAP[ (bytes[begin+1] & 0x3E) >> 1];								// 2
						result += B32HEX_MAP[ (bytes[begin+1] & 0x01) << 4 | (bytes[begin+2] >> 4)];	// 3
						result += B32HEX_MAP[ (bytes[begin+2] & 0x0F) << 1];								// 4
					}
					else
					if ( remain === 4 ) {
						result += B32HEX_MAP[  bytes[begin]           >> 3];								// 0
						result += B32HEX_MAP[ (bytes[begin  ] & 0x07) << 2 | (bytes[begin+1] >> 6)];	// 1
						result += B32HEX_MAP[ (bytes[begin+1] & 0x3E) >> 1];								// 2
						result += B32HEX_MAP[ (bytes[begin+1] & 0x01) << 4 | (bytes[begin+2] >> 4)];	// 3
						result += B32HEX_MAP[ (bytes[begin+2] & 0x0F) << 1 | (bytes[begin+3] >> 7)];	// 4
						result += B32HEX_MAP[ (bytes[begin+3] & 0x7C) >> 2];								// 5
						result += B32HEX_MAP[ (bytes[begin+3] & 0x03) << 3];								// 6
					}
					return result;
				}
                case 16: 
				case 'hex': {
                    for (let i = 0; i < bytes.length; i++) {
                        let value = bytes[i];
                        result += HEX_MAP[(value & 0xF0) >>> 4] + HEX_MAP[value & 0x0F];
                    }
                    return result;
				}
                case 2: 
				case 'bits': {
                    for (let i = 0; i < bytes.length; i++) {
                        let value = bytes[i];
                        for (let k = 7; k >= 0; k--) {
                            result += ((value >>> k) & 0x01) ? '1' : '0';
                        }
                    }
                    return result;
				}
				case "utf8": {
					return String.utf8Decode(bytes);
				}

                default:
                    throw new RangeError("Unsupported encoding type!");
            }
        }
    });

	Object.defineProperty(Uint8Array, 'binaryFrom', {
		configurable: true, enumerable: false, writable: true,
		value: function(input:string|ArrayBuffer|BufferView|number[], conversion_info?: 'b64sort'|'b64url'|'base64'|'b62hex'|'b32hex'|'hex'|'bits'|'utf8'|64|62|32|16|2): Uint8Array {
			if (Array.isArray(input)) {
				return new Uint8Array(input);
			}
			
			if (typeof input === "string") {
				if (conversion_info === "hex" || conversion_info === 16) {
					let matches = input.match(HEX_FORMAT);
					if (!matches) {
						throw new RangeError("Input argument is not a valid hex string!");
					}
					let hex_string = matches[2];
					hex_string = ((hex_string.length % 2 === 0) ? '' : '0') + hex_string;
					let buff = new Uint8Array((hex_string.length / 2) | 0);
					for (let i = 0; i < buff.length; i++) {
						let offset = i * 2;
						buff[i] = HEX_MAP_R[hex_string[offset]] << 4 | (HEX_MAP_R[hex_string[offset + 1]] & 0x0F);
					}
					return buff;
				}
				else if (conversion_info === "bits" || conversion_info === 2) {
					let matches = input.match(BIT_FORMAT);
					if (!matches) {
						throw new RangeError("Input argument is not a valid bit string!");
					}
					let bit_string = matches[2];
					if (bit_string.length % 8 !== 0) {
						bit_string = '0'.repeat(bit_string.length % 8) + bit_string;
					}
					let buff = new Uint8Array((bit_string.length / 8) | 0);
					for (let i = 0; i < buff.length; i++) {
						let offset = i * 8;
						let value = (bit_string[offset] === '1' ? 1 : 0);
						for (let k = 1; k < 8; k++) {
							value = (value << 1) | (bit_string[offset + k] === '1' ? 1 : 0);
						}
						buff[i] = value;
					}
					return buff;
				}
				else if (conversion_info === 'b32hex' || conversion_info === 32) {
					let matches = input.match(B32HEX_FORMAT);
					if (!matches) {
						throw new RangeError("Input argument is not a valid base32hex string!");
					}

					let remain = input.length % 8;
					if ( [0, 2, 4, 5, 7].indexOf(remain) < 0 ) {
						throw new RangeError( "Given input string is not base32hex encoded!" );
					}
					
					let decoded = new Uint8Array(Math.floor(input.length * 5 / 8));
					
					
					
					
					// Run complete bundles
					let dest, begin, loop = Math.floor(input.length/8);
					for (let run=0; run<loop; run++) {
						begin = run * 8;
						dest  = run * 5;

						const v1 = B32HEX_MAP_R[input[begin]];
						const v2 = B32HEX_MAP_R[input[begin+1]];
						const v3 = B32HEX_MAP_R[input[begin+2]];
						const v4 = B32HEX_MAP_R[input[begin+3]];
						const v5 = B32HEX_MAP_R[input[begin+4]];
						const v6 = B32HEX_MAP_R[input[begin+5]];
						const v7 = B32HEX_MAP_R[input[begin+6]];
						const v8 = B32HEX_MAP_R[input[begin+7]];
						if ( v1 === undefined || v2 === undefined || v3 === undefined || v4 === undefined || v5 === undefined || v6 === undefined || v7 === undefined || v8 === undefined ) {
							throw new RangeError("Given input string is not base32hex encoded!");
						}


						decoded[dest] 	=  v1 << 3 | v2 >> 2;					// 0
						decoded[dest+1] = (v2 & 0x03) << 6 | v3 << 1 | v4 >> 4;	// 1
						decoded[dest+2] = (v4 & 0x0F) << 4 | v5 >> 1;			// 2
						decoded[dest+3] = (v5 & 0x01) << 7 | v6 << 2 | v7 >> 3;	// 3
						decoded[dest+4] = (v7 & 0x07) << 5 | v8;				// 4
					}
					
					if ( remain === 0 ) { return decoded; }
					
					
					
					{
						begin = loop*8;
						dest  = loop*5;

						const v1 = B32HEX_MAP_R[input[begin]];
						const v2 = B32HEX_MAP_R[input[begin+1]];
						const v3 = B32HEX_MAP_R[input[begin+2]];
						const v4 = B32HEX_MAP_R[input[begin+3]];
						const v5 = B32HEX_MAP_R[input[begin+4]];
						const v6 = B32HEX_MAP_R[input[begin+5]];
						const v7 = B32HEX_MAP_R[input[begin+6]];
						if ( remain >= 2 ) {
							if ( v1 === undefined || v2 === undefined ) {
								throw new RangeError("Given input string is not base32hex encoded!");
							}
							decoded[dest] =  v1 << 3 | v2 >> 2;						// 0
						}
						
						if ( remain >= 4 ) {
							if ( v3 === undefined || v4 === undefined ) {
								throw new RangeError("Given input string is not base32hex encoded!");
							}
							decoded[dest+1] = (v2 & 0x03) << 6 | v3 << 1 | v4 >> 4;	// 1
						}
						
						if ( remain >= 5 ) {
							if ( v5 === undefined ) {
								throw new RangeError("Given input string is not base32hex encoded!");
							}
							decoded[dest+2] = (v4 & 0x0F) << 4 | v5 >> 1;			// 2
						}
						
						if ( remain === 7 ) {
							if ( v6 === undefined || v7 === undefined ) {
								throw new RangeError("Given input string is not base32hex encoded!");
							}
							decoded[dest+3] = (v5 & 0x01) << 7 | v6 << 2 | v7 >> 3;	// 3
						}
					}
					
					return decoded;
				}
				else if (conversion_info === 'b62hex' || conversion_info === 62) {
					let matches = input.match(B62HEX_FORMAT);
					if (!matches) {
						throw new RangeError("Input argument is not a valid base62hex string!");
					}
					
					const leading_zeros:number[] = [];
					for(let i=0; i<input.length; i++) {
						if ( input[i] !== '0' ) break;
						leading_zeros.push(0x00);
					}
					
					let b62tk = input.substring(leading_zeros.length).split('').reverse(), num = 0n;
					for(let i=0; i<b62tk.length; i++) {
						num += BigInt(B62HEX_MAP_R[b62tk[i]]) * (62n**BigInt(i));
					}
					
					const bytes:number[] = [];
					while(num > 0n) {
						bytes.push(Number(num%256n));
						num = num/256n;
					}

					return Uint8Array.from(leading_zeros.concat(bytes.reverse()));
				}
				else if (conversion_info === 'base64' || conversion_info === 'b64url' || conversion_info === 64) {
					let bytes:Uint8Array, matches = input.match(B64_FORMAT);
					if (!matches) {
						throw new RangeError("Input argument is not a valid base64/base64url string!");
					}
					
					input = matches[1];
					const length = input.length;
					const remain = length % 4;
					switch( remain ) {
						case 0:
							bytes = new Uint8Array((length/4|0)*3);
							break;
							
						case 2:
							bytes = new Uint8Array((length/4|0)*3 + 1);
							break;
							
						case 3:
							bytes = new Uint8Array((length/4|0)*3 + 2);
							break;
							
						default:
							throw new RangeError("Input argument is not a valid base64/base64url string!");
					}
					

					
					let v1, v2, v3, v4, i=0, j=0, end=(length/4|0)*4;
					while ( i<end ) {
						v1 = B64MAP_R[input[i++]];
						v2 = B64MAP_R[input[i++]];
						v3 = B64MAP_R[input[i++]];
						v4 = B64MAP_R[input[i++]];
						bytes[j++] = (v1 << 2 | v2 >>> 4);
						bytes[j++] = (v2 << 4 | v3 >>> 2);
						bytes[j++] = (v3 << 6 | v4);
					}
					
					
					
					// Decode remaining bytes
					switch( remain ) {
						case 2:
							v1 = B64MAP_R[input.charAt(i++)];
							v2 = B64MAP_R[input.charAt(i)];
							bytes[j] = (v1 << 2 | v2 >>> 4);
							break;
						
						case 3:
							v1 = B64MAP_R[input.charAt(i++)];
							v2 = B64MAP_R[input.charAt(i++)];
							v3 = B64MAP_R[input.charAt(i)];
							bytes[j] = (v1 << 2 | v2 >>> 4);
							bytes[j+1] = (v2 << 4 | v3 >>> 2);
							break;
					}
					
					return bytes;
				}
				else 
				if ( conversion_info === 'utf8' ){
					return String.utf8Encode(input);
				}
				else {
					throw new RangeError("Unsupported encoding type!");
				}	
			}

			let result = ExtractBytes(input);
			if (!result) {
				throw new TypeError("Cannot convert given input data into array buffer!");
			}
			return result;
		}
	});
	Object.defineProperty(Uint8Array, 'readFrom', {
		configurable: true, enumerable: false, writable: true,
		value: Uint8Array.binaryFrom
	});
	
	Object.defineProperty(Uint8Array, 'binaryCompare', {
        configurable:true, enumerable:false, writable:true,
        value: function (a:Buffer|ArrayBuffer|BufferView, b:Buffer|ArrayBuffer|BufferView):0|1|-1 {
            let A = ExtractBytes(a), B = ExtractBytes(b);
            if (!A || !B) {
                throw new TypeError("Given arguments must be instances of ArrayBuffer, TypedArray or DataView!");
            }
            let len = Math.max(A.length, B.length);
            for (let i = 0; i < len; i++) {
                let val_a = A[i] || 0, val_b = B[i] || 0;
                if (val_a > val_b)
                    return 1;
                if (val_a < val_b)
                    return -1;
            }
            return 0;
        }
    });
	
	Object.defineProperty(Uint8Array, 'binaryConcat', {
		configurable: true, enumerable: false, writable: true,
        value: function (buffers:(ArrayBuffer|BufferView)[]):Uint8Array {
			const bytes = buffers.map((c)=>{
				if ( c instanceof ArrayBuffer ) {
					return new Uint8Array(c);
				}
				else
				if ( typeof Buffer !== "undefined" && Buffer.isBuffer(c) ) {
					return new Uint8Array(c);
				}
				else
				if ( ArrayBuffer.isView(c) ) {
					return new Uint8Array(c.buffer, c.byteOffset, c.byteLength);
				}
				else {
					return new Uint8Array(0);
				}
			});
			const total_size = bytes.reduce((p, c, i)=>p + c.length, 0);

			const buffer = new Uint8Array(total_size);
			bytes.reduce((offset, c)=>{
				buffer.set(c, offset);
				return offset + c.length;
			}, 0);

			return buffer;
		}
	})





	function ExtractBytes(content:Buffer|ArrayBuffer|BufferView):Uint8Array|null {
		if (typeof Buffer !== "undefined") {
			if (Buffer.isBuffer(content)) {
				return new Uint8Array(content);
			}
		}
		if (ArrayBuffer.isView(content)) {
			return new Uint8Array(content.buffer, content.byteOffset, content.byteLength);
		}
		if (content instanceof ArrayBuffer) {
			return new Uint8Array(content);
		}
		return null;
	}
})();



declare global {
	interface ObjectConstructor {
		stripProperties<DataType extends Record<string, any>=any, RemoveProps extends (keyof DataType)[] = (keyof DataType)[]>(data:DataType, props:RemoveProps):Omit<DataType, RemoveProps[number]>;
		pickProperties<DataType extends Record<string, any>=any, PickedProps extends (keyof DataType)[] = (keyof DataType)[]>(data:DataType, props:PickedProps):Pick<DataType, PickedProps[number]>;
	}
}
(async()=>{
	Object.defineProperty(Object, 'stripProperties', {
		configurable: true, enumerable: false, writable: true,
		value: function<DataType extends Record<string, any>=any, RemoveProps extends (keyof DataType)[] = []>(data:DataType, props:RemoveProps):Omit<DataType, RemoveProps[number]> {
			const copy:Partial<DataType> = Object.assign({}, data);
			for(const field of props) {
				delete copy[field];
			}

			return copy as Omit<DataType, RemoveProps[number]>;
		}
	});
	Object.defineProperty(Object, 'pickProperties', {
		configurable: true, enumerable: false, writable: true,
		value: function<DataType extends Record<string, any>=any, PickedProps extends (keyof DataType)[] = []>(data:DataType, props:PickedProps):Pick<DataType, PickedProps[number]> {
			const copy:Partial<DataType> = Object.assign({}, data);
			for(const key in copy) {
				if ( props.indexOf(key) >= 0 ) continue;
				delete copy[key];
			}

			return copy as Pick<DataType, PickedProps[number]>;
		}
	});
})();


// Promise
declare global {
	interface PromiseConstructor {
		wrap<ReturnType=any>(callable:{(...args:any):ReturnType|Promise<ReturnType>}, ...args:any[]):Promise<ReturnType>;
	}
}
Object.defineProperty(Promise, 'wrap', {
	configurable: true, enumerable: false, writable: true,
	value:async <ReturnType=any>(callable:{(...args:any):ReturnType|Promise<ReturnType>}, ...args:any[]):Promise<ReturnType>=>{
		return await callable(...args);
	}
});

export {};





if ( typeof require !== 'undefined' && typeof module !== "undefined" && require.main === module ) {
	console.log("String.utf8Encode / String.utf8Decode");
	{
		const ground_truth = `
Original by Markus Kuhn, adapted for HTML by Martin Dürst.

UTF-8 encoded sample plain-text file
‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾

Markus Kuhn [ˈmaʳkʊs kuːn] <mkuhn@acm.org> — 1999-08-20


The ASCII compatible UTF-8 encoding of ISO 10646 and Unicode
plain-text files is defined in RFC 2279 and in ISO 10646-1 Annex R.


Using Unicode/UTF-8, you can write in emails and source code things such as

Mathematics and Sciences:

  ∮ E⋅da = Q,  n → ∞, ∑ f(i) = ∏ g(i), ∀x∈ℝ: ⌈x⌉ = −⌊−x⌋, α ∧ ¬β = ¬(¬α ∨ β),

  ℕ ⊆ ℕ₀ ⊂ ℤ ⊂ ℚ ⊂ ℝ ⊂ ℂ, ⊥ < a ≠ b ≡ c ≤ d ≪ ⊤ ⇒ (A ⇔ B),

  2H₂ + O₂ ⇌ 2H₂O, R = 4.7 kΩ, ⌀ 200 mm

Linguistics and dictionaries:

  ði ıntəˈnæʃənəl fəˈnɛtık əsoʊsiˈeıʃn
  Y [ˈʏpsilɔn], Yen [jɛn], Yoga [ˈjoːgɑ]

APL:

  ((V⍳V)=⍳⍴V)/V←,V    ⌷←⍳→⍴∆∇⊃‾⍎⍕⌈

Nicer typography in plain text files:

  ╔══════════════════════════════════════════╗
  ║                                          ║
  ║   • ‘single’ and “double” quotes         ║
  ║                                          ║
  ║   • Curly apostrophes: “We’ve been here” ║
  ║                                          ║
  ║   • Latin-1 apostrophe and accents: '´\`  ║
  ║                                          ║
  ║   • ‚deutsche‘ „Anführungszeichen“       ║
  ║                                          ║
  ║   • †, ‡, ‰, •, 3–4, —, −5/+5, ™, …      ║
  ║                                          ║
  ║   • ASCII safety test: 1lI|, 0OD, 8B     ║
  ║                      ╭─────────╮         ║
  ║   • the euro symbol: │ 14.95 € │         ║
  ║                      ╰─────────╯         ║
  ╚══════════════════════════════════════════╝

Greek (in Polytonic):

  The Greek anthem:

  Σὲ γνωρίζω ἀπὸ τὴν κόψη
  τοῦ σπαθιοῦ τὴν τρομερή,
  σὲ γνωρίζω ἀπὸ τὴν ὄψη
  ποὺ μὲ βία μετράει τὴ γῆ.

  ᾿Απ᾿ τὰ κόκκαλα βγαλμένη
  τῶν ῾Ελλήνων τὰ ἱερά
  καὶ σὰν πρῶτα ἀνδρειωμένη
  χαῖρε, ὦ χαῖρε, ᾿Ελευθεριά!

  From a speech of Demosthenes in the 4th century BC:

  Οὐχὶ ταὐτὰ παρίσταταί μοι γιγνώσκειν, ὦ ἄνδρες ᾿Αθηναῖοι,
  ὅταν τ᾿ εἰς τὰ πράγματα ἀποβλέψω καὶ ὅταν πρὸς τοὺς
  λόγους οὓς ἀκούω· τοὺς μὲν γὰρ λόγους περὶ τοῦ
  τιμωρήσασθαι Φίλιππον ὁρῶ γιγνομένους, τὰ δὲ πράγματ᾿ 
  εἰς τοῦτο προήκοντα,  ὥσθ᾿ ὅπως μὴ πεισόμεθ᾿ αὐτοὶ
  πρότερον κακῶς σκέψασθαι δέον. οὐδέν οὖν ἄλλο μοι δοκοῦσιν
  οἱ τὰ τοιαῦτα λέγοντες ἢ τὴν ὑπόθεσιν, περὶ ἧς βουλεύεσθαι,
  οὐχὶ τὴν οὖσαν παριστάντες ὑμῖν ἁμαρτάνειν. ἐγὼ δέ, ὅτι μέν
  ποτ᾿ ἐξῆν τῇ πόλει καὶ τὰ αὑτῆς ἔχειν ἀσφαλῶς καὶ Φίλιππον
  τιμωρήσασθαι, καὶ μάλ᾿ ἀκριβῶς οἶδα· ἐπ᾿ ἐμοῦ γάρ, οὐ πάλαι
  γέγονεν ταῦτ᾿ ἀμφότερα· νῦν μέντοι πέπεισμαι τοῦθ᾿ ἱκανὸν
  προλαβεῖν ἡμῖν εἶναι τὴν πρώτην, ὅπως τοὺς συμμάχους
  σώσομεν. ἐὰν γὰρ τοῦτο βεβαίως ὑπάρξῃ, τότε καὶ περὶ τοῦ
  τίνα τιμωρήσεταί τις καὶ ὃν τρόπον ἐξέσται σκοπεῖν· πρὶν δὲ
  τὴν ἀρχὴν ὀρθῶς ὑποθέσθαι, μάταιον ἡγοῦμαι περὶ τῆς
  τελευτῆς ὁντινοῦν ποιεῖσθαι λόγον.

  Δημοσθένους, Γ´ ᾿Ολυνθιακὸς

Georgian:

  From a Unicode conference invitation:

  გთხოვთ ახლავე გაიაროთ რეგისტრაცია Unicode-ის მეათე საერთაშორისო
  კონფერენციაზე დასასწრებად, რომელიც გაიმართება 10-12 მარტს,
  ქ. მაინცში, გერმანიაში. კონფერენცია შეჰკრებს ერთად მსოფლიოს
  ექსპერტებს ისეთ დარგებში როგორიცაა ინტერნეტი და Unicode-ი,
  ინტერნაციონალიზაცია და ლოკალიზაცია, Unicode-ის გამოყენება
  ოპერაციულ სისტემებსა, და გამოყენებით პროგრამებში, შრიფტებში,
  ტექსტების დამუშავებასა და მრავალენოვან კომპიუტერულ სისტემებში.

Russian:

  From a Unicode conference invitation:

  Зарегистрируйтесь сейчас на Десятую Международную Конференцию по
  Unicode, которая состоится 10-12 марта 1997 года в Майнце в Германии.
  Конференция соберет широкий круг экспертов по  вопросам глобального
  Интернета и Unicode, локализации и интернационализации, воплощению и
  применению Unicode в различных операционных системах и программных
  приложениях, шрифтах, верстке и многоязычных компьютерных системах.

Thai (UCS Level 2):

  Excerpt from a poetry on The Romance of The Three Kingdoms (a Chinese
  classic 'San Gua'):

  [----------------------------|------------------------]
    ๏ แผ่นดินฮั่นเสื่อมโทรมแสนสังเวช  พระปกเกศกองบู๊กู้ขึ้นใหม่
  สิบสองกษัตริย์ก่อนหน้าแลถัดไป       สององค์ไซร้โง่เขลาเบาปัญญา
    ทรงนับถือขันทีเป็นที่พึ่ง           บ้านเมืองจึงวิปริตเป็นนักหนา
  โฮจิ๋นเรียกทัพทั่วหัวเมืองมา         หมายจะฆ่ามดชั่วตัวสำคัญ
    เหมือนขับไสไล่เสือจากเคหา      รับหมาป่าเข้ามาเลยอาสัญ
  ฝ่ายอ้องอุ้นยุแยกให้แตกกัน          ใช้สาวนั้นเป็นชนวนชื่นชวนใจ
    พลันลิฉุยกุยกีกลับก่อเหตุ          ช่างอาเพศจริงหนาฟ้าร้องไห้
  ต้องรบราฆ่าฟันจนบรรลัย           ฤๅหาใครค้ำชูกู้บรรลังก์ ฯ

  (The above is a two-column text. If combining characters are handled
  correctly, the lines of the second column should be aligned with the
  | character above.)

Ethiopian:

  Proverbs in the Amharic language:

  ሰማይ አይታረስ ንጉሥ አይከሰስ።
  ብላ ካለኝ እንደአባቴ በቆመጠኝ።
  ጌጥ ያለቤቱ ቁምጥና ነው።
  ደሀ በሕልሙ ቅቤ ባይጠጣ ንጣት በገደለው።
  የአፍ ወለምታ በቅቤ አይታሽም።
  አይጥ በበላ ዳዋ ተመታ።
  ሲተረጉሙ ይደረግሙ።
  ቀስ በቀስ፥ ዕንቁላል በእግሩ ይሄዳል።
  ድር ቢያብር አንበሳ ያስር።
  ሰው እንደቤቱ እንጅ እንደ ጉረቤቱ አይተዳደርም።
  እግዜር የከፈተውን ጉሮሮ ሳይዘጋው አይድርም።
  የጎረቤት ሌባ፥ ቢያዩት ይስቅ ባያዩት ያጠልቅ።
  ሥራ ከመፍታት ልጄን ላፋታት።
  ዓባይ ማደሪያ የለው፥ ግንድ ይዞ ይዞራል።
  የእስላም አገሩ መካ የአሞራ አገሩ ዋርካ።
  ተንጋሎ ቢተፉ ተመልሶ ባፉ።
  ወዳጅህ ማር ቢሆን ጨርስህ አትላሰው።
  እግርህን በፍራሽህ ልክ ዘርጋ።

Runes:

  ᚻᛖ ᚳᚹᚫᚦ ᚦᚫᛏ ᚻᛖ ᛒᚢᛞᛖ ᚩᚾ ᚦᚫᛗ ᛚᚪᚾᛞᛖ ᚾᚩᚱᚦᚹᛖᚪᚱᛞᚢᛗ ᚹᛁᚦ ᚦᚪ ᚹᛖᛥᚫ

  (Old English, which transcribed into Latin reads 'He cwaeth that he
  bude thaem lande northweardum with tha Westsae.' and means 'He said
  that he lived in the northern land near the Western Sea.')

Braille:

  ⡌⠁⠧⠑ ⠼⠁⠒  ⡍⠜⠇⠑⠹⠰⠎ ⡣⠕⠌

  ⡍⠜⠇⠑⠹ ⠺⠁⠎ ⠙⠑⠁⠙⠒ ⠞⠕ ⠃⠑⠛⠔ ⠺⠊⠹⠲ ⡹⠻⠑ ⠊⠎ ⠝⠕ ⠙⠳⠃⠞
  ⠱⠁⠞⠑⠧⠻ ⠁⠃⠳⠞ ⠹⠁⠞⠲ ⡹⠑ ⠗⠑⠛⠊⠌⠻ ⠕⠋ ⠙⠊⠎ ⠃⠥⠗⠊⠁⠇ ⠺⠁⠎
  ⠎⠊⠛⠝⠫ ⠃⠹ ⠹⠑ ⠊⠇⠻⠛⠹⠍⠁⠝⠂ ⠹⠑ ⠊⠇⠻⠅⠂ ⠹⠑ ⠥⠝⠙⠻⠞⠁⠅⠻⠂
  ⠁⠝⠙ ⠹⠑ ⠡⠊⠑⠋ ⠍⠳⠗⠝⠻⠲ ⡎⠊⠗⠕⠕⠛⠑ ⠎⠊⠛⠝⠫ ⠊⠞⠲ ⡁⠝⠙
  ⡎⠊⠗⠕⠕⠛⠑⠰⠎ ⠝⠁⠍⠑ ⠺⠁⠎ ⠛⠕⠕⠙ ⠥⠏⠕⠝ ⠰⡡⠁⠝⠛⠑⠂ ⠋⠕⠗ ⠁⠝⠹⠹⠔⠛ ⠙⠑ 
  ⠡⠕⠎⠑ ⠞⠕ ⠏⠥⠞ ⠙⠊⠎ ⠙⠁⠝⠙ ⠞⠕⠲

  ⡕⠇⠙ ⡍⠜⠇⠑⠹ ⠺⠁⠎ ⠁⠎ ⠙⠑⠁⠙ ⠁⠎ ⠁ ⠙⠕⠕⠗⠤⠝⠁⠊⠇⠲

  ⡍⠔⠙⠖ ⡊ ⠙⠕⠝⠰⠞ ⠍⠑⠁⠝ ⠞⠕ ⠎⠁⠹ ⠹⠁⠞ ⡊ ⠅⠝⠪⠂ ⠕⠋ ⠍⠹
  ⠪⠝ ⠅⠝⠪⠇⠫⠛⠑⠂ ⠱⠁⠞ ⠹⠻⠑ ⠊⠎ ⠏⠜⠞⠊⠊⠥⠇⠜⠇⠹ ⠙⠑⠁⠙ ⠁⠃⠳⠞
  ⠁ ⠙⠕⠕⠗⠤⠝⠁⠊⠇⠲ ⡊ ⠍⠊⠣⠞ ⠙⠁⠧⠑ ⠃⠑⠲ ⠔⠊⠇⠔⠫⠂ ⠍⠹⠎⠑⠇⠋⠂ ⠞⠕
  ⠗⠑⠛⠜⠙ ⠁ ⠊⠕⠋⠋⠔⠤⠝⠁⠊⠇ ⠁⠎ ⠹⠑ ⠙⠑⠁⠙⠑⠌ ⠏⠊⠑⠊⠑ ⠕⠋ ⠊⠗⠕⠝⠍⠕⠝⠛⠻⠹ 
  ⠔ ⠹⠑ ⠞⠗⠁⠙⠑⠲ ⡃⠥⠞ ⠹⠑ ⠺⠊⠎⠙⠕⠍ ⠕⠋ ⠳⠗ ⠁⠝⠊⠑⠌⠕⠗⠎ 
  ⠊⠎ ⠔ ⠹⠑ ⠎⠊⠍⠊⠇⠑⠆ ⠁⠝⠙ ⠍⠹ ⠥⠝⠙⠁⠇⠇⠪⠫ ⠙⠁⠝⠙⠎
  ⠩⠁⠇⠇ ⠝⠕⠞ ⠙⠊⠌⠥⠗⠃ ⠊⠞⠂ ⠕⠗ ⠹⠑ ⡊⠳⠝⠞⠗⠹⠰⠎ ⠙⠕⠝⠑ ⠋⠕⠗⠲ ⡹⠳
  ⠺⠊⠇⠇ ⠹⠻⠑⠋⠕⠗⠑ ⠏⠻⠍⠊⠞ ⠍⠑ ⠞⠕ ⠗⠑⠏⠑⠁⠞⠂ ⠑⠍⠏⠙⠁⠞⠊⠊⠁⠇⠇⠹⠂ ⠹⠁⠞
  ⡍⠜⠇⠑⠹ ⠺⠁⠎ ⠁⠎ ⠙⠑⠁⠙ ⠁⠎ ⠁ ⠙⠕⠕⠗⠤⠝⠁⠊⠇⠲

  (The first couple of paragraphs of "A Christmas Carol" by Dickens)

Compact font selection example text:

  ABCDEFGHIJKLMNOPQRSTUVWXYZ /0123456789
  abcdefghijklmnopqrstuvwxyz £©µÀÆÖÞßéöÿ
  –—‘“”„†•…‰™œŠŸž€ ΑΒΓΔΩαβγδω АБВГДабвгд
  ∀∂∈ℝ∧∪≡∞ ↑↗↨↻⇣ ┐┼╔╘░►☺♀ ﬁ�⑀₂ἠḂӥẄɐː⍎אԱა

Greetings in various languages:

  Hello world, Καλημέρα κόσμε, コンニチハ

Box drawing alignment tests:                                          █
                                                                      ▉
  ╔══╦══╗  ┌──┬──┐  ╭──┬──╮  ╭──┬──╮  ┏━━┳━━┓  ┎┒┏┑   ╷  ╻ ┏┯┓ ┌┰┐    ▊ ╱╲╱╲╳╳╳
  ║┌─╨─┐║  │╔═╧═╗│  │╒═╪═╕│  │╓─╁─╖│  ┃┌─╂─┐┃  ┗╃╄┙  ╶┼╴╺╋╸┠┼┨ ┝╋┥    ▋ ╲╱╲╱╳╳╳
  ║│╲ ╱│║  │║   ║│  ││ │ ││  │║ ┃ ║│  ┃│ ╿ │┃  ┍╅╆┓   ╵  ╹ ┗┷┛ └┸┘    ▌ ╱╲╱╲╳╳╳
  ╠╡ ╳ ╞╣  ├╢   ╟┤  ├┼─┼─┼┤  ├╫─╂─╫┤  ┣┿╾┼╼┿┫  ┕┛┖┚     ┌┄┄┐ ╎ ┏┅┅┓ ┋ ▍ ╲╱╲╱╳╳╳
  ║│╱ ╲│║  │║   ║│  ││ │ ││  │║ ┃ ║│  ┃│ ╽ │┃  ░░▒▒▓▓██ ┊  ┆ ╎ ╏  ┇ ┋ ▎
  ║└─╥─┘║  │╚═╤═╝│  │╘═╪═╛│  │╙─╀─╜│  ┃└─╂─┘┃  ░░▒▒▓▓██ ┊  ┆ ╎ ╏  ┇ ┋ ▏
  ╚══╩══╝  └──┴──┘  ╰──┴──╯  ╰──┴──╯  ┗━━┻━━┛           └╌╌┘ ╎ ┗╍╍┛ ┋  ▁▂▃▄▅▆▇█

`;
		const decoded = String.utf8Decode(String.utf8Encode(ground_truth));
		console.log(`    ${ground_truth === decoded ? "PASSED" : "FAILED"}`);
	}

	console.log("Uint8Array.binaryFrom/Uint8Array.binaryDump");
	{
		const {webcrypto:crypto} = require('node:crypto');
		const test_results = {
			bits:[], hex:[], b32hex:[], b62hex:[], base64:[], b64url:[]
		} as {[key in Exclude<BinaryConversionType_String, 'utf8'>]:Array<boolean>};
		const test_types = Object.keys(test_results) as (keyof typeof test_results)[];
		
		for(let i=0;i<100000;i++) {
			const data_length = Math.floor(Math.random() * 120) + 1;
			const data = crypto.getRandomValues(new Uint8Array(data_length));
			
			for(const type of test_types) {
				const encoded = Uint8Array.binaryDump(data, type);
				try {
					const result = Uint8Array.binaryFrom(encoded, type);
					test_results[type].push(Uint8Array.binaryCompare(data, result) === 0);
				}
				catch(e) {
					console.log(encoded);
					throw e;
				}
			}
		}

		for(const type of test_types) {
			const result = test_results[type].reduce((p,c)=>p&&c, true);
			console.log(`    [${type}] ${result?'PASSED':'FAILED'}`);
		}
	}
}
