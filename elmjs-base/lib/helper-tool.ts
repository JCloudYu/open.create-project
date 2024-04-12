type ResourceItem = 
	string|
	{type:'css'; path:string; integrity?:string; credentials?:boolean; salt?:string;}|
	{type:'js';  path:string; integrity?:string; credentials?:boolean; salt?:string;};

const MAX_SET_TIMEOUT_DELAY = 2_147_483_647;
export class HelperTool {
	static async idle(duration:number):Promise<void> {
		return new Promise((res)=>{

			let remained_dur = duration;

			setTimeout(CheckDur, 0);
			function CheckDur() {
				if ( remained_dur === 0 ) {
					return res();
				}

				const dur = remained_dur >= MAX_SET_TIMEOUT_DELAY ? MAX_SET_TIMEOUT_DELAY : remained_dur;
				remained_dur -= dur;
				setTimeout(CheckDur, dur);
			}
		});
	}

	static async loadResources(paths:(ResourceItem|null)[], batch_salt:string='') {
		if ( !Array.isArray(paths) ) paths = [paths];
		
		const res_paths = [...paths, null];
		const promises:Promise<void>[] = [];
		for(const resource of res_paths) {
			if ( resource === null ) {
				const tasks = promises.splice(0);
				if ( tasks.length > 0 ) {
					await Promise.allSettled(tasks).then(results=>{
						const has_rejected = results.find(i=>i.status==='rejected');
						return has_rejected ? Promise.reject(results) : undefined;
					});
				}

				continue;
			}
			
			const resinfo:ResourceItem = typeof resource === "string" ? {type:'js', path:resource} : resource;
			promises.push(new Promise((res, rej)=>{
				const type = resinfo.type;
				const salt = resinfo.salt||batch_salt||'';
				const orig = resinfo.credentials ? 'use-credentials' : 'anonymous';
				const intg = resinfo.integrity||'';

				if ( type === 'js' ) {
					const script = document.createElement('script');
					script.src = `${resinfo.path}${(salt?'?':'') + salt}`;
					script.type ="application/javascript";
					script.crossOrigin = orig;
					script.integrity = intg;
					script.onload = ()=>res();
					script.onerror = (err)=>rej(err);
					document.body.appendChild(script);
				}
				else {
					const link = document.createElement('link');
					link.href = `${resinfo.path}${(salt?'?':'') + salt}`;
					link.type = 'text/css';
					link.rel = 'stylesheet';
					link.crossOrigin = orig;
					link.integrity = intg;
					link.onload = ()=>res();
					link.onemptied = (e)=>rej(e);
					document.head.append(link);
				}
			}));
		}
	}
}