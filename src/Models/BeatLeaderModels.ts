export interface IMetadata {
    itemsPerPage: number;
    page: number;
    total: number;
}

export interface IBeatLeaderMap {
    id: string;
    song: {
        id: string;
        hash: string;
        name: string;
        description: string;
        subName: string;
        author: string;
        mapper: string;
        mapperId: number;
        difficulties: any[];
    };

    difficulty: {
        id: number;
        value: number;
        mode: number;
        difficultyName: string;
        modeName: string;
        ranked: boolean;
        rankedTime: number;
        stars: number;
        type: number;
        njs: number;
        nps: number;
        notes: number;
        bombs: number;
        walls: number;
        maxScore: number;
    };
    plays: number;
}