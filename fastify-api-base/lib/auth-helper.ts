import {webcrypto as WebCrypto} from "crypto";
import {Base62} from "@/lib/base-convert.js";

const UTF8Encoder = new TextEncoder();
const UTF8Decoder = new TextDecoder();
export class AuthHelper {
	static get SupportedRoles():UserRole[] {
		return ['admin'];
	}
	static async encodePassword(password:string):Promise<string> {
		const salt = new Uint8Array(4);
		WebCrypto.getRandomValues(salt);
		
		const pass_raw = Uint8Array.binaryConcat([salt, UTF8Encoder.encode(password)]);
		const pass_hash = await WebCrypto.subtle.digest('SHA-256', pass_raw);
		const encoded = Uint8Array.binaryConcat([salt, pass_hash]);
		return Uint8Array.binaryDump(encoded, 62);
	}
	static async verifyPassword(password:string, encoded:string) {
		const raw_encoded = Uint8Array.readFrom(encoded, 62);
		
		const salt = raw_encoded.subarray(0, 4);
		const hash_verf = raw_encoded.subarray(4);
		
		const pass_raw = Uint8Array.binaryConcat([salt, UTF8Encoder.encode(password)]);
		const hash = await WebCrypto.subtle.digest('SHA-256', pass_raw);
		return Uint8Array.binaryCompare(hash_verf, hash) === 0;
	}
}