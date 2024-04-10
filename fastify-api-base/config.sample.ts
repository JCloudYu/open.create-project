import {ConfigFormat} from "@/config.default.js";

const config:ConfigFormat = {
	mongo: { uri:'mongodb://127.0.0.1:27017' },
	mqtt: { uri:'mqtt://127.0.0.1:1883' },
	api:{
		loglevel: 'info',
		serve: { host:'127.0.0.1', port:8088, path_prefix:'/api' },
		secrets: {
			session: Buffer.alloc(0)
		}
	}
};

export default config;