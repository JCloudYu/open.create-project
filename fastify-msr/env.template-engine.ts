import fs from "fs";
import {Eta} from "eta";
import type {EtaConfig} from "eta";
import {LogTool} from "@/env.ctxt-tools.js";


const _EnginePrivates:WeakMap<Engine, {
	cache: Map<string, string>;
	watchers: Map<string, fs.FSWatcher>;
}> = new WeakMap();

export default class Engine extends Eta {
    constructor(options?: Partial<EtaConfig>) {
        super(Object.assign(options || {}, { varName: "$" }));

		_EnginePrivates.set(this, {
			cache:new Map(), watchers:new Map()
		})
    }

    readFile = ReadFile as Eta['readFile'];
}

function ReadFile(this:Eta, file: string): string {
	const that = _EnginePrivates.get(this)!;

	// Check cache exists
	if (that.cache.has(file)) {
		return that.cache.get(file) as string;
	}


	// Read and cache content if cache not found
	const content = fs.readFileSync(file).toString('utf8');
	that.cache.set(file, content);
	
	// Hook watcher on file
	const watcher = fs.watch(file, (eventType) => {
		if (eventType !== 'rename') {
			LogTool.info("Reloading new contents for:", file, "type:", eventType);
			const content = fs.readFileSync(file).toString('utf8');
			that.cache.set(file, content);
		}
		else {
			that.cache.delete(file);
			that.watchers.get(file)?.close();
			that.watchers.delete(file);
		}
	});

	that.watchers.set(file, watcher);

	return content;
}