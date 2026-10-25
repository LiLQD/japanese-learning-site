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

const ADMIN_EMAIL = "admin@localhost";
const ADMIN_PASSWORD = "admin1234";
const USER_EMAIL = "user@localhost";
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

async function seedUsers(): Promise<void> {
  const adminHash = await hash(ADMIN_PASSWORD, 10);
  const userHash = await hash(USER_PASSWORD, 10);

  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
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
  for (const w of WORDS) {
    const existing = await prisma.word.findFirst({ where: { text: w.text } });
    if (existing) continue;

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
  }
}

async function main(): Promise<void> {
  console.log("Seeding users...");
  await seedUsers();

  console.log(`Seeding ${WORDS.length} words...`);
  await seedWords();

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
