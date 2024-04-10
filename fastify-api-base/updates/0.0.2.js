const $ = require('shstore');
const {LogTool} = require('@/env.tools.js');

module.exports = async()=>{
	// Session
	const session_coll = $('subsys').mongo.db.collection('session');
	
	LogTool.info(`Add index "session#id"...`);
	await session_coll.createIndex({id:1}, {name:'session#id', unique:true});
	
	LogTool.info(`Add index "session#uid"...`);
	await session_coll.createIndex({uid:1}, {name:'session#uid'});
	
	LogTool.info(`Add index "session#revoked"...`);
	await session_coll.createIndex({revoked:1}, {name:'session#revoked', partialFilterExpression: {revoked:true}});
	
	LogTool.info(`Add index "session#access_time"...`);
	await session_coll.createIndex({access_time:1}, {name:'session#access_time'});
	
	LogTool.info(`Add index "session#expired_time"...`);
	await session_coll.createIndex({expired_time:1}, {name:'session#expired_time'});
	
	
	
	// User
	const user_coll = $('subsys').mongo.db.collection('user');

	LogTool.info(`Add index "user#id"...`);
	await user_coll.createIndex({id:1}, {name:'session#id', unique:true});
	
	LogTool.info(`Add index "user#account"...`);
	await user_coll.createIndex({account:1}, {name:'session#account', unique:true});
	
	LogTool.info(`Add index "user#role"...`);
	await user_coll.createIndex({role:1}, {name:'session#role'});
}