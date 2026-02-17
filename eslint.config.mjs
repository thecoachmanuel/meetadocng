import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
	baseDirectory: __dirname,
});

const eslintConfig = [
	{
		ignores: [".next/**", "prev_page.js"],
	},
	...compat.config({ extends: ["next/core-web-vitals"] }),
	{
		rules: {
			"react-hooks/set-state-in-effect": "off",
			"react-hooks/error-boundaries": "off",
			"react/no-unescaped-entities": "off",
		},
	},
];

export default eslintConfig;
