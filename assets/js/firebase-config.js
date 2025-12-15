// ==========================================
// FIREBASE CONFIGURATION - COMPLETE FIXED VERSION
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

console.log("🔧 Initializing Firebase...");

// Initialize Firebase App
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
  console.log("✅ Firebase App initialized");
} else {
  console.log("✅ Firebase App already initialized");
}

// Initialize Auth
const auth = firebase.auth();
console.log("✅ Firebase Auth initialized");

// Initialize Firestore
const db = firebase.firestore();

// Configure Firestore settings
db.settings({
  timestampsInSnapshots: true,
  cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
});
console.log("✅ Firestore initialized with settings");

// Enable offline persistence (optional, with error handling)
db.enablePersistence({ synchronizeTabs: true })
  .then(() => {
    console.log("✅ Firestore offline persistence enabled");
  })
  .catch((err) => {
    if (err.code === "failed-precondition") {
      console.warn(
        "⚠️ Persistence failed: Multiple tabs open, enabled only in one tab"
      );
    } else if (err.code === "unimplemented") {
      console.warn(
        "⚠️ Persistence not available: Browser doesn't support offline mode"
      );
    } else {
      console.warn("⚠️ Persistence error:", err);
    }
  });

// Initialize Storage (with error handling)
let storage = null;
try {
  if (typeof firebase.storage === "function") {
    storage = firebase.storage();
    console.log("✅ Firebase Storage initialized");
  } else {
    console.warn(
      "⚠️ Firebase Storage SDK not loaded - Add storage script to HTML if needed"
    );
    console.warn(
      '   <script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-storage-compat.js"></script>'
    );
  }
} catch (error) {
  console.warn("⚠️ Storage initialization failed:", error.message);
  console.warn("   File uploads will not work without Storage SDK");
}

// Export to global scope
if (typeof window !== "undefined") {
  window.auth = auth;
  window.db = db;
  window.storage = storage;
  window.firebase = firebase;

  console.log("✅ Firebase services exported to window:", {
    auth: "✓",
    db: "✓",
    storage: storage ? "✓" : "✗ (not loaded)",
    firebase: "✓",
  });
}

console.log("✅ Firebase Configuration Complete!");

// Optional: Add connection state listener
db.collection("_connection_test")
  .limit(1)
  .get()
  .then(() => {
    console.log("✅ Firestore connection test: SUCCESS");
  })
  .catch((error) => {
    console.error("❌ Firestore connection test: FAILED", error);
  });
