export type TagV3 = {
  tagId: number;
  tagName: string;
  tagEnName: string;
};

export type RankVo = {
  rankType: number;
  hotCode: string;
  sort: number;
};

export type DramaItem = {
  bookId: string;
  bookName: string;
  coverWap: string;
  chapterCount: number;
  introduction: string;
  tags: string[];
  tagV3s: TagV3[];
  protagonist: string;
  rankVo: RankVo | null;
  shelfTime: string;
  inLibrary: boolean;
};

export type EpisodeVideoPath = {
  quality: number;
  videoPath: string;
  isDefault: number;
  isVipEquity: number;
};

export type EpisodeCdn = {
  cdnDomain: string;
  isDefault: number;
  videoPathList: EpisodeVideoPath[];
};

export type DramaEpisode = {
  chapterId: string;
  chapterIndex: number;
  isCharge: number;
  chapterName: string;
  cdnList: EpisodeCdn[];
  cover: string;
  duration: number;
};
