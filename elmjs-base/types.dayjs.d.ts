declare global {
	declare function dayjs(date?: dayjs.ConfigType): dayjs.Dayjs
	declare function dayjs(date?: dayjs.ConfigType, format?: dayjs.OptionType, strict?: boolean): dayjs.Dayjs
	declare function dayjs(date?: dayjs.ConfigType, format?: dayjs.OptionType, locale?: string, strict?: boolean): dayjs.Dayjs

	declare namespace dayjs {
		interface ConfigTypeMap {
			default: string | number | Date | Dayjs | null | undefined
		}

		type ConfigType = ConfigTypeMap[keyof ConfigTypeMap]
		interface FormatObject { locale?: string, format?: string, utc?: boolean }
		type OptionType = FormatObject | string | string[]
		type UnitTypeShort = 'd' | 'D' | 'M' | 'y' | 'h' | 'm' | 's' | 'ms'
		type UnitTypeLong = 'millisecond' | 'second' | 'minute' | 'hour' | 'day' | 'month' | 'year' | 'date'
		type UnitTypeLongPlural = 'milliseconds' | 'seconds' | 'minutes' | 'hours' | 'days' | 'months' | 'years' | 'dates'
		type UnitType = UnitTypeLong | UnitTypeLongPlural | UnitTypeShort;
		type OpUnitType = UnitType | "week" | "weeks" | 'w';
		type QUnitType = UnitType | "quarter" | "quarters" | 'Q';
		type ManipulateType = Exclude<OpUnitType, 'date' | 'dates'>;

		class Dayjs {
			constructor(config?: ConfigType)
			clone(): Dayjs
			isValid(): boolean
			year(): number
			year(value: number): Dayjs
			month(): number
			month(value: number): Dayjs
			date(): number
			date(value: number): Dayjs
			day(): number
			day(value: number): Dayjs
			hour(): number
			hour(value: number): Dayjs
			minute(): number
			minute(value: number): Dayjs
			second(): number
			second(value: number): Dayjs
			millisecond(): number
			millisecond(value: number): Dayjs
			set(unit: UnitType, value: number): Dayjs
			get(unit: UnitType): number
			add(value: number, unit?: ManipulateType): Dayjs
			subtract(value: number, unit?: ManipulateType): Dayjs
			startOf(unit: OpUnitType): Dayjs
			endOf(unit: OpUnitType): Dayjs
			format(template?: string): string
			diff(date?: ConfigType, unit?: QUnitType | OpUnitType, float?: boolean): number
			valueOf(): number
			unix(): number
			daysInMonth(): number
			toDate(): Date
			toJSON(): string
			toISOString(): string
			toString(): string
			utcOffset(): number
			isBefore(date?: ConfigType, unit?: OpUnitType): boolean
			isSame(date?: ConfigType, unit?: OpUnitType): boolean
			isAfter(date?: ConfigType, unit?: OpUnitType): boolean
			locale(): string
			locale(preset: string | ILocale, object?: Partial<ILocale>): Dayjs
		}

		type PluginFunc<T = unknown> = (option: T, c: typeof Dayjs, d: typeof dayjs) => void
		function extend<T = unknown>(plugin: PluginFunc<T>, option?: T): Dayjs
		function locale(preset?: string | ILocale, object?: Partial<ILocale>, isLocal?: boolean): string
		function isDayjs(d: any): d is Dayjs
		function unix(t: number): Dayjs

		const Ls: { [key: string]: ILocale }
	}
}

export {};