import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import { PrismaClient } from "../generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env first.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "admin1234";
const USER_EMAIL = "user@example.com";
const USER_PASSWORD = "user1234";

type SeedWord = {
  text: string;
  jlpt: number;
  readings: { kana: string; isPrimary: boolean }[];
  senses: {
    partOfSpeech: string[];
    position: number;
    glosses: { lang: string; text: string }[];
  }[];
};

const WORDS: SeedWord[] = [
  {
    text: "日本",
    jlpt: 5,
    readings: [
      { kana: "にほん", isPrimary: true },
      { kana: "にっぽん", isPrimary: false },
    ],
    senses: [
      {
        partOfSpeech: ["n"],
        position: 1,
        glosses: [{ lang: "en", text: "Japan" }],
      },
    ],
  },
  {
    text: "日本語",
    jlpt: 5,
    readings: [{ kana: "にほんご", isPrimary: true }],
    senses: [
      {
        partOfSpeech: ["n"],
        position: 1,
        glosses: [{ lang: "en", text: "Japanese language" }],
      },
    ],
  },
  {
    text: "学生",
    jlpt: 5,
    readings: [{ kana: "がくせい", isPrimary: true }],
    senses: [
      {
        partOfSpeech: ["n"],
        position: 1,
        glosses: [{ lang: "en", text: "student" }],
      },
    ],
  },
  {
    text: "先生",
    jlpt: 5,
    readings: [{ kana: "せんせい", isPrimary: true }],
    senses: [
      {
        partOfSpeech: ["n"],
        position: 1,
        glosses: [
          { lang: "en", text: "teacher" },
          { lang: "en", text: "doctor" },
        ],
      },
    ],
  },
  {
    text: "学校",
    jlpt: 5,
    readings: [{ kana: "がっこう", isPrimary: true }],
    senses: [
      {
        partOfSpeech: ["n"],
        position: 1,
        glosses: [{ lang: "en", text: "school" }],
      },
    ],
  },
  {
    text: "食べる",
    jlpt: 5,
    readings: [{ kana: "たべる", isPrimary: true }],
    senses: [
      {
        partOfSpeech: ["v1", "vt"],
        position: 1,
        glosses: [{ lang: "en", text: "to eat" }],
      },
    ],
  },
  {
    text: "飲む",
    jlpt: 5,
    readings: [{ kana: "のむ", isPrimary: true }],
    senses: [
      {
        partOfSpeech: ["v5m", "vt"],
        position: 1,
        glosses: [
          { lang: "en", text: "to drink" },
          { lang: "en", text: "to swallow" },
        ],
      },
    ],
  },
  {
    text: "見る",
    jlpt: 5,
    readings: [{ kana: "みる", isPrimary: true }],
    senses: [
      {
        partOfSpeech: ["v1", "vt"],
        position: 1,
        glosses: [
          { lang: "en", text: "to see" },
          { lang: "en", text: "to look at" },
          { lang: "en", text: "to watch" },
        ],
      },
    ],
  },
  {
    text: "行く",
    jlpt: 5,
    readings: [{ kana: "いく", isPrimary: true }],
    senses: [
      {
        partOfSpeech: ["v5k-s", "vi"],
        position: 1,
        glosses: [{ lang: "en", text: "to go" }],
      },
    ],
  },
  {
    text: "来る",
    jlpt: 5,
    readings: [{ kana: "くる", isPrimary: true }],
    senses: [
      {
        partOfSpeech: ["vk", "vi"],
        position: 1,
        glosses: [{ lang: "en", text: "to come" }],
      },
    ],
  },
  {
    text: "水",
    jlpt: 5,
    readings: [{ kana: "みず", isPrimary: true }],
    senses: [
      {
        partOfSpeech: ["n"],
        position: 1,
        glosses: [{ lang: "en", text: "water" }],
      },
    ],
  },
  {
    text: "本",
    jlpt: 5,
    readings: [{ kana: "ほん", isPrimary: true }],
    senses: [
      {
        partOfSpeech: ["n"],
        position: 1,
        glosses: [{ lang: "en", text: "book" }],
      },
      {
        partOfSpeech: ["n"],
        position: 2,
        glosses: [{ lang: "en", text: "counter for long objects" }],
      },
    ],
  },
  {
    text: "猫",
    jlpt: 5,
    readings: [{ kana: "ねこ", isPrimary: true }],
    senses: [
      {
        partOfSpeech: ["n"],
        position: 1,
        glosses: [{ lang: "en", text: "cat" }],
      },
    ],
  },
  {
    text: "犬",
    jlpt: 5,
    readings: [{ kana: "いぬ", isPrimary: true }],
    senses: [
      {
        partOfSpeech: ["n"],
        position: 1,
        glosses: [{ lang: "en", text: "dog" }],
      },
    ],
  },
  {
    text: "大きい",
    jlpt: 5,
    readings: [{ kana: "おおきい", isPrimary: true }],
    senses: [
      {
        partOfSpeech: ["adj-i"],
        position: 1,
        glosses: [
          { lang: "en", text: "big" },
          { lang: "en", text: "large" },
        ],
      },
    ],
  },
  {
    text: "小さい",
    jlpt: 5,
    readings: [{ kana: "ちいさい", isPrimary: true }],
    senses: [
      {
        partOfSpeech: ["adj-i"],
        position: 1,
        glosses: [
          { lang: "en", text: "small" },
          { lang: "en", text: "little" },
        ],
      },
    ],
  },
  {
    text: "新しい",
    jlpt: 5,
    readings: [{ kana: "あたらしい", isPrimary: true }],
    senses: [
      {
        partOfSpeech: ["adj-i"],
        position: 1,
        glosses: [{ lang: "en", text: "new" }],
      },
    ],
  },
  {
    text: "古い",
    jlpt: 5,
    readings: [{ kana: "ふるい", isPrimary: true }],
    senses: [
      {
        partOfSpeech: ["adj-i"],
        position: 1,
        glosses: [{ lang: "en", text: "old" }],
      },
    ],
  },
  {
    text: "山",
    jlpt: 4,
    readings: [{ kana: "やま", isPrimary: true }],
    senses: [
      {
        partOfSpeech: ["n"],
        position: 1,
        glosses: [{ lang: "en", text: "mountain" }],
      },
    ],
  },
  {
    text: "川",
    jlpt: 4,
    readings: [{ kana: "かわ", isPrimary: true }],
    senses: [
      {
        partOfSpeech: ["n"],
        position: 1,
        glosses: [{ lang: "en", text: "river" }],
      },
    ],
  },
];

