import fs from "node:fs";
import $ from "shstore";
import cargs from "clipargs";
import rootat from "rootat";
rootat.search_root = `${rootat.project_root}/_build`;

import "@/env.esext.js";
import {LogTool} from "@/env.tools.js";


const VERSION_FORMAT = /^(\d|([1-9]\d+))\.(\d|([1-9]\d+)).(\d|([1-9]\d+))$/;
interface VersionItem { version:string; major:number; minor:number; build:number; path:string; };

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
	const argv = cargs.parse<{user_id:string; expired_at:string;}>(process.argv.slice(2));
	const [input_version] = argv._;
	if ( input_version !== undefined && (!input_version.match(VERSION_FORMAT) || input_version === '0.0.0' ) ) {
		LogTool.error("Input version is invalid!");
		return process.emit('terminate', 0);
	}



	if ( !await (await import('@/env.check.js')).check() ) {
		return process.emit('terminate', 1);
	}
	
	await (await import('@/env.subsystem.js')).init(['mongodb', 'runtime-data']);
	
	LogTool.level = 'info';
	const db = $('subsys').mongo.db;
	
	
	
	// NOTE: Query the system version
	const info = await db.collection<DbSysInfo>('sysinfo').findOne({key:'version'});
	let from_version:VersionItem;
	{
		const version = input_version||(info ? info.value : '0.0.0');
		const matches = version.match(VERSION_FORMAT);
		const [,major,,minor,,build] = matches;
		from_version = {version, major:Number(major), minor:Number(minor), build:Number(build), path:''};
	}
	
	
	// NOTE: Fetch update files
	const content_list = fs.readdirSync(`${rootat.project_root}/updates`);
	const versions:VersionItem[] = [];
	for( const item of content_list ) {
		if ( item === "." || item === ".." || item.substring(item.length-3) !== '.js' ) continue;
		
		const version = item.substring(0, item.length-3);
		const matches = version.match(VERSION_FORMAT);
		if ( !matches ) continue;
		
		const [,major,,minor,,build] = matches;
		versions.push({version, major:Number(major), minor:Number(minor), build:Number(build), path:item});
	}
	versions.sort(VersionCompare);
	



	let system_version = from_version.version;
	let from_index:number;
	if ( input_version ) {
		from_index = versions.findIndex((v)=>VersionCompare(v, from_version)>=0);
	}
	else {
		from_index = versions.findIndex((v)=>VersionCompare(v, from_version)>0);
	}
	
	
	LogTool.info(`From Version: ${!info?'0.0.0':info.value}`);

	if ( from_index >= 0 ) {
		for(let i=from_index; i<versions.length; i++) {
			const ver_info = versions[i];
			LogTool.info(`Updating to ${ver_info.version} ...`);
			await (await import(`${rootat.project_root}/updates/${ver_info.path}`)).default(system_version);

			system_version = ver_info.version;
			await db.collection<DbSysInfo>('sysinfo').findOneAndUpdate({key:'version'}, {
				$set:{value:ver_info.version},
				$setOnInsert:{key:'version'}
			}, {upsert:true, returnDocument:'after'});
		}
	}
	
	
	if (system_version === from_version.version) {
		LogTool.info( `Nothing updated!` );
	}
	else {
		LogTool.info( `System has been updated from ${from_version.version} to ${system_version}` );
	}



	process.emit('terminate');
})();


function VersionCompare(a:VersionItem, b:VersionItem) {
	if ( a.major > b.major ) return 1;
	if ( a.major < b.major ) return -1;

	if ( a.minor > b.minor ) return 1;
	if ( a.minor < b.minor ) return -1;

	if ( a.build > b.build ) return 1;
	if ( a.build < b.build ) return -1;

	return 0;
}