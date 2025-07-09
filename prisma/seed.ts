import { Prisma, PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const BATCH_SIZE = 100;

async function main() {
  try {
    console.log('Starting optimized seed process...');

    console.log('Creating users...');

    const userEmails = new Set<string>();
    while (userEmails.size < 20) {
      userEmails.add(faker.internet.email());
    }

    const userData: Prisma.UserCreateManyInput[] = await Promise.all(
      Array.from(userEmails).map(async (email) => {
        const password = faker.internet.password();
        const hashedPassword = await bcrypt.hash(password, 10);
        return { email, password: hashedPassword };
      }),
    );

    const createdUsers = await prisma.user.createMany({
      data: userData,
    });
    console.log(`Created ${createdUsers.count} users`);

    const users = await prisma.user.findMany();
    const userIds = users.map((u) => u.id);

    console.log('Creating tags...');

    const uniqueTags = new Set<string>();
    while (uniqueTags.size < 50) {
      uniqueTags.add(faker.lorem.word());
    }

    const tagData: Prisma.TagCreateManyInput[] = Array.from(uniqueTags).map(
      (name) => ({ name }),
    );

    const createdTags = await prisma.tag.createMany({
      data: tagData,
    });
    console.log(`Created ${createdTags.count} tags`);

    const tags = await prisma.tag.findMany();
    const tagIds = tags.map((t) => t.id);

    console.log('Creating articles...');

    const articleBatches: Prisma.ArticleCreateInput[][] = [];
    for (let i = 0; i < 500; i += BATCH_SIZE) {
      const batchSize = Math.min(BATCH_SIZE, 500 - i);
      const batch: Prisma.ArticleCreateInput[] = [];

      for (let j = 0; j < batchSize; j++) {
        const randomUserId =
          userIds[Math.floor(Math.random() * userIds.length)];
        const tagCount = Math.floor(Math.random() * 5) + 1;
        const randomTagIds: number[] = [];

        for (let k = 0; k < tagCount; k++) {
          randomTagIds.push(tagIds[Math.floor(Math.random() * tagIds.length)]);
        }

        batch.push({
          title: faker.lorem.sentence(),
          content: faker.lorem.paragraphs(3),
          isPublic: faker.datatype.boolean(),
          author: { connect: { id: randomUserId } },
          tags: { connect: randomTagIds.map((id) => ({ id })) },
        });
      }

      articleBatches.push(batch);
    }

    for (let i = 0; i < articleBatches.length; i++) {
      const batch = articleBatches[i];
      await prisma.$transaction(
        batch.map((article) => prisma.article.create({ data: article })),
      );
      console.log(
        `Created batch ${i + 1}/${articleBatches.length} (${batch.length} articles)`,
      );
    }

    console.log('Created all 500 articles');
  } catch (e) {
    console.error('Seed error:', e);
    throw e;
  }
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => {
    prisma
      .$disconnect()
      .then(() => console.log('Prisma disconnected'))
      .catch((e) => console.error('Disconnect error:', e));
  });
