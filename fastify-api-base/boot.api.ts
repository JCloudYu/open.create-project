import $ from "shstore";
import Fastify from "fastify";
import ClipArgs from "clipargs";

import rootat from "rootat";
rootat.search_root = `${rootat.project_root}/_build`;

import "@/env.esext.js";

import {BWT} from "@/lib/bwt.js";
import {ContextCtrl, LogTool} from "@/env.tools.js";
import {ErrorCode} from "@/data/error-code.js";

import Config from "@/config.default.js";



(async()=>{
	// Bind terminate signals
	process
	.on('SIGINT',  (signal)=>process.emit('terminate', signal))
	.on('SIGTERM', (signal)=>process.emit('terminate', signal))
	.on('SIGQUIT', (signal)=>process.emit('terminate', signal));


	// Set up logger
	LogTool.pipe(LogTool.ConsoleLogger);
	LogTool.level = Config.api.loglevel||'info';


	// Parse incoming arguments
	const argv = ClipArgs.parse<{}>(process.argv.slice(2));
	

	// Check all prerequisite environmental configurations
	if ( !await (await import('@/env.check.js')).check() ) {
		return process.emit('terminate', 1);
	}

	// Initialize all sub-systems
	await (await import('@/env.subsystem.js')).init(['mongodb', 'runtime-data']);


	
	// Initialize fastify server
	LogTool.info("Preparing http handler...")
	{
		const api_prefix = Config.api.serve.path_prefix[0]==='/' ? Config.api.serve.path_prefix : ('/'+ Config.api.serve.path_prefix);
		const fastify = Fastify();
		
		fastify
		// Add time fields
		.addHook('onRequest', async(req)=>req.time = Math.floor((req.time_milli = Date.now())/1000))
		// Add token verifications
		.addHook('onRequest', async(req)=>{
			req.session = {is_login:false}

			const authorization = (req.headers['authorization']||'').trim();
			if ( !authorization ) return;

			const [auth_method, token] = authorization.split(' ').map(i=>i.trim());
			if ( auth_method.toLowerCase() !== 'bearer' ) return;

			const result = await BWT.decode<SessionAuthToken>(token, Config.api.secrets.session);
			if ( !result ) return;
			if ( result.exp > 0 && result.exp < req.time ) return;
			
			const session = await $('subsys').mongo.db.collection<DbSession>('session').findOneAndUpdate({id:result.tid, revoked:false}, {$set:{access_time:Date.unix()}}, {projection:{_id:0}, returnDocument:'after'});
			if ( !session ) return;
			

			
			Object.assign(req.session, {is_login:true, token:session});
		})
		.register(async(fastify)=>{
			// Apis without authorization
			fastify.register(async(fastify)=>{
				fastify.register((await import('@/routes/version.js')).init);
			})
			
			// Apis that requires authorization
			fastify.register(async(fastify)=>{
				fastify
				.addHook<{Reply:APIErrorResponse}>('onRequest', async(req, res)=>{
					if ( req.session.is_login ) return;

					return res.status(401).send({
						scope:req.routeOptions.url||req.url,
						code:ErrorCode.UNAUTHORIZED,
						message: "You're not authorized to access this resource!"
					});
				});


				fastify.register((await import('@/routes/me.js')).init, {prefix:'/me'});
			});
		}, {prefix:api_prefix});



		LogTool.info("Binding http server...");
		const bind_result = await fastify.listen(Config.api.serve);
		LogTool.info(`Server is now listening on \`${bind_result}\`!`);
		ContextCtrl.final(()=>fastify.close());
	}
})();