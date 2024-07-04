interface RouteHandler {(...args:any[]):void|Promise<void>}
interface RouteInfo { route_path:string; matcher:MatchFunction; meta:any; };
interface LocateResult<MetaType=any> {
	route:string; path:string; meta:MetaType, params:{[key:string]:string|Array<string>}
}

export class Router {
	#route:RouteInfo[] = [];
	#route_plain:RouteInfo[] = [];
	static #prefix:string = '';

	static init():Router { return new Router() }

	static get route_prefix() {
		return this.#prefix;
	}

	static set route_prefix(prefix:string) {
		this.#prefix = '' + prefix;
	}

	static resolve(route:string) {
		const route_prefix = this.route_prefix;
		if ( route_prefix && !route.startsWith(route_prefix) ) {
			route = `${route_prefix}${route}`;
		}

		return route;
	}

	route(route:string, meta:any):this {
		route = Router.resolve(route);
		
		const route_result = match(route, {decode:decodeURIComponent});
		const route_ctnt:RouteInfo = {
			route_path: route,
			matcher:route_result,
			meta
		};

		if ( route_result.plain_route ) {
			this.#route_plain.push(route_ctnt);
		}
		else {
			this.#route.push(route_ctnt)
		}
		return this;
	}

	locate<MetaType=any>(path:string):LocateResult<MetaType>|null {
		path = Router.resolve(path);

		for(const route of this.#route_plain) {
			const match_result = route.matcher(path);
			if ( match_result ) {
				return {
					route:route.route_path,
					path,
					meta:route.meta,
					params:match_result.params as any
				};
			}
		}


		for(const route of this.#route) {
			const match_result = route.matcher(path);
			if ( match_result ) {
				return {
					route:route.route_path,
					path,
					meta:route.meta,
					params:match_result.params as any
				};
			}
		}

		return null;
	}
}


class RouteCtrl extends EventTarget {
	#cached_data:Record<string, any> = {};

	get permData():Record<string, any> {
		return this.#cached_data;
	}
	set permData(data:Record<string, any>) {
		this.#cached_data = Object.assign({}, data);
	}
	get route() {
		return {
			path:window.location.pathname,
			state:window.history.state||null
		};
	}

	push(url:string, state?:any):void {
		const parsed_url = new URL(`http://HOST${(url[0]==='/'?'':'/')}${url}`);
		for(const key in this.#cached_data) {
			parsed_url.searchParams.set(key, `${this.#cached_data[key]||''}`);
		}

		const route_path = Router.resolve(parsed_url.pathname);
		history.pushState(state, '', `${route_path}${parsed_url.search}${parsed_url.hash}`);
		this.dispatchEvent(Object.assign(new Event('changed', {bubbles:false}), {op:'pushed'}));
	}
	replace(url:string, state?:any):void {
		const parsed_url = new URL(`http://HOST${(url[0]==='/'?'':'/')}${url}`);
		for(const key in this.#cached_data) {
			parsed_url.searchParams.set(key, `${this.#cached_data[key]||''}`);
		}

		const route_path = Router.resolve(parsed_url.pathname);
		history.replaceState(state, '', `${route_path}${parsed_url.search}${parsed_url.hash}`);
		this.dispatchEvent(Object.assign(new Event('changed', {bubbles:false}), {op:'replaced'}));
	}
	pop(delta:number=1) {
		history.go(-delta);
		this.dispatchEvent(Object.assign(new Event('changed', {bubbles:false}), {op:'poped'}));
	}

	on<EventType extends Event = Event&{op:'pushed'|'poped'|'replaced', [key:string]:any}>(event:'changed', callback:{(e:EventType):void}):symbol;
	on<EventType extends Event = Event>(event:string, callback:{(e:EventType):void}):symbol {
		return super.on(event, callback);
	}
}

export const Route = new RouteCtrl();


window.addEventListener('popstate', (e)=>{
	Route.dispatchEvent(Object.assign(new Event('changed', {bubbles:false}), {op:'poped'}));
});


