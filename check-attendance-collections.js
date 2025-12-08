const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    
    console.log('📊 Checking attendance collections:\n');
    
    const collections = await db.listCollections().toArray();
    
    for (const col of collections) {
        if (col.name.toLowerCase().includes('attend')) {
            const count = await db.collection(col.name).countDocuments();
            console.log(`${col.name}: ${count} documents`);
            
            if (count > 0) {
                const sample = await db.collection(col.name).findOne();
                console.log('Sample document:');
                console.log(JSON.stringify(sample, null, 2));
                console.log('');
            }
        }
    }
    
    process.exit(0);
});
