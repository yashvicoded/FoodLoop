import * as admin from 'firebase-admin';
import * as path from 'path';

// --- ROBUST PATHING ---
// This ensures it finds your key in the root folder
const serviceAccountPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

const db = admin.firestore();
const MY_STORE_ID = 'InVxHhyPwvWmKyeaUqMnoITQFnw2';

function addDays(days: number) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return admin.firestore.Timestamp.fromDate(date);
}

const products = [
    { name: 'Organic Bananas', category: 'Fresh Produce', originalPrice: 120, quantity: 15, expiryDays: 1 }, // URGENT
    { name: 'Whole Wheat Bread', category: 'Bakery', originalPrice: 50, quantity: 10, expiryDays: 2 },    // URGENT
    { name: 'Fresh Milk 1L', category: 'Dairy', originalPrice: 65, quantity: 8, expiryDays: 4 },        // WARNING
    { name: 'Greek Yogurt', category: 'Dairy', originalPrice: 80, quantity: 12, expiryDays: 7 },        // WARNING
    { name: 'Apples 1kg', category: 'Fresh Produce', originalPrice: 150, quantity: 5, expiryDays: 14 }, // NORMAL
    { name: 'Canned Beans', category: 'Canned', originalPrice: 40, quantity: 20, expiryDays: 30 },      // NORMAL
    { name: 'Frozen Peas', category: 'Frozen', originalPrice: 90, quantity: 15, expiryDays: 45 },      // NORMAL
    { name: 'Bagels 6-Pack', category: 'Bakery', originalPrice: 110, quantity: 7, expiryDays: 3 },      // WARNING
    { name: 'Strawberries Box', category: 'Fresh Produce', originalPrice: 250, quantity: 6, expiryDays: 5 } // WARNING
];

async function seedData() {
    try {
        console.log(`🚀 Starting seed for Store: ${MY_STORE_ID}`);
        const batch = db.batch();

        // 1. CLEAR OLD DATA (Optional: Clean slate for your demo)
        const existing = await db.collection('products').where('storeId', '==', MY_STORE_ID).get();
        existing.forEach(doc => batch.delete(doc.ref));

        // 2. ADD FRESH DATA
        products.forEach(p => {
            const docRef = db.collection('products').doc();
            batch.set(docRef, {
                storeId: MY_STORE_ID,
                name: p.name,
                category: p.category,
                originalPrice: p.originalPrice,
                currentPrice: p.originalPrice, // Initially same until 'Apply' is clicked
                isDiscounted: false,
                quantity: p.quantity,
                expiryDate: addDays(p.expiryDays),
                discountPercent: 0,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        });

        await batch.commit();
        console.log('✅ SUCCESS: 9 Products added to Inventory!');
        process.exit(0);
    } catch (error) {
        console.error('❌ SEED ERROR:', error);
        process.exit(1);
    }
}

seedData();