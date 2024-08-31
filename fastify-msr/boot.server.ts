import "./env.bootstrap.js";

import $ from "shstore";
import path from "path";
import Fastify from "fastify";
import FastifyView from "@fastify/view";
import FastifyStatic from "@fastify/static";
import Engine from "@/env.template-engine.js";
import rootat from "rootat";

import {ContextCtrl, LogTool} from "@/env.ctxt-tools.js";

LogTool.pipe(LogTool.ConsoleLogger);
LogTool.level = 'info';




(async()=>{
	const server = Fastify({
		logger:$.LOGGING
	});
	
	server
	.register(FastifyStatic, {
		root:path.resolve(rootat.project_root, process.env.STATIC_RES_ROOT||'statics'),
		prefix:'/res/'
	})
	.register(FastifyView, {
		engine:{eta:new Engine()},
		templates:path.resolve(rootat.project_root, process.env.VIEW_ROOT||'views')
	})
	.register(async(fastify)=>{
		fastify.register((await import('@/routes/routes.js')).handler);
		fastify.get('/error', async()=>{
			throw new TypeError("FCK");
		});
	})
	.setErrorHandler(async(error, request, reply)=>{
		LogTool.error("Unexpected error:", error, request.method, request.url);
		return reply.status(500).view('errors/500', {
			DEBUG_MODE:$.DEBUG,
			error
		});
	})
	.setNotFoundHandler(async(request, reply)=>{
		return reply.status(404).view('errors/404', {});
	});
	
	


	const info = await server.listen({
		host:process.env.SERVER_HOST!,
		port:Number(process.env.SERVER_PORT!),
	});
	if ( !$.LOGGING ) {
		console.log(`Server is now listening on ${info}`);	
	}
	
	ContextCtrl.final(()=>server.close());
})()
.catch((e:Error)=>{process.emit('terminate', e); console.error(e)});