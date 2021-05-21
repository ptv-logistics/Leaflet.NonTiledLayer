import commonjs from '@rollup/plugin-commonjs';
import {nodeResolve} from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import {terser} from 'rollup-plugin-terser';

const outputConfig = {
	name: 'L.NonTiledLayer',
	format: 'umd',
	interop: false,
	globals: {
		leaflet: 'L'
	}
};

export default {
	external: ['leaflet'],
	input: 'src/NonTiledLayer.ts',
	plugins: [
		commonjs(),
		nodeResolve(),
		typescript()
	],
	output: [
		{
			...outputConfig,
			file: 'dist/NonTiledLayer-src.js'
		},
		{
			...outputConfig,
			file: 'dist/NonTiledLayer.js',
			sourcemap: true,
			plugins: [terser()]
		},
	]
};