import fsp from "node:fs/promises";
import $ from "shstore";

import {LogTool} from "@/env.tools.js";
import Config from "@/config.default.js";



export async function check():Promise<boolean> {
	LogTool.info("Checking environmental configurations...");

	// Checking configurations
	let error:boolean = false;

	// Check host identity
	{
		let identity = (process.env['UNIQIDENTITY']||'').trim();
		if ( identity === "" ) {
			const result = await fsp.readFile('/etc/uniqidentity').then((r)=>r.toString('utf8').split(',')[0]).catch((e:Error)=>e);
			if ( typeof result === "string" ) {
				identity = result;
			}
		}

		if ( identity === "" ) {
			LogTool.fatal("Unable to find host identitiy info!");
			LogTool.fatal("Please refer to https:/res.purimize.com/bin/uniqidentity.py to generate static identity file!");
			LogTool.fatal("Or provide via env variable UNIQIDENTITY");
			error = error || true;
		}
		else {
			$('runtime').HOST_ID = identity;
		}
	}
	
	// Check api session secret
	{
		const session = Config.api.secrets.session;
		if ( !Buffer.isBuffer(session) || session.length <= 20 ) {
			LogTool.fatal("Configuration [api.secrets.session] must be a Buffer with length longer than 20 bytes!");
			error = error || true;
		}
	}

	return !error;
}