function japaneseWord(
  text: string,
  jlpt: number,
  kana: string,
  partOfSpeech: string[],
  meaning: string,
): SeedWord {
  return {
    text,
    jlpt,
    readings: [{ kana, isPrimary: true }],
    senses: [
      {
        partOfSpeech,
        position: 1,
        glosses: [{ lang: "vi", text: meaning }],
      },
    ],
  };
}

const DAILY_VOCABULARY: SeedWord[] = [
  japaneseWord(
    "おはよう",
    5,
    "おはよう",
    ["exp"],
    "Chào buổi sáng (thân mật).",
  ),
  japaneseWord(
    "こんにちは",
    5,
    "こんにちは",
    ["exp"],
    "Xin chào; chào buổi chiều.",
  ),
  japaneseWord("こんばんは", 5, "こんばんは", ["exp"], "Chào buổi tối."),
  japaneseWord("さようなら", 5, "さようなら", ["exp"], "Tạm biệt."),
  japaneseWord("ありがとう", 5, "ありがとう", ["exp"], "Cảm ơn."),
  japaneseWord(
    "すみません",
    5,
    "すみません",
    ["exp"],
    "Xin lỗi; làm phiền; cảm ơn (lịch sự).",
  ),
  japaneseWord("はい", 5, "はい", ["int"], "Vâng; có."),
  japaneseWord("いいえ", 5, "いいえ", ["int"], "Không."),
  japaneseWord("家族", 5, "かぞく", ["n"], "Gia đình."),
  japaneseWord("父", 5, "ちち", ["n"], "Bố, cha (của mình)."),
  japaneseWord("母", 5, "はは", ["n"], "Mẹ (của mình)."),
  japaneseWord("兄", 5, "あに", ["n"], "Anh trai (của mình)."),
  japaneseWord("姉", 5, "あね", ["n"], "Chị gái (của mình)."),
  japaneseWord("弟", 5, "おとうと", ["n"], "Em trai."),
  japaneseWord("妹", 5, "いもうと", ["n"], "Em gái."),
  japaneseWord("友達", 5, "ともだち", ["n"], "Bạn bè; bạn."),
  japaneseWord("男", 5, "おとこ", ["n"], "Đàn ông; nam giới."),
  japaneseWord("女", 5, "おんな", ["n"], "Phụ nữ; nữ giới."),
  japaneseWord("子供", 5, "こども", ["n"], "Trẻ em; con cái."),
  japaneseWord("ご飯", 5, "ごはん", ["n"], "Cơm; bữa ăn."),
  japaneseWord("朝ご飯", 5, "あさごはん", ["n"], "Bữa sáng."),
  japaneseWord("昼ご飯", 5, "ひるごはん", ["n"], "Bữa trưa."),
  japaneseWord("晩ご飯", 5, "ばんごはん", ["n"], "Bữa tối."),
  japaneseWord("肉", 5, "にく", ["n"], "Thịt."),
  japaneseWord("魚", 5, "さかな", ["n"], "Cá."),
  japaneseWord("野菜", 5, "やさい", ["n"], "Rau."),
  japaneseWord("果物", 5, "くだもの", ["n"], "Trái cây."),
  japaneseWord("店", 5, "みせ", ["n"], "Cửa hàng; quán."),
  japaneseWord("お金", 5, "おかね", ["n"], "Tiền."),
  japaneseWord("円", 5, "えん", ["n"], "Yên Nhật."),
  japaneseWord("買う", 5, "かう", ["v5u", "vt"], "Mua."),
  japaneseWord("売る", 5, "うる", ["v5r", "vt"], "Bán."),
  japaneseWord("会社", 5, "かいしゃ", ["n"], "Công ty."),
  japaneseWord("仕事", 5, "しごと", ["n"], "Công việc."),
  japaneseWord("駅", 5, "えき", ["n"], "Nhà ga."),
  japaneseWord("電車", 5, "でんしゃ", ["n"], "Tàu điện."),
  japaneseWord("バス", 5, "バス", ["n"], "Xe buýt."),
  japaneseWord("車", 5, "くるま", ["n"], "Ô tô; xe hơi."),
  japaneseWord("自転車", 5, "じてんしゃ", ["n"], "Xe đạp."),
  japaneseWord("今日", 5, "きょう", ["n", "adv"], "Hôm nay."),
  japaneseWord("明日", 5, "あした", ["n", "adv"], "Ngày mai."),
  japaneseWord("昨日", 5, "きのう", ["n", "adv"], "Hôm qua."),
  japaneseWord("今", 5, "いま", ["n", "adv"], "Bây giờ; hiện tại."),
  japaneseWord("時間", 5, "じかん", ["n"], "Thời gian; tiếng đồng hồ."),
  japaneseWord("毎日", 5, "まいにち", ["n", "adv"], "Mỗi ngày; hằng ngày."),
  japaneseWord("起きる", 5, "おきる", ["v1", "vi"], "Thức dậy."),
  japaneseWord("寝る", 5, "ねる", ["v1", "vi"], "Ngủ; đi ngủ."),
  japaneseWord("帰る", 5, "かえる", ["v5r", "vi"], "Trở về; về nhà."),
  japaneseWord("朝", 5, "あさ", ["n"], "Buổi sáng."),
  japaneseWord("夜", 5, "よる", ["n"], "Buổi tối; ban đêm."),
  japaneseWord("家賃", 4, "やちん", ["n"], "Tiền thuê nhà."),
  japaneseWord("住所", 4, "じゅうしょ", ["n"], "Địa chỉ."),
  japaneseWord("連絡", 4, "れんらく", ["n", "vs"], "Liên lạc; thông báo."),
  japaneseWord("予約", 4, "よやく", ["n", "vs"], "Đặt trước; đặt chỗ."),
  japaneseWord("注文", 4, "ちゅうもん", ["n", "vs"], "Gọi món; đặt hàng."),
  japaneseWord("値段", 4, "ねだん", ["n"], "Giá cả."),
  japaneseWord("お釣り", 4, "おつり", ["n"], "Tiền thừa; tiền trả lại."),
  japaneseWord("財布", 4, "さいふ", ["n"], "Ví tiền."),
  japaneseWord("銀行", 4, "ぎんこう", ["n"], "Ngân hàng."),
  japaneseWord("旅行", 4, "りょこう", ["n", "vs"], "Du lịch; chuyến đi."),
  japaneseWord(
    "乗り換える",
    4,
    "のりかえる",
    ["v1"],
    "Chuyển tàu; đổi phương tiện.",
  ),
  japaneseWord("運転", 4, "うんてん", ["n", "vs"], "Lái xe; vận hành."),
  japaneseWord("道", 4, "みち", ["n"], "Con đường; lối đi."),
  japaneseWord("交差点", 4, "こうさてん", ["n"], "Ngã tư; giao lộ."),
  japaneseWord("信号", 4, "しんごう", ["n"], "Đèn tín hiệu giao thông."),
  japaneseWord("港", 4, "みなと", ["n"], "Cảng; bến cảng."),
  japaneseWord("旅館", 4, "りょかん", ["n"], "Nhà trọ kiểu Nhật."),
  japaneseWord("会社員", 4, "かいしゃいん", ["n"], "Nhân viên công ty."),
  japaneseWord("会議", 4, "かいぎ", ["n", "vs"], "Cuộc họp; hội nghị."),
  japaneseWord("休憩", 4, "きゅうけい", ["n", "vs"], "Nghỉ giải lao."),
  japaneseWord("残業", 4, "ざんぎょう", ["n", "vs"], "Làm thêm giờ."),
  japaneseWord("受付", 4, "うけつけ", ["n"], "Quầy tiếp tân; tiếp nhận."),
  japaneseWord("予定", 4, "よてい", ["n", "vs"], "Dự định; kế hoạch."),
  japaneseWord("用事", 4, "ようじ", ["n"], "Việc cần làm; công chuyện."),
  japaneseWord("遅刻", 4, "ちこく", ["n", "vs"], "Đến muộn; trễ giờ."),
  japaneseWord("間に合う", 4, "まにあう", ["v5u", "vi"], "Kịp giờ; kịp."),
  japaneseWord("準備", 4, "じゅんび", ["n", "vs"], "Chuẩn bị."),
  japaneseWord("続ける", 4, "つづける", ["v1", "vt"], "Tiếp tục; duy trì."),
  japaneseWord("決める", 4, "きめる", ["v1", "vt"], "Quyết định; định ra."),
  japaneseWord("説明する", 4, "せつめいする", ["vs"], "Giải thích."),
  japaneseWord("練習する", 4, "れんしゅうする", ["vs"], "Luyện tập."),
  japaneseWord("心配する", 4, "しんぱいする", ["vs"], "Lo lắng."),
  japaneseWord("病気", 4, "びょうき", ["n"], "Bệnh; ốm."),
  japaneseWord("熱", 4, "ねつ", ["n"], "Sốt; nhiệt."),
  japaneseWord("咳", 4, "せき", ["n"], "Ho; cơn ho."),
  japaneseWord("薬", 4, "くすり", ["n"], "Thuốc."),
  japaneseWord("痛い", 4, "いたい", ["adj-i"], "Đau; nhức."),
  japaneseWord("気分", 4, "きぶん", ["n"], "Tâm trạng; cảm giác."),
  japaneseWord("安心する", 4, "あんしんする", ["vs"], "Yên tâm; an lòng."),
  japaneseWord("文化", 4, "ぶんか", ["n"], "Văn hóa."),
  japaneseWord("習慣", 4, "しゅうかん", ["n"], "Thói quen; tập quán."),
  japaneseWord("季節", 4, "きせつ", ["n"], "Mùa; mùa trong năm."),
  japaneseWord("祭り", 4, "まつり", ["n"], "Lễ hội."),
  japaneseWord("洗濯する", 4, "せんたくする", ["vs"], "Giặt giũ."),
  japaneseWord("掃除する", 4, "そうじする", ["vs"], "Dọn dẹp; lau chùi."),
  japaneseWord("散歩する", 4, "さんぽする", ["vs"], "Đi dạo."),
  japaneseWord(
    "片付ける",
    4,
    "かたづける",
    ["v1", "vt"],
    "Dọn dẹp; sắp xếp gọn.",
  ),
  japaneseWord("選ぶ", 4, "えらぶ", ["v5b", "vt"], "Chọn; lựa chọn."),
  japaneseWord("呼ぶ", 4, "よぶ", ["v5b", "vt"], "Gọi; mời."),
  japaneseWord("払う", 4, "はらう", ["v5u", "vt"], "Trả tiền; thanh toán."),
];

