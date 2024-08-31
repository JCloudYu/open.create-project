export class ENVHelper {
	static Truthy(value:string|undefined):boolean {
		return ['1', 't', 'true', 'on'].includes((value||'').toLowerCase());
	}
	static Falsy(value:string|undefined):boolean {
		return !this.Truthy(value);
	}
}