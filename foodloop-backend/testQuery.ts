import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
dotenv.config();

const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
    });
}

const db = admin.firestore();

async function testQuery() {
    try {
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);
        const last7DaysTimestamp = admin.firestore.Timestamp.fromDate(last7Days);

        let donationsQuery: FirebaseFirestore.Query = db.collection('donations');
        donationsQuery = donationsQuery
            .where('status', '==', 'COMPLETED')
            .where('createdAt', '>=', last7DaysTimestamp);

        const donationsSnapshot = await donationsQuery.get();

        console.log(`Query fetched ${donationsSnapshot.docs.length} documents.`);
        if (donationsSnapshot.docs.length > 0) {
            console.log('First doc ID:', donationsSnapshot.docs[0].id);
            console.log('First doc data:', donationsSnapshot.docs[0].data());
        }
    } catch (err) {
        console.error('Error executing query:', err);
    }
}

testQuery();
