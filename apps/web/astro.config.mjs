// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
	integrations: [
		svelte(),
		tailwind({
			applyBaseStyles: true
		})
	],
	srcDir: './src',
	output: 'static',
	experimental: {
		clientPrerender: true
	},
	vite: {
		resolve: {
			alias: {
				'@content': new URL('../../packages/content', import.meta.url).pathname
			}
		}
	}
});