type SeedKanji = {
  character: string;
  strokeCount: number;
  radical: string;
  jlpt: number;
};

const KANJI: SeedKanji[] = [
  { character: "日", strokeCount: 4, radical: "日", jlpt: 5 },
  { character: "月", strokeCount: 4, radical: "月", jlpt: 5 },
  { character: "火", strokeCount: 4, radical: "火", jlpt: 5 },
  { character: "水", strokeCount: 4, radical: "水", jlpt: 5 },
  { character: "木", strokeCount: 4, radical: "木", jlpt: 5 },
  { character: "金", strokeCount: 8, radical: "金", jlpt: 5 },
  { character: "土", strokeCount: 3, radical: "土", jlpt: 5 },
  { character: "山", strokeCount: 3, radical: "山", jlpt: 5 },
  { character: "川", strokeCount: 3, radical: "川", jlpt: 5 },
  { character: "人", strokeCount: 2, radical: "人", jlpt: 5 },
  { character: "口", strokeCount: 3, radical: "口", jlpt: 5 },
  { character: "大", strokeCount: 3, radical: "大", jlpt: 5 },
  { character: "小", strokeCount: 3, radical: "小", jlpt: 5 },
  { character: "中", strokeCount: 4, radical: "丨", jlpt: 5 },
  { character: "上", strokeCount: 3, radical: "一", jlpt: 5 },
  { character: "下", strokeCount: 3, radical: "一", jlpt: 5 },
  { character: "年", strokeCount: 6, radical: "干", jlpt: 5 },
  { character: "本", strokeCount: 5, radical: "木", jlpt: 5 },
  { character: "学", strokeCount: 8, radical: "子", jlpt: 5 },
  { character: "生", strokeCount: 5, radical: "生", jlpt: 5 },
  { character: "先", strokeCount: 6, radical: "儿", jlpt: 5 },
  { character: "東", strokeCount: 8, radical: "木", jlpt: 5 },
  { character: "西", strokeCount: 6, radical: "襾", jlpt: 5 },
  { character: "南", strokeCount: 9, radical: "十", jlpt: 5 },
  { character: "北", strokeCount: 5, radical: "匕", jlpt: 5 },
  { character: "社", strokeCount: 7, radical: "示", jlpt: 4 },
  { character: "会", strokeCount: 6, radical: "人", jlpt: 4 },
];

