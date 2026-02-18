const eslintConfig = [
	{
		ignores: [".next/**", "prev_page.js"],
	},
	{
		files: ["**/*.{js,jsx,ts,tsx}"],
		languageOptions: {
			parserOptions: {
				ecmaVersion: 2020,
				sourceType: "module",
				ecmaFeatures: {
					jsx: true,
				},
			},
		},
	},
];

export default eslintConfig;
