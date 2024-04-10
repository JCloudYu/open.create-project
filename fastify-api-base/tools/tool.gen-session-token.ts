import $ from "shstore";
import cargs from "clipargs";
import TrimId from "trimid";
import rootat from "rootat";
rootat.search_root = `${rootat.project_root}/_build`;

import "@/env.esext.js";

import {BWT} from "@/lib/bwt.js";
import {LogTool} from "@/env.tools.js";

import Config from "@/config.default.js";



(async()=>{
	// Bind terminate signals
	process
	.on('SIGINT',  (signal)=>process.emit('terminate', signal))
	.on('SIGTERM', (signal)=>process.emit('terminate', signal))
	.on('SIGQUIT', (signal)=>process.emit('terminate', signal));



	// Set up logger
	LogTool.pipe(LogTool.ConsoleLogger);
	LogTool.level = 'eror';

	// Parse incoming arguments
	const argv = cargs
	.bool('help', '--help', '-h')
	.string('expired_at', '--expired-at', '-E')
	.parse<{help:boolean; expired_at:string;}>(process.argv.slice(2));

	if ( argv.help ) {
		console.log("Usage: npm run tool:gen-session-token [OPTIONS] {USER_ID}");
		console.log("Options:");
		console.log("    -h, --help          print this command's options");
		console.log("    -E, --expired-at    set expired timestamp of the token (ISO-8601 format, YYYY-MM-DDThh:mm:ss±hhmm)");
		return process.emit('terminate');
	}


	if ( !await (await import('@/env.check.js')).check() ) {
		return process.emit('terminate', 1);
	}
	
	await (await import('@/env.subsystem.js')).init(['mongodb', 'runtime-data']);
	
	const db = $('subsys').mongo.db;
	const now_ts		= new Date();
	const now_sec		= Math.floor(now_ts.getTime()/1_000);
	const expired_at	= new Date(argv.expired_at||now_ts.getTime() + 86400_000);
	const expired_sec	= Math.floor(expired_at.getTime()/1_000);
	const [user_id]	 	= argv._;
	const user_info	 	= await db.collection('user').findOne({id:user_id});
	if ( !user_info ) {
		console.error(`Target user [${user_id}] doesn't exist!`);
		return process.emit('terminate', 1);
	}

	if ( Number.isNaN(expired_sec) ) {
		console.error(`Token expired timestamp [${argv.expired_at}] doesn't exist!`);
		return process.emit('terminate', 1);
	}
	
	const token_id = TrimId.NEW.toString();
	const sess:DbSession = {
		id: token_id,
		uid: user_info.id,
		source: 'tool',
		issuer: $('runtime').HOST_ID,
		revoked: false,
		access_time: 0,
		expired_time: expired_sec,
		create_time: now_sec
	};

	// Add session info to db
	await $('subsys').mongo.db.collection<DbSession>('session').insertOne(sess);

	

	const auth_token = await BWT.encode<SessionAuthToken>({
		typ: 'session',
		src: sess.source,
		tid: sess.id,
		uid: sess.uid,
		iss: sess.issuer,
		iat: sess.create_time,
		exp: sess.expired_time
	}, Config.api.secrets.session);

	console.log("[TOKEN]");
	console.log(`      ID: ${sess.id}`);
	console.log(`    TYPE: session`);
	console.log(`  SOURCE: ${sess.source}`);
	console.log(`     UID: ${sess.uid}`);
	console.log(`  ISSURE: ${sess.issuer}`);
	console.log(` EXPIRED: ${expired_at.toLocalISOString()}`);
	console.log(`  CREATE: ${now_ts.toLocalISOString()}`);
	console.log(`   TOKEN: ${auth_token}`);

	process.emit('terminate');
})();