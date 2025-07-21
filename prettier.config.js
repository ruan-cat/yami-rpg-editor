// @ts-check
/** @type {import("prettier").Config} */
const config = {
	plugins: ['@prettier/plugin-oxc'],
	bracketSpacing: true,
	endOfLine: 'lf',
	semi: false,
	tabWidth: 4,
	trailingComma: 'none',
	singleQuote: true,
	useTabs: true,
	vueIndentScriptAndStyle: true
}

export default config
