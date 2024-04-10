declare global {
	// Misc content
	type UserRole = 'admin'|'user';

	// Database structure
	interface DbUser {
		id:uniqid;
		account:string;
		password:string;
		role:UserRole[];
		update_time:epoch;
		create_time:epoch;
	};

	interface DbSession {
		id:uniqid;
		uid:DbUser['id'];
		source:'auth'|'tool';
		issuer:string;
		revoked:boolean;
		access_time:epoch;
		expired_time:epoch;
		create_time:epoch;
	};
	
	interface DbSysInfo<ValueType=any> {
		key:string;
		value:ValueType;
	};






	// API Runtime data
	interface PagingQuery { p?:uint; ps?:uint; }
	interface PagingCursor<DataType=any> {
		page:uint;
		page_size:uint;
		records:DataType[];
		total_records:uint;
		total_pages:uint;
	};

	interface APIErrorResponse<ErrorData=any> {
		scope:string;
		code:string;
		message:string;
		data?:ErrorData
	};

	interface SessionAuthToken {
		src:DbSession['source']
		typ:'session',
		tid:DbSession['id'];
		uid:DbSession['uid'];
		iss:DbSession['issure'];
		iat:DbSession['create_time'];
		exp:DbSession['expired_time'];
	};
	
	interface RequestSessionInfo {
		is_login:boolean;
		token?:DbSession;
	};
}

export {};