export type TestAccount = {
  id: string
  name: string
  role: 'organizer' | 'participant'
  email: string
  graduation_year: number
  major: string
  company: string
  job_title: string
  bio: string
  avatar_color: string
}

export const TEST_ACCOUNTS: TestAccount[] = [
  // 幹事（2名）
  {
    id: 'test-organizer-1',
    name: '山本 幹事',
    role: 'organizer',
    email: 'organizer1@test.com',
    graduation_year: 2018,
    major: '経営戦略',
    company: '〇〇コンサルティング',
    job_title: 'シニアマネージャー',
    bio: 'イベント企画が得意です',
    avatar_color: '#E8F5E9',
  },
  {
    id: 'test-organizer-2',
    name: '佐々木 副幹事',
    role: 'organizer',
    email: 'organizer2@test.com',
    graduation_year: 2019,
    major: 'マーケティング',
    company: '〇〇広告代理店',
    job_title: 'マネージャー',
    bio: '一緒に盛り上げましょう！',
    avatar_color: '#E3F2FD',
  },
  // 参加者（10名）
  {
    id: 'test-participant-1',
    name: '田中 美咲',
    role: 'participant',
    email: 'p1@test.com',
    graduation_year: 2020,
    major: 'マーケティング',
    company: 'スタートアップ A',
    job_title: 'CMO',
    bio: 'マーケ・ブランド戦略が専門です',
    avatar_color: '#FCE4EC',
  },
  {
    id: 'test-participant-2',
    name: '鈴木 健太',
    role: 'participant',
    email: 'p2@test.com',
    graduation_year: 2019,
    major: 'ファイナンス',
    company: '外資系 PE ファンド',
    job_title: 'ディレクター',
    bio: 'M&A・投資案件を担当しています',
    avatar_color: '#FFF3E0',
  },
  {
    id: 'test-participant-3',
    name: '佐藤 由美',
    role: 'participant',
    email: 'p3@test.com',
    graduation_year: 2021,
    major: '起業家精神',
    company: '自社 (SaaS)',
    job_title: '代表取締役',
    bio: 'B2B SaaSを創業しました',
    avatar_color: '#F3E5F5',
  },
  {
    id: 'test-participant-4',
    name: '伊藤 大輔',
    role: 'participant',
    email: 'p4@test.com',
    graduation_year: 2018,
    major: 'オペレーション',
    company: '大手製造業',
    job_title: '事業部長',
    bio: 'サプライチェーン改革に取り組んでいます',
    avatar_color: '#E8F5E9',
  },
  {
    id: 'test-participant-5',
    name: '渡辺 さくら',
    role: 'participant',
    email: 'p5@test.com',
    graduation_year: 2022,
    major: 'イノベーション',
    company: '外資系テック企業',
    job_title: 'プロダクトマネージャー',
    bio: 'プロダクト開発・UXが得意です',
    avatar_color: '#E3F2FD',
  },
  {
    id: 'test-participant-6',
    name: '中村 隆',
    role: 'participant',
    email: 'p6@test.com',
    graduation_year: 2017,
    major: 'グローバルリーダーシップ',
    company: '総合商社',
    job_title: '部長',
    bio: 'アジア事業を統括しています',
    avatar_color: '#FFF9C4',
  },
  {
    id: 'test-participant-7',
    name: '小林 恵',
    role: 'participant',
    email: 'p7@test.com',
    graduation_year: 2020,
    major: 'ヘルスケア経営',
    company: '医療スタートアップ',
    job_title: 'COO',
    bio: 'ヘルステック領域で事業拡大中です',
    avatar_color: '#FCE4EC',
  },
  {
    id: 'test-participant-8',
    name: '加藤 誠',
    role: 'participant',
    email: 'p8@test.com',
    graduation_year: 2019,
    major: 'テクノロジー経営',
    company: 'VC ファンド',
    job_title: 'アソシエイト',
    bio: 'スタートアップ投資が専門です',
    avatar_color: '#F3E5F5',
  },
  {
    id: 'test-participant-9',
    name: '山田 花子',
    role: 'participant',
    email: 'p9@test.com',
    graduation_year: 2021,
    major: 'サステナビリティ',
    company: '外資系コンサル',
    job_title: 'コンサルタント',
    bio: 'ESG・サステナビリティ戦略を担当',
    avatar_color: '#E8F5E9',
  },
  {
    id: 'test-participant-10',
    name: '松本 拓也',
    role: 'participant',
    email: 'p10@test.com',
    graduation_year: 2018,
    major: 'アントレプレナーシップ',
    company: '自社 (EC)',
    job_title: '代表取締役',
    bio: 'EC事業を経営しています。M&A検討中',
    avatar_color: '#FFF3E0',
  },
]

export const TEST_ORGANIZERS = TEST_ACCOUNTS.filter((a) => a.role === 'organizer')
export const TEST_PARTICIPANTS = TEST_ACCOUNTS.filter((a) => a.role === 'participant')
