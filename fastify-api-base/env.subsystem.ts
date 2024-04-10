import fs from "node:fs";

import $ from "shstore";
import rootat from "rootat";
import {MongoClient} from "mongodb";
import MQTT from "mqtt";

import {LogTool} from "@/env.tools.js";
import Config from "@/config.default.js";



const SubSystems = Object.freeze({
	"mongodb":InitMongoDB,
	"mqtt":InitMQTT,
	"runtime-data":InitRuntimeData
} as const);

type SystemIds = keyof typeof SubSystems;
export async function init(system_ids:SystemIds[]):Promise<void> {
	for(const id of system_ids) {
		const initializer = SubSystems[id];
		if ( !initializer ) {
			throw new RangeError("Given subsystem is not defined!");
		}

		await initializer();
	}
}



async function InitMongoDB() {
	LogTool.info("Initializing MongoDB connection...");

	const mongo_conf = Config.mongo;
	const conn = await MongoClient.connect(mongo_conf.uri, mongo_conf.options);
	const db = conn.db(mongo_conf.database);
	$('subsys').mongo = { conn, db };
}

async function InitMQTT() {
	LogTool.info("Initializing MQTT connection...")
	const mqtt_conf = Config.mqtt;
	const conn = await MQTT.connectAsync(mqtt_conf.uri, mqtt_conf.options);
	$('subsys').mqtt = conn;
}

async function InitRuntimeData() {
	LogTool.info("Initializing runtime data...");

	// Load package.json into PROJECT_INFO
	$('runtime').PROJECT_INFO = JSON.decode<AnyObject>(
		fs.readFileSync(`${rootat.project_root}/package.json`).toString('utf8')
	)!;
}