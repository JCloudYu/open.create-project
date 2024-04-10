import type $ from "shstore";
import type {MongoClient, Db as MongoDb} from "mongodb";
import type {MqttClient as MQTTClient} from "mqtt";

declare global {
	interface SStorageExt {
		(scope:'subsys'): {
			mongo:{
				conn:MongoClient;
				db:MongoDb;
			};
			mqtt:MQTTClient;
		};
		(scope:'runtime'): {
			HOST_ID: string;
			PROJECT_INFO: Record<string, any>;
		};
	}
}