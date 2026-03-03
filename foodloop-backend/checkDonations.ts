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

async function checkDonations() {
    try {
        const snapshot = await db.collection('donations').get();
        console.log(`Found ${snapshot.docs.length} donations in total.`);

        snapshot.docs.forEach((doc, index) => {
            console.log(`--- Donation ${index + 1} ---`);
            console.log('ID:', doc.id);
            console.log('Data:', JSON.stringify(doc.data(), null, 2));
        });
    } catch (err) {
        console.error('Error fetching donations:', err);
    }
}

checkDonations();
