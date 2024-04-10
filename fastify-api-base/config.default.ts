import path from "path";
import fs from "fs";

import type {MongoClientOptions} from "mongodb";
import type {IClientOptions as MQTTClientOptions} from "mqtt";
import type {LogLevels} from "@/env.tools.js";



// Type to the configurable fiels	
interface Config {
	mongo: { uri:string; options:MongoClientOptions; database:string; }
	mqtt: { uri:string; options:MQTTClientOptions; };
	api: {
		loglevel:LogLevels;
		serve:{host:string; port:number; path_prefix:string};
		secrets:{session:Buffer};
	}
}	

// The default values	
const DB_NAME = 'dtbase';
const config:Config = {
	mongo: { uri:`mongodb://127.0.0.1:27017/${DB_NAME}`, options:{}, database:DB_NAME },
	mqtt: { uri:`mqtt://127.0.0.1:1883`, options:{} },
	api:{
		loglevel: 'info',
		serve: { host:'127.0.0.1', port:8080, path_prefix:'/api' },
		secrets: {
			session: Buffer.alloc(0)
		}
	}
};



export type ConfigFormat = {
	mongo?:DeepPartial<Config['mongo']>;
	mqtt?:DeepPartial<Config['mqtt']>;
	api?:DeepPartial<Config['api']>;
};
export default config;






// Convert absolute path for require
function ConvertAbsPath(path:string):string {
	return path;
}

// Loads additional configuration files to overwrite default values
{
	const VERBOSE = Number(process.env['DYNAMIC_CONF_VERBOSE']||'0') !== 0;
	const GLOBAL_PATHS = (process.env['DYNAMIC_CONF_PATHS']||process.env['DYNCONF_SEARCH_PATHS']||'').split(',').map(v=>v.trim()).filter((v)=>v.trim()!=='');
	const CONFIG_PATHS:string[] = [ ...GLOBAL_PATHS, './config.js' ];
	for(const candidate of CONFIG_PATHS) {
		const script_path = path.resolve(__dirname, candidate)
		try {
			fs.accessSync(script_path, fs.constants.F_OK|fs.constants.R_OK);
		}
		catch(e:any) {
			const error:NodeJS.ErrnoException = e;
			if ( error.code === 'ENOENT' ) {
				if ( VERBOSE ) {
					console.log(`No configuration file found at ${script_path}! Skipping...`);
				}
				continue;
			}
			throw e;
		}

		let imported = require(ConvertAbsPath(script_path));
		if ( IsPlainObject(imported) && imported.__esModule && imported['default'] !== undefined ) {
			imported = imported['default'];	
		}

		if ( !IsPlainObject(imported) ) {
			if ( VERBOSE ) {
				console.error(`File "${script_path}" contains none-object configurations! Skipping...`);
			}
			continue;
		}
		
		DeepMerge(config, imported);
	}
}

function IsPlainObject(d:any) { return Object.prototype.toString.call(d) === "[object Object]"; }
function DeepMerge(receiver:{[key:string]:any}, ...sources:any[]):{[key:string]:any}|undefined {
	if ( !IsPlainObject(receiver) ) return undefined;
	for(const source of sources) {
		if ( !IsPlainObject(source) ) continue;
		const keys = Object.keys(source);
		for(const key of keys) {
			const src_val = source[key];
			if ( IsPlainObject(src_val) && IsPlainObject(receiver[key]) ) {
				receiver[key] = DeepMerge(receiver[key], src_val);
			}
			else {
				receiver[key] = src_val;
			}
		}
	}

	return receiver;
}
