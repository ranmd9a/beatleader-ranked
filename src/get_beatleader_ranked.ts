import * as Fs from 'fs';
import axios from 'axios';
import { IBeatLeaderMap, IMetadata } from './Models/BeatLeaderModels';

// -----------------------------------------------------------------------------
// BeatLeader からランク譜面の情報を取得する。
// sync URL を追加すべし。
// -----------------------------------------------------------------------------

async function sleep(time: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, time))
}

async function getLeaderboard() {
	let page = 1;
	// let page = 290;
	const maps = new Map<string, IBeatLeaderMap>();

	let lastRecord = false;
	while (!lastRecord) {

		// ranked で絞り込んでいるので Unranked は出てこない。
		const options = {
			url: `https://api.beatleader.xyz/leaderboards?page=${page}&type=ranked&stars_from=0&stars_to=15&sortBy=stars`,
			// method: 'GET',
			// json: true,
			timeout: 5000,
		};

		const res = await axios.get(options.url, options);
		if (res.status != 200) {
			throw new Error(res.statusText);
		}

		const body = res.data as { data: IBeatLeaderMap[], metadata: IMetadata };
		console.log(`total: ${body.metadata?.total}, page: ${body.metadata?.page}, itemsPerPage: ${body.metadata?.itemsPerPage}`);

		const songs = body.data;
		if (songs == null || songs.length === 0) {
			break;
		}

		for (const song of songs) {
			if (!song.difficulty.ranked) {
				// ranked が false でも Ranked 表示されているものがあるので警告メッセージだけ表示
				console.warn(`difficulty.ranked = false : ${song.song.id}: ${song.song.name}`);
				// continue;
			}
			if (maps.has(song.song.id)) {
				console.error(`Duplicate id: ${song.song.id}: ${song.song.name}`);
				continue;
			}
			song.song.hash = song.song.hash.toUpperCase(); // ハッシュ値を大文字に変換
			maps.set(song.id, song);
		}
		page++;
		await sleep(1000 + Math.random() * 500);
	}
	return maps;
}

async function doMain(): Promise<void> {
	const allSongList: IBeatLeaderMap[] = [];

	// api/leaderboards からランク譜面をすべて抽出
	const maps = await getLeaderboard();

	for (const map of maps) {
		allSongList.push(map[1]);
	}

	// 降順ソート
	allSongList.sort((a, b) => {
		if (a.difficulty.stars > b.difficulty.stars) {
			return -1;
		} else if (a.difficulty.stars < b.difficulty.stars) {
			return 1;
		}
		if (a.id > b.id) {
			return -1;
		} else if (a.id < b.id) {
			return 1;
		}
		return 0;
	});

	console.log(`map数：${allSongList.length}`);

	// const mom: moment.Moment = moment();
	if (!Fs.existsSync("tmp")) {
		Fs.mkdirSync("tmp");
	}
	Fs.writeFileSync(`tmp/AllSongs_tmp.json`,
		JSON.stringify(allSongList, null, 2), 'utf-8');
}

doMain()
	.then(() => {
		console.log("END");
	})
	.catch((error) => {
		console.log(error);
	});
