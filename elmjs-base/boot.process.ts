interface ProcessInfo {
	digest:{
		style:string;
		script:string;
		build:string;
	},
	config:Config;
};
const process_info:ProcessInfo = {
	digest: {
		style:'',
		script:'',
		build:''
	},
	// @ts-ignore
	config: {}
};
export default process_info;