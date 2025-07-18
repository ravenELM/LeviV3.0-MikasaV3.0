// db/economy.mongo.js  – global wallet store (CommonJS)
const { MongoClient } = require('mongodb');

const MONGO_URI  = process.env.MONGO_URI ||
  'mongodb+srv://thatonegirlwithbigbootyandboobs2023:sendmeurboobspic4535@cluster2023.bblquhi.mongodb.net/?retryWrites=true&w=majority';

const DB_NAME    = 'diabloBot';
const COLL_NAME  = 'wallets';

const client = new MongoClient(MONGO_URI);
const ready  = client.connect().then(() => client.db(DB_NAME).collection(COLL_NAME));

const norm = id => id.split(':')[0];  // strip device suffix

/* helpers ---------------------------------------------------- */
async function ensure(id) {
  id = norm(id);
  const col = await ready;
  await col.updateOne({ _id: id }, {
    $setOnInsert: { wallet: 0, lastDaily: 0, lastPayday: 0 }
  }, { upsert: true });
  return id;
}

/* public API ------------------------------------------------- */
async function getUser(id) {
  id   = await ensure(id);
  const col = await ready;
  return col.findOne({ _id: id }, { projection: { _id: 0 } });
}

async function setUser(id, data) {
  id = await ensure(id);
  const col = await ready;
  await col.updateOne({ _id: id }, { $set: data });
}

async function getBalance(id) {
  return (await getUser(id)).wallet;
}

async function setBalance(id, amount) {
  const col = await ready;
  await col.updateOne({ _id: await ensure(id) }, { $set: { wallet: amount } });
}

async function addBalance(id, delta) {
  const col = await ready;
  await col.updateOne({ _id: await ensure(id) }, { $inc: { wallet: delta } });
}

async function getDaily(id)  { return (await getUser(id)).lastDaily; }
async function setDaily(id,t){ const col=await ready; await col.updateOne({ _id:await ensure(id)},{$set:{lastDaily:t}}); }

async function getPayday(id) { return (await getUser(id)).lastPayday; }
async function setPayday(id,t){const col=await ready; await col.updateOne({ _id:await ensure(id)},{$set:{lastPayday:t}}); }

/* leaderboard */
async function getTop(limit=10){
  const col = await ready;
  return col.find().sort({ wallet:-1 }).limit(limit).toArray();
}

module.exports = {
  getUser, setUser,
  getBalance, setBalance, addBalance,
  getDaily, setDaily,
  getPayday, setPayday,
  getTop
};
