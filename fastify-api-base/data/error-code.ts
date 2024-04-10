export const ErrorCode = Object.freeze({
	RES_NOT_FOUND: 'error#resource-not-found',
	UNAUTHORIZED: 'error#unauthorized-access',
	FORBIDDEN: 'error#forbidden-access',
	INCORREECT_FORMAT: 'error#incorrect-format',
} as const);