// Test script
if ( typeof require !== "undefined" && typeof module !== "undefined" && Object(require) === require && require.main === module ) {
	(()=>{
		// 初始化 Router
		const router = Router.init();

		// 註冊路由
		router.route('/', (info:LocateResult)=>{
			console.log('ROUTE:', info.route, 'PATH:', info.path, 'PARAMS:', info.params);
		});
		router.route('/user/:userId', (info:LocateResult)=>{
			console.log('ROUTE:', info.route, 'PATH:', info.path, 'PARAMS:', info.params);
		});
		router.route('/product/create', (info:LocateResult)=>{
			console.log('ROUTE:', info.route, 'PATH:', info.path, 'PARAMS:', info.params);
		});
		router.route('/product/:productId', (info:LocateResult)=>{
			console.log('ROUTE:', info.route, 'PATH:', info.path, 'PARAMS:', info.params);
		});
		router.route('/product/:productId/info', (info:LocateResult)=>{
			console.log('ROUTE:', info.route, 'PATH:', info.path, 'PARAMS:', info.params);
		});
		router.route('/contact', (info:LocateResult)=>{
			console.log('ROUTE:', info.route, 'PATH:', info.path, 'PARAMS:', info.params);
		});
		router.route('/404', (info:LocateResult)=>{
			console.log('ROUTE:', info.route, 'PATH:', info.path, 'PARAMS:', info.params);
		});



		// 假設使用者的路徑為 '/product/abc'
		const paths = [
			'/product/abc',
			'/product/create',
			'/product/cde/info'
		];

		const Handler404 = router.locate('/404')!;
		for (const path of paths) {
			let matchedRoute = router.locate<RouteHandler>(path) || Handler404;
			
			const {meta:handler, ...route_info} = matchedRoute;
			handler(route_info);
		}
	})();
}









// path-to-regexp module contents
/**
 * Tokenizer results.
 */
interface LexToken {
	type:
	| "OPEN"
	| "CLOSE"
	| "PATTERN"
	| "NAME"
	| "CHAR"
	| "ESCAPED_CHAR"
	| "MODIFIER"
	| "END";
	index: number;
	value: string;
}

/**
 * Tokenize input string.
 */
function lexer(str: string): LexToken[] {
	const tokens: LexToken[] = [];
	let i = 0;

	while (i < str.length) {
		const char = str[i];

		if (char === "*" || char === "+" || char === "?") {
			tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
			continue;
		}

		if (char === "\\") {
			tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
			continue;
		}

		if (char === "{") {
			tokens.push({ type: "OPEN", index: i, value: str[i++] });
			continue;
		}

		if (char === "}") {
			tokens.push({ type: "CLOSE", index: i, value: str[i++] });
			continue;
		}

		if (char === ":") {
			let name = "";
			let j = i + 1;

			while (j < str.length) {
				const code = str.charCodeAt(j);

				if (
					// `0-9`
					(code >= 48 && code <= 57) ||
					// `A-Z`
					(code >= 65 && code <= 90) ||
					// `a-z`
					(code >= 97 && code <= 122) ||
					// `_`
					code === 95
				) {
					name += str[j++];
					continue;
				}

				break;
			}

			if (!name) throw new TypeError(`Missing parameter name at ${i}`);

			tokens.push({ type: "NAME", index: i, value: name });
			i = j;
			continue;
		}

		if (char === "(") {
			let count = 1;
			let pattern = "";
			let j = i + 1;

			if (str[j] === "?") {
				throw new TypeError(`Pattern cannot start with "?" at ${j}`);
			}

			while (j < str.length) {
				if (str[j] === "\\") {
					pattern += str[j++] + str[j++];
					continue;
				}

				if (str[j] === ")") {
					count--;
					if (count === 0) {
						j++;
						break;
					}
				} else if (str[j] === "(") {
					count++;
					if (str[j + 1] !== "?") {
						throw new TypeError(`Capturing groups are not allowed at ${j}`);
					}
				}

				pattern += str[j++];
			}

			if (count) throw new TypeError(`Unbalanced pattern at ${i}`);
			if (!pattern) throw new TypeError(`Missing pattern at ${i}`);

			tokens.push({ type: "PATTERN", index: i, value: pattern });
			i = j;
			continue;
		}

		tokens.push({ type: "CHAR", index: i, value: str[i++] });
	}

	tokens.push({ type: "END", index: i, value: "" });

	return tokens;
}

