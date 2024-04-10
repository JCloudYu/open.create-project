// JSON
interface JSON {
	encode: { <DataType = any>(data: DataType): string };
	decode: { <DataType = any>(json_str: string): DataType | undefined };
}
JSON.encode = function(data) {
	return JSON.stringify(data);
};
JSON.decode = function(json) {
	try {
		return JSON.parse(json);
	} catch (e) { return undefined; }
}



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
interface Error {
	stack_trace: string[];
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
interface StringConstructor {
	utf8Encode:{(str:string):Uint8Array};
	utf8Decode:{(buff:ArrayBuffer|BufferView):string};
}
(()=>{
	const encoder = typeof TextEncoder !== "undefined" ? new TextEncoder() : null;
	const decoder = typeof TextDecoder !== "undefined" ? new TextDecoder() : null;

	Object.defineProperty(String, 'utf8Encode', {
		configurable:false, enumerable:false, writable:true,
		value: function(js_str:string) {
			if (typeof js_str !== "string") {
				throw new TypeError("Given input argument must be a js string!");
			}

			if ( encoder ) {
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
		value: function(uint8:ArrayBuffer|BufferView) {
			if (uint8 instanceof ArrayBuffer) {
				uint8 = new Uint8Array(uint8);
			}
			
			if ( ArrayBuffer.isView(uint8) ) {
				uint8 = new Uint8Array(uint8.buffer);
			}

			if (!(uint8 instanceof Uint8Array)) {
				throw new TypeError("Given input must be an Uint8Array contains UTF8 encoded value!");
			}


			if ( decoder ) {
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
declare type BufferView = Uint8ClampedArray | Uint8Array | Int8Array | Uint16Array | Int16Array | Uint32Array | Int32Array | Float32Array | Float64Array | DataView;
interface ArrayBuffer {
	bytes: Uint8Array;
}
interface Uint8ArrayConstructor {
	readFrom(data: ArrayBuffer | BufferView | number[]): Uint8Array;
	readFrom(data: string, conversion:'b62hex'|'b32hex'|'hex'|'bits'|'utf8'|62|32|16|2): Uint8Array;
	binaryCompare(a: ArrayBuffer | BufferView, b: ArrayBuffer | BufferView): -1 | 0 | 1;
	binaryDump(buffer: ArrayBuffer | BufferView, format?: 2|16|32|62, padding?: boolean): string;
	binaryConcat(buffers:(ArrayBuffer|BufferView)[]):Uint8Array;
}
(function(){
	const BIT_FORMAT = /^(0b|0B)?([01]+)$/;
	const HEX_FORMAT = /^(0x)?([0-9a-fA-F]+)$/;
	const HEX_MAP = "0123456789abcdef";
	const HEX_MAP_R:{[enc:string]:number} = {
		"0": 0,	 "1": 1,  "2": 2,  "3": 3,
		"4": 4,	 "5": 5,  "6": 6,  "7": 7,
		"8": 8,  "9": 9,  "a": 10, "b": 11,
		"c": 12, "d": 13, "e": 14, "f": 15
	};
	const B32HEX_FORMAT = /^([0-9a-vA-V]+)$/;
	const B32HEX_MAP = "0123456789abcdefghijklmnopqrstuv";
	const B32HEX_MAP_R:{[enc:string]:number} = {
		'0':  0, '1':  1, '2':  2, '3':  3, '4':  4, '5':  5, '6':  6, '7':  7, '8':  8, '9':  9, 
		'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14, 'F': 15, 'G': 16, 'H': 17, 'I': 18, 'J': 19, 'K': 20, 'L': 21, 'M': 22,
		'N': 23, 'O': 24, 'P': 25, 'Q': 26, 'R': 27, 'S': 28, 'T': 29, 'U': 30, 'V': 31, 
		'a': 10, 'b': 11, 'c': 12, 'd': 13, 'e': 14, 'f': 15, 'g': 16, 'h': 17, 'i': 18, 'j': 19, 'k': 20, 'l': 21, 'm': 22,
		'n': 23, 'o': 24, 'p': 25, 'q': 26, 'r': 27, 's': 28, 't': 29, 'u': 30, 'v': 31
	};
	const B62HEX_FORMAT = /^([0-9a-zA-Z]+)$/;
	const B62HEX_MAP = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	const B62HEX_MAP_R:{[enc:string]:number} = {
		'0':  0, '1':  1, '2':  2, '3':  3, '4':  4, '5':  5, '6':  6, '7':  7, '8':  8, '9':  9, 
		'a': 10, 'b': 11, 'c': 12, 'd': 13, 'e': 14, 'f': 15, 'g': 16, 'h': 17, 'i': 18, 'j': 19, 
		'k': 20, 'l': 21, 'm': 22, 'n': 23, 'o': 24, 'p': 25, 'q': 26, 'r': 27, 's': 28, 't': 29,
		'u': 30, 'v': 31, 'w': 32, 'x': 33, 'y': 34, 'z': 35, 'A': 36, 'B': 37, 'C': 38, 'D': 39, 
		'E': 40, 'F': 41, 'G': 42, 'H': 43, 'I': 44, 'J': 45, 'K': 46, 'L': 47, 'M': 48, 'N': 49,
		'O': 50, 'P': 51, 'Q': 52, 'R': 53, 'S': 54, 'T': 55, 'U': 56, 'V': 57, 'W': 58, 'X': 59, 
		'Y': 60, 'Z': 61
	};

	Object.defineProperty(ArrayBuffer.prototype, 'bytes', {
		configurable:true, enumerable:false, 
		get: function() { return new Uint8Array(this); }
	});

	Object.defineProperty(Uint8Array, 'readFrom', {
		configurable: true, enumerable: false, writable: true,
		value: function(input:string|ArrayBuffer|BufferView|number[], conversion_info?: 'b62hex'|'b32hex'|'hex'|'bits'|'utf8'|62|32|16|2): Uint8Array {
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
					if (hex_string.length % 2 === 0) {
						hex_string = hex_string.toLowerCase();
					}
					else {
						hex_string = '0' + hex_string.toLowerCase();
					}
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
				else {
					return String.utf8Encode(input);
				}
			}

			let result = ExtractBytes(input);
			if (!result) {
				throw new TypeError("Cannot convert given input data into array buffer!");
			}
			return result;
		}
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

	Object.defineProperty(Uint8Array, 'binaryDump', {
		configurable: true, enumerable: false, writable: true,
        value: function (buffer:ArrayBuffer|BufferView, format?:2|16|32|62, padding?:boolean):string {
            if (format === void 0) { format = 16; }
            if (padding === void 0) { padding = true; }
            let bytes = ExtractBytes(buffer);
            if (bytes === null) {
                throw new TypeError("Argument 1 expects an instance of ArrayBuffer, TypedArray or DataView!");
            }
			
            let result = '';
			if ( bytes.length < 1 ) return result;

            switch (format) {
				case 62: {
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
				case 32: {
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
					break;
				}
                case 16: {
                    for (let i = 0; i < bytes.length; i++) {
                        let value = bytes[i];
                        result += HEX_MAP[(value & 0xF0) >>> 4] + HEX_MAP[value & 0x0F];
                    }
                    break;
				}
                case 2: {
                    for (let i = 0; i < bytes.length; i++) {
                        let value = bytes[i];
                        for (let k = 7; k >= 0; k--) {
                            result += ((value >>> k) & 0x01) ? '1' : '0';
                        }
                    }
                    break;
				}
                default:
                    throw new RangeError("Unsupported numeric representation!");
            }
            return padding ? result : result.replace(/^0+/, '');
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
					return new Uint8Array(c.buffer);
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
			return new Uint8Array(content.buffer);
		}
		if (content instanceof ArrayBuffer) {
			return new Uint8Array(content);
		}
		return null;
	}
})();


interface ObjectConstructor {
	stripProperties<DataType extends Record<string, any>=any, RemoveProps extends (keyof DataType)[] = (keyof DataType)[]>(data:DataType, props:RemoveProps):Omit<DataType, RemoveProps[number]>;
	pickProperties<DataType extends Record<string, any>=any, PickedProps extends (keyof DataType)[] = (keyof DataType)[]>(data:DataType, props:PickedProps):Pick<DataType, PickedProps[number]>;
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