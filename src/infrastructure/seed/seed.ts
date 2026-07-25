import { Client } from '@elastic/elasticsearch';
import Redis from 'ioredis';
const productsData = require('./products.json');
const elasticClient = new Client({
  node: process.env.ELASTICSEARCH_NODE || 'http://elasticsearch:9200',
});

const redisClient = new Redis(process.env.REDIS_URL || 'redis://redis:6379');

const INDEX_NAME = 'products';

async function runSeed() {
  console.log('🌱 Starting Seed script execution...');

  try {
    await redisClient.flushall();
    console.log('🧹 Redis cache flushed successfully.');
  } catch (redisErr) {
    console.warn('⚠️ Could not flush Redis cache:', redisErr);
  } finally {
    redisClient.disconnect();
  }

  const exists = await elasticClient.indices.exists({ index: INDEX_NAME });
  if (exists) {
    await elasticClient.indices.delete({ index: INDEX_NAME });
    console.log(`🗑️ Existing Elasticsearch index '${INDEX_NAME}' deleted.`);
  }

  await elasticClient.indices.create({
    index: INDEX_NAME,
    mappings: {
      properties: {
        id: { type: 'keyword' },
        name: {
          type: 'text',
          fields: { keyword: { type: 'keyword' } },
        },
        name_suggest: { type: 'completion' },
        description: { type: 'text' },
        category: { type: 'keyword' },
        subcategories: { type: 'keyword' },
        location: { type: 'keyword' },
        price: { type: 'float' },
        popularity: { type: 'integer' },
        created_at: { type: 'date' },
      },
    },
  });

  console.log(`✅ Elasticsearch Index '${INDEX_NAME}' created with custom mappings.`);

  const now = new Date();
  for (const prod of productsData) {
    await elasticClient.index({
      index: INDEX_NAME,
      document: {
        ...prod,
        created_at: now,
        name_suggest: {
          input: [prod.name, prod.category, ...prod.subcategories],
        },
      },
    });
  }

  await elasticClient.indices.refresh({ index: INDEX_NAME });
  console.log(`🚀 Successfully indexed ${productsData.length} products!`);
}

runSeed().catch((err) => {
  console.error('❌ Error executing Seed script:', err);
  process.exit(1);
});