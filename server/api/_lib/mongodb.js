import { MongoClient, ServerApiVersion } from 'mongodb';
import dns from 'dns';

// Bazı yerel router DNS'leri (özellikle Türkiye'deki bazı modemler)
// MongoDB Atlas'ın SRV kayıtlarını çözemiyor. Cloudflare + Google DNS'e
// fallback yapıyoruz. Vercel'de zaten public resolver kullanılır,
// bu satır sadece local development için kritik.
if (dns.setServers && typeof dns.setServers === 'function') {
  try {
    const current = dns.getServers() || [];
    const wanted = ['1.1.1.1', '8.8.8.8', '8.8.4.4'];
    const merged = Array.from(new Set([...wanted, ...current]));
    dns.setServers(merged);
  } catch { /* ignore */ }
}

let client = null;
let clientPromise = null;

function getClientPromise() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI ortam değişkeni tanımlı değil. Vercel Dashboard > Settings > Environment Variables kısmından ayarlayın.');
  }

  if (!clientPromise) {
    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: false,
        deprecationErrors: true,
      },
      connectTimeoutMS: 15000,
      socketTimeoutMS: 20000,
      serverSelectionTimeoutMS: 15000,
    });

    clientPromise = (async () => {
      const MAX_RETRIES = 3;
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          return await client.connect();
        } catch (err) {
          console.error(`❌ MongoDB bağlantı hatası (deneme ${attempt}/${MAX_RETRIES}):`, err.message);
          if (attempt === MAX_RETRIES) {
            client = null;
            clientPromise = null;
            throw err;
          }
          await new Promise((r) => setTimeout(r, 1000 * attempt));
        }
      }
    })();
  }

  return clientPromise;
}

export async function getDb() {
  const connectedClient = await getClientPromise();
  const dbName = process.env.MONGODB_DB || 'kadirdemir';
  return connectedClient.db(dbName);
}

export function isValidObjectId(id) {
  return typeof id === 'string' && /^[a-f\d]{24}$/i.test(id);
}

export default getClientPromise;
