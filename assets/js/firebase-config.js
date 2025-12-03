// ==========================================
// FIREBASE CONFIGURATION
// File: assets/js/firebase-config.js
// ==========================================

const firebaseConfig = {
  apiKey: "AIzaSyA7MmfqJupRgHUmZKHjBA93YPmGZ8SxF5I",
  authDomain: "d-takah-kemenhan.firebaseapp.com",
  projectId: "d-takah-kemenhan",
  storageBucket: "d-takah-kemenhan.firebasestorage.app",
  messagingSenderId: "581572906242",
  appId: "1:581572906242:web:2962effdd87389d7a5c61b",
  measurementId: "G-L7NPZTEXRE",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();

// Configure Firestore settings
db.settings({
  timestampsInSnapshots: true,
  cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
});

// Enable offline persistence (optional)
db.enablePersistence().catch((err) => {
  if (err.code === "failed-precondition") {
    console.warn("⚠️ Multiple tabs open, persistence enabled only in one tab");
  } else if (err.code === "unimplemented") {
    console.warn("⚠️ Browser does not support offline persistence");
  }
});

console.log("✅ Firebase initialized successfully!");

// Export untuk digunakan di file lain
if (typeof window !== "undefined") {
  window.auth = auth;
  window.db = db;
  window.firebase = firebase;
}
