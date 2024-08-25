#!/usr/bin/env zx
import {fileURLToPath} from 'node:url';
import crypto from "node:crypto";
import path from "node:path";
import Clipargs from "clipargs";
import {JSDOM} from "jsdom";
import {minify} from 'terser';

/**
 *	@type {{
 *		obfuscate?:boolean;
 * 		help?:boolean;
 * 		compile?:boolean;
 *	}};
 **/
const argv = Clipargs
.bool('obfuscate', '-ob', '--obfuscate')
.bool('fullpack', '-p', '--pack')
.bool('help', '-h', '--help')
.bool('env', '-E', '--env')
.parse(process.argv.slice(2));


if ( argv.help ) {
	console.log("Usage yarn build [options]");
	console.log('' +
`Options:
    -h, --help        Print command line usage
	-p, --pack        Whether to copy all the static resources
	-ob, --obfuscate  Whether to obfuscate output boot.js
	-E, --env		  Set environment ( default: prod )
`);
	process.exit(0);
}




const __dirname = path.dirname(fileURLToPath(import.meta.url));
cd(__dirname);



echo("Creating build folder...");
await $`rm -rf ./_temp ./_build`;
let exit_code = (await $`mkdir -p ./_temp ./_build`).exitCode;
if ( exit_code ) process.exit(exit_code);



// Load all scss/sass file paths
echo("Parsing scss/sass files...");
let css_files = [];
css_files = css_files.concat((await $`find . ! -path "./static/*" ! -path "./_temp/*" ! -path "./_template/*" ! -path "./_build/*" ! -path "./node_modules/*" -name "*.scss"`.quiet()).stdout.split('\n'));
css_files = css_files.concat((await $`find . ! -path "./static/*" ! -path "./_temp/*" ! -path "./_template/*" ! -path "./_build/*" ! -path "./node_modules/*" -name "*.sass"`.quiet()).stdout.split('\n'));
css_files = css_files.filter((t)=>t.trim()!=="");



// Load and store module view file paths
echo("Resolving module view files...");
const module_view_map = {};
const view_files = (await $`find . ! -path "./public/*" ! -path "./_build/*" ! -path "./node_modules/*" -name "*.v.html"`.quiet()).stdout.trim().split('\n');
for(const candidate of view_files) {
	if ( candidate === '' ) continue;

	const file_name = path.basename(candidate);
	const key = file_name.substring(0, file_name.length - 7).toUpperCase();
	const view_info = module_view_map[key];
	if ( typeof view_info !== 'undefined' ) {
		console.error(`Unable to register module view at ${candidate}! Module view "${key}" has been registered by file at path ${view_info.path}!`);
		process.exit(1);
	}

	module_view_map[key] = { key, path:candidate };
}



// Load and store module paths
echo("Resolving module scripts...");
const module_script_paths = new Set();
const scripts = (await $`find . ! -path "./public/*" ! -path "./_build/*" ! -path "./node_modules/*" -name "*.m.ts"`.quiet()).stdout.trim().split('\n');
for(const candidate of scripts) {
	if ( candidate === '' ) continue;

	const module_path = candidate.substring(2);
	module_script_paths.add(module_path.substring(0, module_path.length - 3));
}



const config_name = `config-${argv.env||'prod'}.json`;
const result = await fs.readFile(`./${config_name}`).catch(e=>e);
if ( result instanceof Error ) {
	console.error(`Unable to read configuration file ${config_name}`);
	process.exit(1);
}
const env_config = JSON.parse(result.toString('utf8'));




// Generate style.css
echo("Generating style...");
fs.writeFileSync('./_temp/style.scss', css_files.sort((a,b)=>a>b?1:(a<b?-1:0)).map((f)=>`@use "${path.resolve(__dirname, f)}" as *;`).join("\n"), {flag:'w'});
exit_code = (await $`sass --no-source-map ./_temp/style.scss ./_build/style.css`).exitCode;
if ( exit_code ) process.exit(exit_code);

// Calc style hash
const style_hash = await (new Promise((res, rej)=>{
	const hash = crypto.createHash('sha1');
	
	fs.createReadStream('./_build/style.css')
	.on('data', (c)=>hash.update(c))
	.on('error', rej)
	.on('end', ()=>res(hash.digest('hex')));
})).catch(e=>e);
if ( style_hash instanceof Error ) {
	console.error(style_hash.message);
	process.exit(1);
}





// Generate boot script and calc file hash
echo("Generating script...");
exit_code = (await $`tsc`).exitCode;
if ( exit_code ) process.exit(exit_code);

