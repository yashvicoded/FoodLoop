import { AnalyticsController } from './src/controllers/analyticsController';
import admin, { db } from './src/config/firebase';

async function testDashboard() {
    const req: any = { user: { uid: 'InVxHhyPwvWmKyeaUqMnoITQFnw2' } };
    const res: any = {
        status: (code: number) => ({
            json: (data: any) => console.log(`Status ${code}:`, JSON.stringify(data, null, 2))
        }),
        json: (data: any) => console.log('Success JSON:', JSON.stringify(data, null, 2))
    };

    await AnalyticsController.getDashboard(req, res);
}

testDashboard();
