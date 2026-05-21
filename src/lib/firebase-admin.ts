import admin from "firebase-admin";

type ServiceAccount = {
    project_id?: string;
    client_email?: string;
    private_key?: string;
};

function getServiceAccount(): ServiceAccount | null {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
        return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON) as ServiceAccount;
    }
    return null;
}

function getFirebaseApp() {
    if (admin.apps.length > 0) {
        return admin.app();
    }

    const serviceAccount = getServiceAccount();

    if (serviceAccount) {
        const privateKey = serviceAccount.private_key?.replace(/\\n/g, "\n");
        return admin.initializeApp({
            credential: admin.credential.cert({
                projectId: serviceAccount.project_id,
                clientEmail: serviceAccount.client_email,
                privateKey,
            }),
        });
    }

    return admin.initializeApp({
        credential: admin.credential.applicationDefault(),
    });
}

const app = getFirebaseApp();
export const firestore = app.firestore();
export const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;
export const Timestamp = admin.firestore.Timestamp;
