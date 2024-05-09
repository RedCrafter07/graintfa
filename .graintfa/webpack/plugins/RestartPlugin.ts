import { ChildProcess, spawn } from 'child_process';
import path from 'path';
import { Compiler } from 'webpack';

class RestartPlugin {
	app!: ChildProcess | null;

	async apply(compiler: Compiler) {
		if (compiler.options.mode !== 'development')
			return console.log(
				'==== => RestartPlugin: Not in development mode, skipping... ====',
			);

		compiler.hooks.afterEmit.tapAsync('RestartPlugin', async (_, callback) => {
			await this.handleRestart();
			callback();
		});
	}

	async handleRestart() {
		if (this.app) {
			await new Promise<void>((resolve) => {
				if (!this.app) {
					return resolve();
				}

				this.app.once('exit', () => {
					this.app = null;
					resolve();
				});

				this.app.kill('SIGINT');
			});
		}

		this.startApp();
	}

	getElectronPath() {
		const nodeModulesPath = path.join(process.cwd(), 'node_modules');
		const electronPath = path.join(nodeModulesPath, 'electron', 'index.js');

		// import electron

		const electronExecutablePath = require(electronPath);

		return electronExecutablePath as string;
	}

	startApp() {
		const app = spawn(
			this.getElectronPath(),
			[path.join(process.cwd(), 'dist', 'main', 'index.js')],
			{
				windowsHide: false,
				stdio: [process.stdin, process.stdout, process.stderr, 'ipc'],
			},
		);

		if (app.stdin) process.stdin.pipe(app.stdin);
		app.stdout?.pipe(process.stdout);
		app.stderr?.pipe(process.stderr);

		app.once('exit', (c) => {
			this.app = null;
			console.log('App exited with code', c);
			console.log('Waiting for changes to restart...');
		});

		this.app = app;
	}
}

export default RestartPlugin;
