export type Event = {
  id: string;
  title: string;
  date: string;
  place: string;        // actual place, shown only to confirmed participants
  placePublic: string;  // public place (e.g. "渋谷エリア")
  capacity: number;
  detail: string;       // shown only to confirmed participants
  community: string;
  createdAt: string;
};

export type Participant = {
  id: string;
  eventId: string;
  name: string;
  year: string;         // 卒業年度・専攻
  job: string;          // 現職（任意）
  email: string;
  joinedAt: string;
};

export type ChatMessage = {
  id: string;
  eventId: string;
  senderName: string;
  body: string;
  sentAt: string;
};

// ---- Event ----

export function getEvent(id: string): Event | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`evently_event_${id}`);
    if (!raw) return null;
    return JSON.parse(raw) as Event;
  } catch {
    return null;
  }
}

export function saveEvent(event: Event): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`evently_event_${event.id}`, JSON.stringify(event));
  const ids = getAllEventIds();
  if (!ids.includes(event.id)) {
    ids.push(event.id);
    localStorage.setItem('evently_events_index', JSON.stringify(ids));
  }
}

// ---- Participants ----

export function getParticipants(eventId: string): Participant[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`evently_participants_${eventId}`);
    if (!raw) return [];
    return JSON.parse(raw) as Participant[];
  } catch {
    return [];
  }
}

export function saveParticipant(p: Participant): void {
  if (typeof window === 'undefined') return;
  const list = getParticipants(p.eventId);
  list.push(p);
  localStorage.setItem(`evently_participants_${p.eventId}`, JSON.stringify(list));
}

// ---- Chat ----

export function getChatMessages(eventId: string): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`evently_chat_${eventId}`);
    if (!raw) return [];
    return JSON.parse(raw) as ChatMessage[];
  } catch {
    return [];
  }
}

export function saveChatMessage(msg: ChatMessage): void {
  if (typeof window === 'undefined') return;
  const list = getChatMessages(msg.eventId);
  list.push(msg);
  localStorage.setItem(`evently_chat_${msg.eventId}`, JSON.stringify(list));
}

// ---- Index ----

export function getAllEventIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('evently_events_index');
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function deleteEvent(eventId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`evently_event_${eventId}`);
  localStorage.removeItem(`evently_participants_${eventId}`);
  localStorage.removeItem(`evently_chat_${eventId}`);
  const ids = getAllEventIds().filter((id) => id !== eventId);
  localStorage.setItem('evently_events_index', JSON.stringify(ids));
}

// ---- Demo Data ----

export function initDemoData(): void {
  if (typeof window === 'undefined') return;
  const existing = localStorage.getItem('evently_events_index');
  if (existing) return; // already initialized

  const demoEvent: Event = {
    id: 'mba2026spring',
    title: 'CBS 若手卒業生交流会2026',
    community: 'CBS卒業生会',
    date: '2026年4月15日（水）19:00〜21:00',
    place: '渋谷区道玄坂1-2-3 ビル5F',
    placePublic: '渋谷エリア',
    capacity: 20,
    detail: '📍 渋谷区道玄坂1-2-3 ビル5F ／ 💰 4,000円（当日精算）／ 🍺 平成でも飲みましょう',
    createdAt: new Date().toISOString(),
  };

  const demoParticipants: Participant[] = [
    {
      id: 'p1',
      eventId: 'mba2026spring',
      name: '田中 勇希',
      year: 'Class of 2020 / マーケティング',
      job: 'スタートアップ CMO',
      email: 'tanaka@example.com',
      joinedAt: new Date().toISOString(),
    },
    {
      id: 'p2',
      eventId: 'mba2026spring',
      name: '鈴木 健太',
      year: 'Class of 2019 / ファイナンス',
      job: '投資系PE ディレクター',
      email: 'suzuki@example.com',
      joinedAt: new Date().toISOString(),
    },
    {
      id: 'p3',
      eventId: 'mba2026spring',
      name: '佐藤 由美',
      year: 'Class of 2021 / アントレプレナーシップ',
      job: 'SaaS起業家',
      email: 'sato@example.com',
      joinedAt: new Date().toISOString(),
    },
    {
      id: 'p4',
      eventId: 'mba2026spring',
      name: '山本 拓海',
      year: 'Class of 2022 / ストラテジー',
      job: 'コンサルティングファーム マネージャー',
      email: 'yamamoto@example.com',
      joinedAt: new Date().toISOString(),
    },
    {
      id: 'p5',
      eventId: 'mba2026spring',
      name: '伊藤 さくら',
      year: 'Class of 2020 / ヘルスケア',
      job: '製薬会社 事業開発',
      email: 'ito@example.com',
      joinedAt: new Date().toISOString(),
    },
    {
      id: 'p6',
      eventId: 'mba2026spring',
      name: '渡辺 航',
      year: 'Class of 2023 / テクノロジー',
      job: 'メガベンチャー プロダクトマネージャー',
      email: 'watanabe@example.com',
      joinedAt: new Date().toISOString(),
    },
    {
      id: 'p7',
      eventId: 'mba2026spring',
      name: '中村 麻衣',
      year: 'Class of 2021 / マーケティング',
      job: '外資系消費財 ブランドマネージャー',
      email: 'nakamura@example.com',
      joinedAt: new Date().toISOString(),
    },
    {
      id: 'p8',
      eventId: 'mba2026spring',
      name: '小林 賢一',
      year: 'Class of 2019 / ファイナンス',
      job: '証券会社 M&Aアドバイザー',
      email: 'kobayashi@example.com',
      joinedAt: new Date().toISOString(),
    },
    {
      id: 'p9',
      eventId: 'mba2026spring',
      name: '加藤 千夏',
      year: 'Class of 2022 / リーダーシップ',
      job: 'NGO エグゼクティブディレクター',
      email: 'kato@example.com',
      joinedAt: new Date().toISOString(),
    },
    {
      id: 'p10',
      eventId: 'mba2026spring',
      name: '林 大輔',
      year: 'Class of 2023 / アントレプレナーシップ',
      job: 'フードテックスタートアップ CEO',
      email: 'hayashi@example.com',
      joinedAt: new Date().toISOString(),
    },
  ];

  const demoChat: ChatMessage[] = [
    {
      id: 'c1',
      eventId: 'mba2026spring',
      senderName: '田中 勇希',
      body: '楽しみにしています！飲み物希望の方はいますか？',
      sentAt: new Date().toISOString(),
    },
    {
      id: 'c2',
      eventId: 'mba2026spring',
      senderName: '鈴木 健太',
      body: '私も気になってます！幹事さんどちらですか？',
      sentAt: new Date().toISOString(),
    },
    {
      id: 'c3',
      eventId: 'mba2026spring',
      senderName: '幹事（山本）',
      body: '飲み物は任意ですが、あると便利かもしれません😊',
      sentAt: new Date().toISOString(),
    },
  ];

  saveEvent(demoEvent);
  localStorage.setItem(
    `evently_participants_${demoEvent.id}`,
    JSON.stringify(demoParticipants)
  );
  localStorage.setItem(
    `evently_chat_${demoEvent.id}`,
    JSON.stringify(demoChat)
  );
}