interface ParseOptions {
	/**
	 * Set the default delimiter for repeat parameters. (default: `'/'`)
	 */
	delimiter?: string;
	/**
	 * List of characters to automatically consider prefixes when parsing.
	 */
	prefixes?: string;
}

/**
 * Parse a string for the raw tokens.
 */
function parse(str: string, options: ParseOptions = {}): Token[] {
	const tokens = lexer(str);
	const { prefixes = "./" } = options;
	const defaultPattern = `[^${escapeString(options.delimiter || "/#?")}]+?`;
	const result: Token[] = [];
	let key = 0;
	let i = 0;
	let path = "";

	const tryConsume = (type: LexToken["type"]): string | undefined => {
		if (i < tokens.length && tokens[i].type === type) return tokens[i++].value;
	};

	const mustConsume = (type: LexToken["type"]): string => {
		const value = tryConsume(type);
		if (value !== undefined) return value;
		const { type: nextType, index } = tokens[i];
		throw new TypeError(`Unexpected ${nextType} at ${index}, expected ${type}`);
	};

	const consumeText = (): string => {
		let result = "";
		let value: string | undefined;
		while ((value = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR"))) {
			result += value;
		}
		return result;
	};

	while (i < tokens.length) {
		const char = tryConsume("CHAR");
		const name = tryConsume("NAME");
		const pattern = tryConsume("PATTERN");

		if (name || pattern) {
			let prefix = char || "";

			if (prefixes.indexOf(prefix) === -1) {
				path += prefix;
				prefix = "";
			}

			if (path) {
				result.push(path);
				path = "";
			}

			result.push({
				name: name || key++,
				prefix,
				suffix: "",
				pattern: pattern || defaultPattern,
				modifier: tryConsume("MODIFIER") || "",
			});
			continue;
		}

		const value = char || tryConsume("ESCAPED_CHAR");
		if (value) {
			path += value;
			continue;
		}

		if (path) {
			result.push(path);
			path = "";
		}

		const open = tryConsume("OPEN");
		if (open) {
			const prefix = consumeText();
			const name = tryConsume("NAME") || "";
			const pattern = tryConsume("PATTERN") || "";
			const suffix = consumeText();

			mustConsume("CLOSE");

			result.push({
				name: name || (pattern ? key++ : ""),
				pattern: name && !pattern ? defaultPattern : pattern,
				prefix,
				suffix,
				modifier: tryConsume("MODIFIER") || "",
			});
			continue;
		}

		mustConsume("END");
	}

	return result;
}

interface TokensToFunctionOptions {
	/**
	 * When `true` the regexp will be case sensitive. (default: `false`)
	 */
	sensitive?: boolean;
	/**
	 * Function for encoding input strings for output.
	 */
	encode?: (value: string, token: Key) => string;
	/**
	 * When `false` the function can produce an invalid (unmatched) path. (default: `true`)
	 */
	validate?: boolean;
}

/**
 * Compile a string to a template function for the path.
 */
function compile<P extends object = object>(
	str: string,
	options?: ParseOptions & TokensToFunctionOptions
) {
	return tokensToFunction<P>(parse(str, options), options);
}

type PathFunction<P extends object = object> = (data?: P) => string;

/**
 * Expose a method for transforming tokens into the path function.
 */
function tokensToFunction<P extends object = object>(
	tokens: Token[],
	options: TokensToFunctionOptions = {}
): PathFunction<P> {
	const reFlags = flags(options);
	const { encode = (x: string) => x, validate = true } = options;

	// Compile all the tokens into regexps.
	const matches = tokens.map((token) => {
		if (typeof token === "object") {
			return new RegExp(`^(?:${token.pattern})$`, reFlags);
		}
	});

	return (data: Record<string, any> | null | undefined) => {
		let path = "";

		for (let i = 0; i < tokens.length; i++) {
			const token = tokens[i];

			if (typeof token === "string") {
				path += token;
				continue;
			}

			const value = data ? data[token.name] : undefined;
			const optional = token.modifier === "?" || token.modifier === "*";
			const repeat = token.modifier === "*" || token.modifier === "+";

			if (Array.isArray(value)) {
				if (!repeat) {
					throw new TypeError(
						`Expected "${token.name}" to not repeat, but got an array`
					);
				}

				if (value.length === 0) {
					if (optional) continue;

					throw new TypeError(`Expected "${token.name}" to not be empty`);
				}

				for (let j = 0; j < value.length; j++) {
					const segment = encode(value[j], token);

					if (validate && !(matches[i] as RegExp).test(segment)) {
						throw new TypeError(
							`Expected all "${token.name}" to match "${token.pattern}", but got "${segment}"`
						);
					}

					path += token.prefix + segment + token.suffix;
				}

				continue;
			}

			if (typeof value === "string" || typeof value === "number") {
				const segment = encode(String(value), token);

				if (validate && !(matches[i] as RegExp).test(segment)) {
					throw new TypeError(
						`Expected "${token.name}" to match "${token.pattern}", but got "${segment}"`
					);
				}

				path += token.prefix + segment + token.suffix;
				continue;
			}

			if (optional) continue;

			const typeOfMessage = repeat ? "an array" : "a string";
			throw new TypeError(`Expected "${token.name}" to be ${typeOfMessage}`);
		}

		return path;
	};
}

interface RegexpToFunctionOptions {
	/**
	 * Function for decoding strings for params.
	 */
	decode?: (value: string, token: Key) => string;
}

/**
 * A match result contains data about the path match.
 */
interface MatchResult<P extends object = object> {
	path: string;
	index: number;
	params: P;
}

/**
 * A match is either `false` (no match) or a match result.
 */
type Match<P extends object = object> = false | MatchResult<P>;

/**
 * The match function takes a string and returns whether it matched the path.
 */
type MatchFunction<P extends object = object> = (
	path: string
) => Match<P>;

/**
 * Create path match function from `path-to-regexp` spec.
 */
function match<P extends object = object>(
	str: Path,
	options?: ParseOptions & TokensToRegexpOptions & RegexpToFunctionOptions
):MatchFunction&{plain_route:boolean} {
	const keys: Key[] = [];
	const regexp = pathToRegexp(str, keys, options);
	const func = regexpToFunction<P>(regexp, keys, options);

	Object.defineProperty(func, 'plain_route', {
		configurable:false, writable:false, enumerable:false,
		value: !!regexp.is_plain
	});

	// @ts-ignore
	return func;
}

/**
 * Create a path match function from `path-to-regexp` output.
 */
function regexpToFunction<P extends object = object>(
	re: RegExp,
	keys: Key[],
	options: RegexpToFunctionOptions = {}
): MatchFunction<P> {
	const { decode = (x: string) => x } = options;

	return function(pathname: string) {
		const m = re.exec(pathname);
		if (!m) return false;

		const { 0: path, index } = m;
		const params = Object.create(null);

		for (let i = 1; i < m.length; i++) {
			if (m[i] === undefined) continue;

			const key = keys[i - 1];

			if (key.modifier === "*" || key.modifier === "+") {
				params[key.name] = m[i].split(key.prefix + key.suffix).map((value) => {
					return decode(value, key);
				});
			} else {
				params[key.name] = decode(m[i], key);
			}
		}

		return { path, index, params };
	};
}

/**
 * Escape a regular expression string.
 */
function escapeString(str: string) {
	return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}

/**
 * Get the flags for a regexp from the options.
 */
function flags(options?: { sensitive?: boolean }) {
	return options && options.sensitive ? "" : "i";
}

/**
 * Metadata about a key.
 */
interface Key {
	name: string | number;
	prefix: string;
	suffix: string;
	pattern: string;
	modifier: string;
}

/**
 * A token is a string (nothing special) or key metadata (capture group).
 */
type Token = string | Key;

/**
 * Pull out keys from a regexp.
 */
function regexpToRegexp(path: RegExp, keys?: Key[]): RegExp {
	if (!keys) return path;

	const groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;

	let index = 0;
	let execResult = groupsRegex.exec(path.source);
	while (execResult) {
		keys.push({
			// Use parenthesized substring match if available, index otherwise
			name: execResult[1] || index++,
			prefix: "",
			suffix: "",
			modifier: "",
			pattern: "",
		});
		execResult = groupsRegex.exec(path.source);
	}

	return path;
}

/**
 * Transform an array into a regexp.
 */
function arrayToRegexp(
	paths: Array<string | RegExp>,
	keys?: Key[],
	options?: TokensToRegexpOptions & ParseOptions
): RegExp {
	const parts = paths.map((path) => pathToRegexp(path, keys, options).source);
	return new RegExp(`(?:${parts.join("|")})`, flags(options));
}

/**
 * Create a path regexp from string input.
 */
function stringToRegexp(
	path: string,
	keys?: Key[],
	options?: TokensToRegexpOptions & ParseOptions
) {
	return tokensToRegexp(parse(path, options), keys, options);
}

interface TokensToRegexpOptions {
	/**
	 * When `true` the regexp will be case sensitive. (default: `false`)
	 */
	sensitive?: boolean;
	/**
	 * When `true` the regexp won't allow an optional trailing delimiter to match. (default: `false`)
	 */
	strict?: boolean;
	/**
	 * When `true` the regexp will match to the end of the string. (default: `true`)
	 */
	end?: boolean;
	/**
	 * When `true` the regexp will match from the beginning of the string. (default: `true`)
	 */
	start?: boolean;
	/**
	 * Sets the final character for non-ending optimistic matches. (default: `/`)
	 */
	delimiter?: string;
	/**
	 * List of characters that can also be "end" characters.
	 */
	endsWith?: string;
	/**
	 * Encode path tokens for use in the `RegExp`.
	 */
	encode?: (value: string) => string;
}

/**
 * Expose a function for taking tokens and returning a RegExp.
 */
function tokensToRegexp(
	tokens: Token[],
	keys?: Key[],
	options: TokensToRegexpOptions = {}
):RegExp&{is_plain:boolean} {
	const {
		strict = false,
		start = true,
		end = true,
		encode = (x: string) => x,
		delimiter = "/#?",
		endsWith = "",
	} = options;
	const endsWithRe = `[${escapeString(endsWith)}]|$`;
	const delimiterRe = `[${escapeString(delimiter)}]`;
	let route = start ? "^" : "";

	// Iterate over the tokens and create our regexp string.
	let is_plain:boolean = true;
	for (const token of tokens) {
		if (typeof token === "string") {
			is_plain = is_plain && true;

			route += escapeString(encode(token));
		} else {
			is_plain = is_plain && false;

			const prefix = escapeString(encode(token.prefix));
			const suffix = escapeString(encode(token.suffix));

			if (token.pattern) {
				if (keys) keys.push(token);

				if (prefix || suffix) {
					if (token.modifier === "+" || token.modifier === "*") {
						const mod = token.modifier === "*" ? "?" : "";
						route += `(?:${prefix}((?:${token.pattern})(?:${suffix}${prefix}(?:${token.pattern}))*)${suffix})${mod}`;
					} else {
						route += `(?:${prefix}(${token.pattern})${suffix})${token.modifier}`;
					}
				} else {
					if (token.modifier === "+" || token.modifier === "*") {
						route += `((?:${token.pattern})${token.modifier})`;
					} else {
						route += `(${token.pattern})${token.modifier}`;
					}
				}
			} else {
				route += `(?:${prefix}${suffix})${token.modifier}`;
			}
		}
	}

	if (end) {
		if (!strict) route += `${delimiterRe}?`;

		route += !options.endsWith ? "$" : `(?=${endsWithRe})`;
	} else {
		const endToken = tokens[tokens.length - 1];
		const isEndDelimited =
			typeof endToken === "string"
				? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1
				: endToken === undefined;

		if (!strict) {
			route += `(?:${delimiterRe}(?=${endsWithRe}))?`;
		}

		if (!isEndDelimited) {
			route += `(?=${delimiterRe}|${endsWithRe})`;
		}
	}

	return Object.assign(new RegExp(route, flags(options)), {is_plain});
}

/**
 * Supported `path-to-regexp` input types.
 */
type Path = string | RegExp | Array<string | RegExp>;

/**
 * Normalize the given path string, returning a regular expression.
 *
 * An empty array can be passed in for the keys, which will hold the
 * placeholder key descriptions. For example, using `/user/:id`, `keys` will
 * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
 */
function pathToRegexp(
	path: Path,
	keys?: Key[],
	options?: TokensToRegexpOptions & ParseOptions
):RegExp&{is_plain?:boolean;} {
	if (path instanceof RegExp) return regexpToRegexp(path, keys);
	if (Array.isArray(path)) return arrayToRegexp(path, keys, options);
	return stringToRegexp(path, keys, options);
}