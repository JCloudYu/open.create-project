import "@/env.ctxt-tools.js";
import { ENVHelper } from "@/lib/env-helper.js";
import dotenv from "dotenv";
import $ from "shstore";

// Load .env file
{
	const env_paths = ['.env', '.env.local'];
	env_paths.splice(1, 0, process.env['NODE_ENV']||'prod');
	
	dotenv.config({override:true, path: env_paths});

	Object.defineProperties($, {
		DEBUG: {enumerable:true, value:ENVHelper.Truthy(process.env.DEBUG)},
		LOGGING: {enumerable:true, value:ENVHelper.Truthy(process.env.LOGGING)},
	});
}