type SeedGrammar = {
  title: string;
  pattern: string;
  meaning: string;
  jlpt: number;
};

const GRAMMARS: SeedGrammar[] = [
  {
    title: "Câu khẳng định cơ bản",
    pattern: "〜は〜です",
    meaning: "A là B",
    jlpt: 5,
  },
  {
    title: "Câu phủ định danh từ",
    pattern: "〜は〜ではありません",
    meaning: "A không phải là B",
    jlpt: 5,
  },
  {
    title: "Câu hỏi",
    pattern: "〜か",
    meaning: "Trợ từ cuối câu để tạo câu hỏi",
    jlpt: 5,
  },
  {
    title: "Sở hữu, bổ nghĩa danh từ",
    pattern: "〜の〜",
    meaning: "B của A; A bổ nghĩa cho B",
    jlpt: 5,
  },
  {
    title: "Tồn tại (vật)",
    pattern: "〜があります",
    meaning: "Có (đồ vật, sự việc)",
    jlpt: 5,
  },
  {
    title: "Tồn tại (người, động vật)",
    pattern: "〜がいます",
    meaning: "Có (người, động vật)",
    jlpt: 5,
  },
  {
    title: "Diễn tả mong muốn",
    pattern: "〜たいです",
    meaning: "Muốn làm gì đó",
    jlpt: 5,
  },
  {
    title: "Mời rủ",
    pattern: "〜ましょう",
    meaning: "Cùng làm ~ nào",
    jlpt: 5,
  },
  {
    title: "Mời rủ lịch sự",
    pattern: "〜ませんか",
    meaning: "Anh/chị có muốn cùng làm ~ không?",
    jlpt: 5,
  },
  {
    title: "Nhờ vả, yêu cầu",
    pattern: "〜てください",
    meaning: "Hãy làm ~ (cho tôi)",
    jlpt: 5,
  },
  {
    title: "Hành động đang diễn ra",
    pattern: "〜ています",
    meaning: "Đang làm ~; trạng thái kéo dài",
    jlpt: 5,
  },
  {
    title: "Thứ tự hành động",
    pattern: "〜てから",
    meaning: "Sau khi làm ~ thì ...",
    jlpt: 5,
  },
  {
    title: "Đưa ra lý do",
    pattern: "〜から",
    meaning: "Vì ~ nên ...",
    jlpt: 5,
  },
  {
    title: "So sánh hơn",
    pattern: "〜より〜のほうが",
    meaning: "B ~ hơn A",
    jlpt: 5,
  },
  {
    title: "Xin phép, cho phép",
    pattern: "〜てもいいです",
    meaning: "Làm ~ cũng được",
    jlpt: 4,
  },
  {
    title: "Cấm đoán",
    pattern: "〜てはいけません",
    meaning: "Không được làm ~",
    jlpt: 4,
  },
  {
    title: "Nghĩa vụ",
    pattern: "〜なければなりません",
    meaning: "Phải làm ~",
    jlpt: 4,
  },
  {
    title: "Kinh nghiệm",
    pattern: "〜たことがあります",
    meaning: "Đã từng làm ~",
    jlpt: 4,
  },
  {
    title: "Khả năng",
    pattern: "〜ことができます",
    meaning: "Có thể làm ~",
    jlpt: 4,
  },
  {
    title: "Lời khuyên",
    pattern: "〜たほうがいいです",
    meaning: "Nên làm ~ thì hơn",
    jlpt: 4,
  },
];

