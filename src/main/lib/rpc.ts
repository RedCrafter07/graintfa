import RPC from 'discord-rpc';

const logoURL = 'https://cloud.redcrafter07.de/s/ekZs84kooitj9Sy/preview';

let currentRPC: RPC.Presence = {
	largeImageKey: logoURL,
	largeImageText: 'Graintfa',
};

const client = new RPC.Client({ transport: 'ipc' });

client.on('ready', () => {
	client.setActivity(currentRPC);

	setInterval(() => {
		client.setActivity(currentRPC);
	}, 15000);
});

// Log in to RPC with client id
client
	.login({
		clientId: '982678926855897118',
	})
	.catch(console.error);

export async function setRPC(data: RPC.Presence) {
	currentRPC = data;
}

export async function setFilePath(file: string) {
	currentRPC = {
		largeImageKey: logoURL,
		state: `Editing ${file.split('\\').pop()}`,
		startTimestamp: Date.now(),
	};
}

export async function setUnknown() {
	currentRPC = {
		largeImageKey: logoURL,
		state: 'Editing an unknown project',
		startTimestamp: Date.now(),
	};
}

export async function setState(name: string) {
	currentRPC = {
		largeImageKey: logoURL,
		state: name,
	};
}
