#!/usr/bin/env zx

import node_url from "node:url";
import clipargs from "clipargs";

const __dirname = path.dirname(node_url.fileURLToPath(import.meta.url));

/** @type {{_:string[]; help?:boolean;}} **/
const argv = clipargs
.bool('help', '-h', '--help')
.parse(process.argv.slice(3));


if ( argv.help ) {
	console.log("Usage: npm init create-elmjs-project {project_path}");
	process.exit(0);
}

if ( argv.length <= 0 ) {
	console.error("Project directory path is required!");
	console.error("Usage: npm init create-elmjs-project {project_path}");
	process.exit(1);
}


const cwd = process.cwd();
const [project_dir] = argv._;

echo(`Creating project directory...`);
const dest_dir = path.resolve(cwd, project_dir);
fs.ensureDirSync(dest_dir);


const source_path = `${__dirname}/create-elmjs-project`;
echo(`Creating project content..`);
const scripts = (await $`find ${source_path} -mindepth 1 -type f ! -name ".DS_Store" ! -name "Thumbs.db"`.quiet()).stdout.trim().split('\n');
for(const candidate of scripts) {
	if ( candidate === '' ) continue;
	
	const src_path = '.' + candidate.substring(source_path.length)
	const dest_path = path.resolve(dest_dir, src_path);
	fs.ensureDirSync(path.dirname(dest_path));

	echo(`    ${src_path}`);
	fs.copyFileSync(candidate, dest_path);
}


echo("Initializing project...");
cd(dest_dir);
$`npm install`;