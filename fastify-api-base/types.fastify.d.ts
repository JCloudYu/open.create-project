declare module "fastify" {
	export interface FastifyRequest {
		time: number;
		time_milli:number;
		session:RequestSessionInfo;
	}
}

export {};