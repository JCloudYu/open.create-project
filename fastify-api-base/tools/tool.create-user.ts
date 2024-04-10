import $ from "shstore";
import cargs from "clipargs";
import TrimId from "trimid";
import rootat from "rootat";
rootat.search_root = `${rootat.project_root}/_build`;

import "@/env.esext.js";

import {BWT} from "@/lib/bwt.js";
import {LogTool} from "@/env.tools.js";

import Config from "@/config.default.js";
import { AuthHelper } from "@/lib/auth-helper.js";



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
	.stringArray('role', '--role', '-R')
	.parse<{help:boolean; role:string[]}>(process.argv.slice(2));

	if ( argv.help ) {
		console.log("Usage: npm run tool:create-user [OPTIONS] {USER_ACCOUNT} {USER_PASSWORD}");
		console.log("Options:");
		console.log("    -h, --help       print this command's options");
		console.log("    -R, --role       set role of the created user");
		return process.emit('terminate', 1);
	}


	if ( !await (await import('@/env.check.js')).check() ) {
		return process.emit('terminate', 1);
	}
	
	await (await import('@/env.subsystem.js')).init(['mongodb', 'runtime-data']);
	

	
	if ( argv._.length < 2 ) {
		console.error("Missing required params {account} and {password}!");
		return process.emit('terminate', 1);
	}




	const db = $('subsys').mongo.db;
	const supported_roles:string[] = AuthHelper.SupportedRoles;
	const roles = Array.from(new Set(argv.role||[])).filter(i=>supported_roles.includes(i)) as UserRole[];
	const [account, password] = argv._.map(s=>s.trim());

	if ( !account || !password ) {
		console.error("Account and password must not be empty!");
		return process.emit('terminate', 1);
	}
	
	const user_info:DbUser = {
		id:TrimId.NEW.toString(),
		account,
		password:await AuthHelper.encodePassword(password),
		role:roles,
		update_time:0,
		create_time:Date.unix()
	};

	
	const result = await db.collection<DbUser>('user').findOneAndUpdate({account}, {
		$set:{account},
		$setOnInsert:Object.stripProperties(user_info, ['account'])
	}, {upsert:true, returnDocument:'before'});
	
	if ( result ) {
		console.error(`User with account "${account}" have exsited already!`);
		return process.emit('terminate', 1);
	}
	

	console.log("[USER]");
	console.log(`    ID: ${user_info.id}`);
	console.log(`  ACNT: ${user_info.account}`);
	console.log(`   PWD: ${password}`);
	console.log(`  ROLE: ${user_info.role.map((i)=>i.toUpperCase()).join(',')}`);
	


	process.emit('terminate');
})();