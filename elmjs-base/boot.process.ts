interface ProcessInfo {
	digest:{
		style:string;
		script:string;
		build:string;
	}
};
const process_info:ProcessInfo = {
	digest: {
		style:'',
		script:'',
		build:''
	}
};
export default process_info;