// Resolve module view contents
echo("Dumpping module view contents...");
const verf = new JSDOM();
const verf_body = verf.window.document.body;
const view_ctnts = {};
const errors = [];
for(const key in module_view_map) {
	const view_path = module_view_map[key].path;
	const view_content = verf_body.innerHTML = fs.readFileSync(view_path).toString('utf8');
	if ( verf_body.children.length <= 0 ) {
		echo(`No element found in ${view_path}... skipping`);
		continue;
	}

	if ( verf_body.children.length > 1 ) {
		errors.push(`Module view allows only one element same with the script name! (${view_path})`);
		continue;
	}
	else {
		const module_elm = verf_body.children[0];
		if ( module_elm.tagName.toUpperCase() !== key ) {
			errors.push(`Module view element tag-name doesn't matches the script tag name! (${view_path})`);
			continue;
		}
	}

	view_ctnts[key] = view_content;
}

if ( errors.length > 0 ) {
	echo(`There're errors in module views...`);
	echo(errors.map(i=>`    ${i}`).join("\n"));
	process.exit(1);
}

// Generate dynamic info
const module_dep = [ "require", "exports", ...module_script_paths ];
fs.appendFileSync(`./_build/boot.js`, `
requirejs.undef('boot.module-env');
define("boot.module-env", ${JSON.stringify(module_dep)}, function (require, exports) {
	"use strict";
	Object.assign(exports, ${JSON.stringify(view_ctnts)});
});
`);

// Calc script hash
const script_hash = await (new Promise((res, rej)=>{
	const hash = crypto.createHash('sha1');
	hash.update(JSON.stringify({config:env_config}));
	
	fs.createReadStream('./_build/boot.js')
	.on('data', (c)=>hash.update(c))
	.on('error', rej)
	.on('end', ()=>res(hash.digest('hex')));
})).catch(e=>e);
if ( script_hash instanceof Error ) {
	console.error(script_hash.message);
	process.exit(1);
}


// Calculate all hashes
const batch_hash = crypto.createHash('sha1').update(style_hash, 'hex').update(script_hash, 'hex').digest('hex');
const process_info = {
	digest: {
		style:script_hash.substring(0, 10),
		script:script_hash.substring(0, 10),
		build:batch_hash.substring(0, 10)
	},
	config:env_config
};

// Write final content hash info
fs.appendFileSync(`./_build/boot.js`, `
requirejs.undef('boot.process');
define("boot.process", [ "require", "exports" ], function(require, exports) {
	"use strict";
	Object.assign(exports, ${JSON.stringify(process_info)})
});
`);




// Append hashes to style.js
const stylesheet_path = `style.${batch_hash.substring(0, 10)}.css`;
exit_code = (await $`mv ./_build/style.css ./_build/${stylesheet_path}`).exitCode;
if ( exit_code ) process.exit(exit_code);

// Add versionsed info to boot.js and perform obfuscation
const bootscript_path = `boot.${batch_hash.substring(0, 10)}.js`;
if ( argv.obfuscate ) {
	const out = await minify(fs.readFileSync('./_build/boot.js').toString('utf8'), {compress:true, mangle:true});
	await fs.writeFile(`./_build/${bootscript_path}`, out.code);
	await $`rm -f ./_build/boot.js`;
}
else {
	exit_code = (await $`mv ./_build/boot.js ./_build/${bootscript_path}`).exitCode;
}
if ( exit_code ) process.exit(exit_code);












// Generate index.html and fill dynamic paths
echo("Generating runtime html...");
const DOM = new JSDOM(fs.readFileSync('./index.html').toString('utf8'), {lowerCaseTagName:true});
const html = DOM.window;

const boot_css = html.document.createElement('link');
boot_css.setAttribute('rel', 'stylesheet');
boot_css.setAttribute('type', 'text/css');
boot_css.setAttribute('href', `./${stylesheet_path}`);
html.document.head.appendChild(boot_css);
let base_elm = html.document.head.querySelector('base');
if ( !base_elm ) {
	base_elm = html.document.createElement('base');
	html.document.head.appendChild(base_elm);
}
base_elm.href = env_config.route_prefix||'./';


html.document.body.querySelector('#app-bootstrap-code').setAttribute('data-bootstrap', `./${bootscript_path}`);
fs.writeFileSync('./_build/index.html', DOM.serialize());




echo("Cleanning up...");
await $`rm -rf ./_temp`;





if ( argv.fullpack ) {
	echo("Copy public resources...");
	await $`cp -r ./static/* ./_build`;
}
