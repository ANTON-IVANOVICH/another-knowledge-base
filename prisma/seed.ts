import { PrismaClient, Prisma } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Start seeding...");

  await prisma.article.deleteMany({});
  console.log("🗑 Articles cleared");

  await prisma.tags.deleteMany({});
  console.log("🗑 Tags cleared");

  await prisma.user.deleteMany({});
  console.log("🗑 Users cleared");

  const usersData: Prisma.UserCreateInput[] = Array.from(
    { length: 100 },
    () => ({
      email: faker.internet.email().toLowerCase(),
      password: faker.internet.password({ length: 12 }),
      role: faker.helpers.arrayElement<"USER" | "ADMIN">(["USER", "ADMIN"]),
      name: faker.person.firstName() + " " + faker.person.lastName(),
    })
  );
  const users = await Promise.all(
    usersData.map((u) => prisma.user.create({ data: u }))
  );
  console.log(`✅ Users created: ${users.length}`);

  const tagTitles = Array.from({ length: 50 }, () =>
    faker.lorem.word().toLowerCase()
  );
  const uniqueTitles = Array.from(new Set(tagTitles));
  const tags = await Promise.all(
    uniqueTitles.map((title) => prisma.tags.create({ data: { title } }))
  );
  console.log(`✅ Tags created: ${tags.length}`);

  const articlesPromises = Array.from({ length: 500 }, () => {
    const author = faker.helpers.arrayElement(users);
    const picked = faker.helpers.arrayElements(tags, {
      min: 1,
      max: 5,
    });
    return prisma.article.create({
      data: {
        title: faker.lorem.sentence(6),
        content: faker.lorem.paragraphs(2),
        isPublic: faker.datatype.boolean(),
        author: { connect: { id: author.id } },
        tags: {
          connect: picked.map((t) => ({ title: t.title })),
        },
      },
    });
  });
  const articles = await Promise.all(articlesPromises);
  console.log(`✅ Articles created: ${articles.length}`);

  console.log("🎉 Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
