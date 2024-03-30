// JSON
declare global {
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



// Date
declare global {
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
Object.defineProperty(Date, 'toLocaleISOString', {
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
Object.defineProperty(Date, 'toLocalISOString', {
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
		utf8Encode:{(str:string):Uint8Array};
		utf8Decode:{(buff:ArrayBuffer|BufferView):string};
	}
}
(()=>{
	Object.defineProperty(String, 'utf8Encode', {
		configurable:false, enumerable:false, writable:true,
		value: function(js_str:string) {
			if (typeof js_str !== "string") {
				throw new TypeError("Given input argument must be a js string!");
			}
			var code_points = [];
			for (var i = 0; i < js_str.length;) {
				var point = js_str.codePointAt(i)!;
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
			if (uint8 instanceof ArrayBuffer)
				uint8 = new Uint8Array(uint8);
			if (!(uint8 instanceof Uint8Array)) {
				throw new TypeError("Given input must be an Uint8Array contains UTF8 encoded value!");
			}
			var code_points = [];
			for (var i = 0; i < uint8.length;) {
				var codePoint = uint8[i] & 0xff;
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
			var result_string = "";
			while (code_points.length > 0) {
				var chunk = code_points.splice(0, UTF8_DECODE_CHUNK_SIZE);
				result_string += String.fromCodePoint.apply(String, chunk);
			}
			return result_string;
		}
	});
})();



// Typed Array
type BufferView = Uint8ClampedArray | Uint8Array | Int8Array | Uint16Array | Int16Array | Uint32Array | Int32Array | Float32Array | Float64Array | DataView;
declare global {
	interface ArrayBuffer {
		bytes: Uint8Array;
	}
	interface Uint8ArrayConstructor {
		readFrom(data: ArrayBuffer | BufferView | number[]): Uint8Array;
		readFrom(data: string, conversion: 'hex' | 'bits' | 'utf8' | 16 | 2): Uint8Array;
		binaryCompare(a: ArrayBuffer | BufferView, b: ArrayBuffer | BufferView): -1 | 0 | 1;
		binaryDump(buffer: ArrayBuffer | BufferView, format?: 2 | 16, padding?: boolean): string;
	}
}
(function(){
	const HEX_FORMAT = /^(0x)?([0-9a-fA-F]+)$/;
	const BIT_FORMAT = /^(0b|0B)?([01]+)$/;
	const HEX_MAP = "0123456789abcdef";
	const HEX_MAP_R:{[enc:string]:number} = {
		"0": 0, "1": 1, "2": 2, "3": 3,
		"4": 4, "5": 5, "6": 6, "7": 7,
		"8": 8, "9": 9, "a": 10, "b": 11,
		"c": 12, "d": 13, "e": 14, "f": 15
	};

	Object.defineProperty(ArrayBuffer.prototype, 'bytes', {
		configurable:true, enumerable:false, 
		get: function() { return new Uint8Array(this); }
	});

	Object.defineProperty(Uint8Array, 'readFrom', {
		configurable: true, enumerable: false, writable: true,
		value: function(input: string, conversion_info: 'hex' | 'bits' | 'utf8' | 16 | 2): Uint8Array {
			if (Array.isArray(input)) {
				return new Uint8Array(input);
			}
			if (typeof input === "string") {
				if (conversion_info === "hex" || conversion_info === 16) {
					var matches = input.match(HEX_FORMAT);
					if (!matches) {
						throw new RangeError("Input argument is not a valid hex string!");
					}
					var hex_string = matches[2];
					if (hex_string.length % 2 === 0) {
						hex_string = hex_string.toLowerCase();
					}
					else {
						hex_string = '0' + hex_string.toLowerCase();
					}
					var buff = new Uint8Array((hex_string.length / 2) | 0);
					for (var i = 0; i < buff.length; i++) {
						var offset = i * 2;
						buff[i] = HEX_MAP_R[hex_string[offset]] << 4 | (HEX_MAP_R[hex_string[offset + 1]] & 0x0F);
					}
					return buff;
				}
				else if (conversion_info === "bits" || conversion_info === 2) {
					var matches = input.match(BIT_FORMAT);
					if (!matches) {
						throw new RangeError("Input argument is not a valid bit string!");
					}
					var bit_string = matches[2];
					if (bit_string.length % 8 !== 0) {
						bit_string = '0'.repeat(bit_string.length % 8) + bit_string;
					}
					var buff = new Uint8Array((bit_string.length / 8) | 0);
					for (var i = 0; i < buff.length; i++) {
						var offset = i * 8;
						var value = (bit_string[offset] === '1' ? 1 : 0);
						for (var k = 1; k < 8; k++) {
							value = (value << 1) | (bit_string[offset + k] === '1' ? 1 : 0);
						}
						buff[i] = value;
					}
					return buff;
				}
				else {
					return String.utf8Encode(input);
				}
			}
			var result = ExtractBytes(input);
			if (!result) {
				throw new TypeError("Cannot convert given input data into array buffer!");
			}
			return result;
		}
	});
	
	Object.defineProperty(Uint8Array, 'binaryCompare', {
        configurable:true, enumerable:false, writable:true,
        value: function (a:Buffer|ArrayBuffer|BufferView, b:Buffer|ArrayBuffer|BufferView):0|1|-1 {
            var A = ExtractBytes(a), B = ExtractBytes(b);
            if (!A || !B) {
                throw new TypeError("Given arguments must be instances of ArrayBuffer, TypedArray or DataView!");
            }
            var len = Math.max(A.length, B.length);
            for (var i = 0; i < len; i++) {
                var val_a = A[i] || 0, val_b = B[i] || 0;
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
        value: function (buffer: ArrayBuffer | BufferView, format?: 2 | 16, padding?: boolean):string {
            if (format === void 0) { format = 16; }
            if (padding === void 0) { padding = true; }
            var bytes = ExtractBytes(buffer);
            if (bytes === null) {
                throw new TypeError("Argument 1 expects an instance of ArrayBuffer, TypedArray or DataView!");
            }
            var result = '';
            switch (format) {
                case 16:
                    for (var i = 0; i < bytes.length; i++) {
                        var value = bytes[i];
                        result += HEX_MAP[(value & 0xF0) >>> 4] + HEX_MAP[value & 0x0F];
                    }
                    break;
                case 2:
                    for (var i = 0; i < bytes.length; i++) {
                        var value = bytes[i];
                        for (var k = 7; k >= 0; k--) {
                            result += ((value >>> k) & 0x01) ? '1' : '0';
                        }
                    }
                    break;
                default:
                    throw new RangeError("Unsupported numeric representation!");
            }
            return padding ? result : result.replace(/^0+/, '');
        }
    });





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

export default {};