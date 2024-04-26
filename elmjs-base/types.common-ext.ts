declare type bytes			= Uint8Array;
declare type uint			= number;
declare type uint8			= number;
declare type uint16			= number;
declare type uint32			= number;

declare type int			= number;
declare type int8			= number;
declare type int16			= number;
declare type int32			= number;

declare type int_str		= string;
declare type uint_str		= string;

declare type float			= number;
declare type float32		= float;
declare type double			= number;
declare type float64		= double;

declare type epoch			= number;
declare type epoch_milli	= number;
declare type num_str		= string;
declare type json_str		= string;
declare type uniqid			= string;
declare type ipv4			= string;
declare type ipv6			= string;
declare type iso8601_ts		= string;

declare type bigint_str		= string;



declare type EmptyObject = {[K in any]:never};
declare type Without<T, U> = {[P in Exclude<keyof T, keyof U>]?:never};
declare type XOR<T, U> = (T | U) extends object ? (Without<T, U> & U) | (Without<U, T> & T) : T | U;
declare type DeepPartial<T> = {[P in keyof T]?: DeepPartial<T[P]>;};
declare type ObjectKeys<T extends {[key:string]:any}> = keyof T;
declare type ObjectValues<T extends {[key:string]:any}> = T[keyof T];
declare type MakeRequired<T, R extends keyof T> = T & Required<Pick<T, R>>;
declare type MakePartial<T, R extends keyof T> = Omit<T, R> & Partial<Pick<T, R>>;
declare type MakeExcluded<T, E extends keyof T> = Omit<T, E>;
declare type JSONType = null|string|number|boolean|{[x:string]:JSONType}|Array<JSONType>;