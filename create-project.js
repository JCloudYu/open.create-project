#!/usr/bin/env node
const path = require('node:path');
const fs = require('node:fs');
const child = require('node:child_process');
const clipargs = require("clipargs");

const project_list = require('./project-list.js');



/** @type {{_:string[]; help?:boolean;}} **/
const argv = clipargs
.bool('help', '-h', '--help')
.parse(process.argv.slice(2));



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
const [proj_name, project_dir] = argv._;

console.log(`Creating project directory...`);
const dest_dir = path.resolve(cwd, project_dir);
fs.mkdirSync(dest_dir, {recursive:true});



// Check project nane
if ( project_list.indexOf(proj_name) <= 0 ) {
	console.error(`Project [${proj_name}] is not supported!`);
	process.exit(1);
}
const source_path = `${__dirname}/${proj_name}`;



console.log(`Creating project content..`);
const scripts = child.execSync(`find ${source_path} -mindepth 1 -type f ! -name ".DS_Store" ! -name "Thumbs.db"`).toString('utf8').split("\n").map((i)=>i.trim());
for(const candidate of scripts) {
	if ( candidate === '' ) continue;
	
	const src_path = '.' + candidate.substring(source_path.length)
	const dest_path = path.resolve(dest_dir, src_path);
	fs.mkdirSync(path.dirname(dest_path), {recursive:true});

	console.log(`    ${src_path}`);
	fs.copyFileSync(candidate, dest_path);
}


console.log("Initializing project...");
child.spawnSync("npm", ["install"], {cwd:dest_dir, stdio:[0, 1, 2]});