import * as Fs from 'fs-extra';
import moment from 'moment';
import { IBeatLeaderMap } from './Models/BeatLeaderModels';

// -----------------------------------------------------------------------------
// get_beatleader_ranked.ts で作成した JSON をもとに
// 星別プレイリストを作成する。
// -----------------------------------------------------------------------------

const baseSyncUrl = `https://github.com/ranmd9a/beatleader-ranked/releases/download/latest`;

async function sleep(time: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, time))
}

const mom: moment.Moment = moment();

function createPlaylist(title: string, songData: any[], description?: string, imageFile?: string) {
	songData.sort((a, b) => {
		if (a.uid < b.uid) {
			return -1;
		}
		else if (a.uid > b.uid) {
			return 1;
		}
		return 0;
	});

	const template: any = Fs.readJsonSync('data/playlist_template.json');
	template.playlistTitle = title;
	if (description != null) {
		template.playlistDescription = description;
	}
	template.songs = songData;
	if (imageFile != null) {
		const data: string = Fs.readFileSync(`images/${imageFile}`, 'base64');
		template.image = `data:image/png;base64,${data}`;
	}
	const playlistName = `beatleader_${title.toLowerCase().replace(/-/g, '_')}.json`;
	template.customData = {
		syncURL: `${baseSyncUrl}/${playlistName}`,
	};
	Fs.writeJSONSync(`result/${playlistName}`, template, { spaces: '\t' });
	console.log(`${playlistName}: ${songData.length}maps`);
}

function addToMap(songMap: Map<string, any>, song: IBeatLeaderMap) {
	const hash = song.song.hash;
	const a = songMap.get(hash);
	if (a == null) {
		songMap.set(hash, {
			songName: song.song.name,
			hash,
			difficulties: [
				{
					"characteristic": song.difficulty.modeName,
					"name": song.difficulty.difficultyName,
					"stars": song.difficulty.stars,
				}
			]
		})
	} else {
		a.difficulties.push({
			"characteristic": song.difficulty.modeName,
			"name": song.difficulty.difficultyName,
			"stars": song.difficulty.stars,
		})
	}
}

function mapToArray(songMap: Map<string, any>) {
	return Array.from(songMap.values());
}

async function main() {
	const fileName = 'tmp/AllSongs_tmp.json';
	const rankedMaps: IBeatLeaderMap[] = Fs.readJsonSync(fileName);

    if (!Fs.existsSync("result")) {
        Fs.mkdirSync("result");
    }

    const songMapMap = new Map<number, Map<string, any>>();
	for (const rankedMap of rankedMaps) {
		const key = Math.floor(rankedMap.difficulty.stars); // 切り捨て
		let songMap = songMapMap.get(key);
		if (songMap == null) {
			songMap = new Map();
			songMapMap.set(key, songMap);
		}
		addToMap(songMap, rankedMap);
	}

	for (const entry of songMapMap) {
		const key = entry[0];
		const keyText = `0${key}`.slice(-2);
		createPlaylist(`Ranked_${keyText}`, mapToArray(entry[1]), `star ${key}`, `6338_300x300-${key}.png`);
		await sleep(1000);
	}
}


main()
	.then(() => {
		console.log('END');
	})
	.catch((error: any) => {
		console.log(error);
	});

