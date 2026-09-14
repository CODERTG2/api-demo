const { MongoClient } = require('mongodb');
const { MongoMemoryServer } = require('mongodb-memory-server');
(async () => {
    const mongoServer = await MongoMemoryServer.create();
    const client = new MongoClient(mongoServer.getUri());
    try {
        await client.connect();
        console.log('Connected');
    } catch(e) {
        console.error(e);
    }
    await client.close();
    await mongoServer.stop();
})();
