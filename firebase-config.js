// ============================================================
// FIREBASE CONFIGURATION — e-Safe Platform (Cissy Technologies)
// ============================================================
// SETUP INSTRUCTIONS — do these once before sign-in/sign-up will work:
//
// 1. Go to https://console.firebase.google.com and create a new project
//    (or open an existing one).
//
// 2. In the project overview, click the "</>" (Web) icon under
//    "Get started by adding Firebase to your app" to register a web app.
//    Firebase will show you a firebaseConfig object — copy its values
//    into the firebaseConfig object below, replacing every
//    "REPLACE_WITH_..." placeholder. Do not rename the properties.
//
// 3. In the left sidebar, go to Build > Authentication > Get started,
//    open the "Sign-in method" tab, and enable "Email/Password".
//
// 4. In the left sidebar, go to Build > Firestore Database > Create database.
//    Choose "Start in production mode" and pick a location.
//
// 5. Once the database exists, open the "Rules" tab, replace the default
//    rules with the ones at the bottom of this file (swapping in your
//    real admin email), and click "Publish". This step is REQUIRED —
//    without it, any signed-in employee could read every other
//    employee's record directly from the browser console, bypassing
//    admin.html entirely.
//
// 6. Set ADMIN_EMAIL below to the real email address that should have
//    access to admin.html. That person still registers/signs in like
//    any other employee at register.html/signin.html — this constant
//    just grants that one account access to the admin dashboard.
//    Use the exact same address in the Firestore rules in step 5.
//
// 7. Upload this file to the same folder as index.html. Every page that
//    needs Firebase loads it, so it must be present at the site root.
// ============================================================

const firebaseConfig = {
  apiKey: "REPLACE_WITH_YOUR_API_KEY",
  authDomain: "REPLACE_WITH_YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "REPLACE_WITH_YOUR_PROJECT_ID",
  storageBucket: "REPLACE_WITH_YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "REPLACE_WITH_YOUR_SENDER_ID",
  appId: "REPLACE_WITH_YOUR_APP_ID"
};

// The only account allowed to view admin.html.
// Must exactly match the email address used to sign in as the admin.
const ADMIN_EMAIL = "admin@cissytechnologies.com";

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

/* ============================================================
   FIRESTORE SECURITY RULES
   Paste into: Firebase Console > Firestore Database > Rules > Publish
   Replace admin@cissytechnologies.com with your real ADMIN_EMAIL.
   ============================================================

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /employees/{userId} {
      // An employee can read and write only their own record.
      allow read, write: if request.auth != null && request.auth.uid == userId;
      // The admin account can read every employee record (for admin.html).
      allow read: if request.auth != null
                   && request.auth.token.email == 'admin@cissytechnologies.com';
    }
  }
}

   ============================================================ */
