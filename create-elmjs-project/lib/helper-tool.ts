const MAX_SET_TIMEOUT_DELAY = 2_147_483_647;
export function idle(duration:number):Promise<void> {
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

export async function loadScripts(paths:string|string[]) {
	if ( !Array.isArray(paths) ) paths = [paths];
	
	const promises:Promise<void>[] = [];
	for(const path of paths) {
		promises.push(new Promise((res, rej)=>{
			const script = document.createElement('script');
			script.src = path;
			script.type ="application/javascript";
			script.onload = ()=>res();
			script.onerror = (err)=>rej(err);
			document.body.appendChild(script);
		}));
	}

	return Promise.allSettled(promises);
}