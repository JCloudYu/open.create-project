import type {FastifyInstance} from "fastify";
import $ from "shstore";

export async function init(fastify:FastifyInstance) {
	fastify.get<{Reply:{version:string}}>('/version', async(req, res)=>{
		return res.status(200).send({version:$('runtime').PROJECT_INFO.version});
	});
}