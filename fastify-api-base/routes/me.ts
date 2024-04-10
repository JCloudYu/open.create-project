import type {FastifyInstance} from "fastify";

export async function init(fastify:FastifyInstance) {
	// GET /api/me/session
	{
		fastify.get<{Reply:DbSession}>('/session', async(req, res)=>{
			const token_info = req.session.token!;
			return res.status(200).send(token_info);
		});
	}
}