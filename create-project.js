#!/usr/bin/env node
const path = require('node:path');
const fs = require('node:fs');
const child = require('node:child_process');
const clipargs = require("clipargs");
const tar = require('tar');
const project_list = require('./project-list.js');

(async()=>{
	/** @type {{_:string[]; help?:boolean;}} **/
	const argv = clipargs
		.bool('help', '-h', '--help')
		.parse(process.argv.slice(2));



	if (argv.help) {
		console.log("Usage: npm init create-project {template_name} {project_path}");
		console.log(`Available templates:\n${Object.keys(project_list).map(i=>`    ${i}`).join('\n')}`);
		process.exit(0);
	}

	if (argv._.length < 2) {
		console.error("Project directory path is required!");
		console.error("Usage: npm init create-project {template_name} {project_path}");
		process.exit(1);
	}



	const cwd = process.cwd();
	const [tpl_name, project_dir] = argv._;
	const dest_dir = path.resolve(cwd, project_dir);
	const template_info = project_list[tpl_name];


	// Check target template's existence
	if (!template_info) {
		console.error(`Template [${tpl_name}] is not supported!`);
		process.exit(1);
	}



	// Create destination directory
	fs.mkdirSync(dest_dir, {recursive: true});

	// Download corresponding project from github
	await downloadAndExtractProject(template_info.latest, dest_dir);



	console.log("Initializing project...");
	child.spawnSync("npm", ["install"], {cwd: dest_dir, stdio: [0, 1, 2]});




	// 下載並解壓縮專案
	async function downloadAndExtractProject(downloadUrl, destDir) {
		const response = await fetch(downloadUrl);
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		// 暫存檔案路徑
		const tempPath = path.join(__dirname, `temp-${Date.now()}.tar.gz`);

		// 使用 streaming 方式寫入暫存檔案
		const fileStream = fs.createWriteStream(tempPath);
		
		// 將 response body 直接 pipe 到檔案
		await new Promise((resolve, reject) => {
			response.body
				.pipe(fileStream)
				.on('error', reject)
				.on('finish', resolve);
		});

		// 解壓縮
		await tar.extract({
			gzip: true,
			file: tempPath,
			cwd: destDir,
			strip: 1 // github 的下載路徑永遠都會多一層
		});

		// 清理暫存檔案
		fs.unlinkSync(tempPath);
	}
})().catch((error)=>{
	console.error('Unexpected error:', error.message);
	process.exit(1);
});