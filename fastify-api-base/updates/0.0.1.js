const $ = require('shstore');
const {LogTool} = require('@/env.tools.js');

module.exports = async()=>{
	const sysinfo_coll = $('subsys').mongo.db.collection('sysinfo');

	LogTool.info(`Add index to "sysinfo#key"...`);
	await sysinfo_coll.createIndex({key:1}, {name:'sysinfo#key', unique:true});
}