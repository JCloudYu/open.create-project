#!/usr/bin/env node
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const https = require('node:https');
const http = require('node:http');
const child = require('node:child_process');
const clipargs = require("clipargs");
const tar = require('tar');
const project_list = require('./project-list.js');

(async()=>{
	/** @type {{_:string[]; help?:boolean; list?:boolean;}} **/
	const argv = clipargs
		.bool('help', '-h', '--help')
		.bool('list', '-l', '--list')
		.parse(process.argv.slice(2));



	if (argv.help) {
		console.log("Usage: npm init create-project {template_name} {project_path}");
		console.log("       create-project --list");
		console.log(`Available templates:\n${Object.keys(project_list).map(i=>`    ${i}`).join('\n')}`);
		process.exit(0);
	}

	if (argv.list) {
		for (const key of Object.keys(project_list)) {
			console.log(key);
		}
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

	



	// 下載並解壓縮專案
	async function downloadAndExtractProject(downloadUrl, destDir) {
		// 暫存檔案路徑 - 使用系統暫存目錄，確保跨平台相容性
		const tempPath = path.join(os.tmpdir(), `create-project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.tar.gz`);

		// 建立暫存檔 stream
		const fileStream = fs.createWriteStream(tempPath);
		
		// 將 downloadUrl 下載到暫存檔
		console.log(`Downloading ${downloadUrl}...`);
		const stream = await getRequest(downloadUrl);
		await new Promise((resolve, reject) => {
			stream.pipe(fileStream);
			fileStream.on('finish', ()=>{
				stream.destroy();
				resolve();
			});
			fileStream.on('error', reject);
		});

		// 解壓縮
		console.log(`Extracting ${destDir}...`);
		await tar.extract({
			gzip: true,
			file: tempPath,
			cwd: destDir,
			strip: 1, // github 的下載路徑永遠都會多一層
			filter: (path, entry) => {
				console.log(`    ${path}`);
				return true;
			}
		});

		// 清理暫存檔案
		fs.unlinkSync(tempPath);
	}


	async function getRequest(url) {
		const req_module = url.startsWith('https:') ? https : http;

		return new Promise((resolve, reject) => {
			const request = req_module.get(url, (response) => {
				// 處理重定向
				if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
					const location = response.headers.location;
					if (location) {
						response.destroy();
						
						// 遞迴處理重定向
						getRequest(location).then(resolve).catch(reject);
						return;
					}
				}
				
				if (response.statusCode !== 200) {
					reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
					return;
				}
				
				resolve(response);
			});
			
			request.on('error', reject);
		});
	}
})().catch((error)=>{
	console.error('Unexpected error:', error.message);
	process.exit(1);
});