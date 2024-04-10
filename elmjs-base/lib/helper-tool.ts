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

	static async loadResources(paths:string|((string|null)[]), type:'js'|'cess') {
		if ( !Array.isArray(paths) ) paths = [paths];
		
		const res_paths = [...paths, null];
		const promises:Promise<void>[] = [];
		for(const path of res_paths) {
			if ( path === null ) {
				const tasks = promises.splice(0);
				if ( tasks.length > 0 ) {
					await Promise.allSettled(tasks).then(results=>{
						const has_rejected = results.find(i=>i.status==='rejected');
						return has_rejected ? Promise.reject(results) : undefined;
					});
				}

				continue;
			}
			
			promises.push(new Promise((res, rej)=>{
				if ( type === 'js' ) {
					const script = document.createElement('script');
					script.src = path;
					script.type ="application/javascript";
					script.onload = ()=>res();
					script.onerror = (err)=>rej(err);
					document.body.appendChild(script);
				}
				else {
					const link = document.createElement('link');
					link.href = path;
					link.type = 'text/css';
					link.rel = 'stylesheet';
					link.onload = ()=>res();
					link.onemptied = (e)=>rej(e);
					document.head.append(link);
				}
			}));
		}
	}
}