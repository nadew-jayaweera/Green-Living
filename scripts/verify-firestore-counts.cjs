const admin = require("firebase-admin");

const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

async function main() {
  const db = admin.firestore();
  for (const name of ["users", "badges", "userBadges", "uploads", "forumPosts", "comments", "likes"]) {
    const snap = await db.collection(name).get();
    console.log(`${name}: ${snap.size}`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