async function seedUsers(): Promise<void> {
  const adminHash = await hash(ADMIN_PASSWORD, 10);
  const userHash = await hash(USER_PASSWORD, 10);

  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      role: "ADMIN",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
    create: {
      email: ADMIN_EMAIL,
      passwordHash: adminHash,
      displayName: "Admin",
      role: "ADMIN",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.user.upsert({
    where: { email: USER_EMAIL },
    update: {},
    create: {
      email: USER_EMAIL,
      passwordHash: userHash,
      displayName: "Test User",
      role: "USER",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });
}

async function seedWords(): Promise<void> {
  const additionalWords = new Set(DAILY_VOCABULARY.map((word) => word.text));
  const addedByJlpt: Record<number, number> = { 4: 0, 5: 0 };
  let added = 0;
  let skipped = 0;

  for (const w of [...WORDS, ...DAILY_VOCABULARY]) {
    const existing = await prisma.word.findFirst({ where: { text: w.text } });
    if (existing) {
      if (additionalWords.has(w.text)) skipped += 1;
      continue;
    }

    await prisma.word.create({
      data: {
        text: w.text,
        jlpt: w.jlpt,
        readings: { create: w.readings },
        senses: {
          create: w.senses.map((s) => ({
            partOfSpeech: s.partOfSpeech,
            position: s.position,
            glosses: { create: s.glosses },
          })),
        },
      },
    });

    if (additionalWords.has(w.text)) {
      added += 1;
      addedByJlpt[w.jlpt] += 1;
    }
  }

  console.log(`Additional vocabulary added: ${added}`);
  console.log(`Additional vocabulary skipped (already existed): ${skipped}`);
  console.log(`  JLPT N5: ${addedByJlpt[5]} added`);
  console.log(`  JLPT N4: ${addedByJlpt[4]} added`);
}

async function seedKanji(): Promise<void> {
  for (const k of KANJI) {
    await prisma.kanji.upsert({
      where: { character: k.character },
      update: {},
      create: k,
    });
  }
}

// grammars.pattern has no unique constraint, so look it up before creating
// to keep the seed safe to re-run.
async function seedGrammars(): Promise<void> {
  for (const g of GRAMMARS) {
    const existing = await prisma.grammar.findFirst({
      where: { pattern: g.pattern },
      select: { id: true },
    });

    if (!existing) {
      await prisma.grammar.create({ data: g });
    }
  }
}

async function main(): Promise<void> {
  console.log("Seeding users...");
  await seedUsers();

  console.log(`Seeding ${WORDS.length} words...`);
  await seedWords();

  console.log(`Seeding ${KANJI.length} kanji...`);
  await seedKanji();

  console.log(`Seeding ${GRAMMARS.length} grammars...`);
  await seedGrammars();

  console.log("Done.");
  console.log(`  admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`  user:  ${USER_EMAIL} / ${USER_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
