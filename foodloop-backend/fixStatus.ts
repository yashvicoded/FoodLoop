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

async function fixStatus() {
    try {
        const snapshot = await db.collection('donations').get();
        console.log(`Checking ${snapshot.docs.length} donations...`);

        let fixed = 0;
        for (const doc of snapshot.docs) {
            const data = doc.data();
            if (typeof data.status === 'string' && data.status.trim() !== data.status) {
                await doc.ref.update({ status: data.status.trim() });
                console.log(`Updated doc ${doc.id}`);
                fixed++;
            }
        }
        console.log(`Done processing. Fixed ${fixed} documents.`);
    } catch (err) {
        console.error('Error:', err);
    }
}

fixStatus();
