import BESON from "beson";
import {webcrypto as WebCrypto} from "crypto";

type AnyObject = Record<string, any>;
export class BWT {
 	static async encode<DataType=AnyObject>(data:DataType, secret:Uint8Array):Promise<string> {
		const bin = BESON.Serialize(data);
		const key = await WebCrypto.subtle.importKey('raw', secret, {name:'HMAC', hash:'SHA-256'}, false, ['verify', 'sign']);
		const sig = await WebCrypto.subtle.sign('HMAC', key, bin);
		return BinaryDump(bin, 62) + "." + BinaryDump(sig, 62);
	}

	static async decode<DataType=AnyObject>(token:string, secret?:Uint8Array):Promise<undefined|DataType> {
		const [b62data, b62sig] = token.split('.');
		const bin = BinaryFrom(b62data, 62);
		const data = BESON.Deserialize(bin);
		if ( secret ) {
			const key = await WebCrypto.subtle.importKey('raw', secret, {name:'HMAC', hash:'SHA-256'}, false, ['verify', 'sign']);
			const sig = BinaryFrom(b62sig, 62);
			const sig_verf = await WebCrypto.subtle.sign('HMAC', key, bin);
			if ( BinaryCompare(sig_verf, sig) !== 0 ) return undefined;
		}

		return data;
	}
}





if ( module === require.main ) {
	(async()=>{
		const secret = WebCrypto.getRandomValues(new Uint8Array(64));
		const data = {a:1, b:2, c:3, d:456, e:['a', 'b', 'c'], f:null, g:false} as const;
		const enc = await BWT.encode(data, secret);
		const dec = await BWT.decode(enc, secret);
		console.log("DATA:", data);
		console.log(" DEC:", dec);
	})();
}



function BinaryFrom(input:string|ArrayBuffer|BufferView|number[], conversion_info?: 'b62hex'|'b32hex'|'hex'|'bits'|'utf8'|62|32|16|2): Uint8Array {
	if (Array.isArray(input)) {
		return new Uint8Array(input);
	}
	
	if (typeof input === "string") {
		if (conversion_info === "hex" || conversion_info === 16) {
			const HEX_MAP_R:{[enc:string]:number} = {
				"0": 0,	 "1": 1,  "2": 2,  "3": 3,
				"4": 4,	 "5": 5,  "6": 6,  "7": 7,
				"8": 8,  "9": 9,  "a": 10, "b": 11,
				"c": 12, "d": 13, "e": 14, "f": 15
			};

			let matches = input.match(/^(0x)?([0-9a-fA-F]+)$/);
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
			let matches = input.match(/^(0b|0B)?([01]+)$/);
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
			const B32HEX_MAP_R:{[enc:string]:number} = {
				'0':  0, '1':  1, '2':  2, '3':  3, '4':  4, '5':  5, '6':  6, '7':  7, '8':  8, '9':  9, 
				'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14, 'F': 15, 'G': 16, 'H': 17, 'I': 18, 'J': 19, 'K': 20, 'L': 21, 'M': 22,
				'N': 23, 'O': 24, 'P': 25, 'Q': 26, 'R': 27, 'S': 28, 'T': 29, 'U': 30, 'V': 31, 
				'a': 10, 'b': 11, 'c': 12, 'd': 13, 'e': 14, 'f': 15, 'g': 16, 'h': 17, 'i': 18, 'j': 19, 'k': 20, 'l': 21, 'm': 22,
				'n': 23, 'o': 24, 'p': 25, 'q': 26, 'r': 27, 's': 28, 't': 29, 'u': 30, 'v': 31
			};

			let matches = input.match(/^([0-9a-vA-V]+)$/);
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
			const base = 62n;
			const B62HEX_MAP_R:{[enc:string]:number} = {
				'0':  0, '1':  1, '2':  2, '3':  3, '4':  4, '5':  5, '6':  6, '7':  7, '8':  8, '9':  9, 
				'a': 10, 'b': 11, 'c': 12, 'd': 13, 'e': 14, 'f': 15, 'g': 16, 'h': 17, 'i': 18, 'j': 19, 
				'k': 20, 'l': 21, 'm': 22, 'n': 23, 'o': 24, 'p': 25, 'q': 26, 'r': 27, 's': 28, 't': 29,
				'u': 30, 'v': 31, 'w': 32, 'x': 33, 'y': 34, 'z': 35, 'A': 36, 'B': 37, 'C': 38, 'D': 39, 
				'E': 40, 'F': 41, 'G': 42, 'H': 43, 'I': 44, 'J': 45, 'K': 46, 'L': 47, 'M': 48, 'N': 49,
				'O': 50, 'P': 51, 'Q': 52, 'R': 53, 'S': 54, 'T': 55, 'U': 56, 'V': 57, 'W': 58, 'X': 59, 
				'Y': 60, 'Z': 61
			};

			let matches = input.match(/^([0-9a-zA-Z]+)$/);
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
				num += BigInt(B62HEX_MAP_R[b62tk[i]]) * (base**BigInt(i));
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

function BinaryCompare(a:Buffer|ArrayBuffer|BufferView, b:Buffer|ArrayBuffer|BufferView):0|1|-1 {
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

function BinaryDump(buffer:ArrayBuffer|BufferView, format?:2|16|32|62, padding?:boolean):string {
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
			const base = BigInt(format);
			const B62HEX_MAP = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
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
				data.push(B62HEX_MAP[Number(num%base)]);
				num /= base;
			}
			return zeros + data.reverse().join('');
		}
		case 32: {
			const B32HEX_MAP = "0123456789abcdefghijklmnopqrstuv";
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
			const HEX_MAP = "0123456789abcdef";
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