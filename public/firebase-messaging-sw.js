
// This service worker file is intentionally left almost blank.
// It's required for Firebase Cloud Messaging to work in the background.
// Firebase will handle the implementation details automatically.

// You can optionally add custom background message handling here if needed.
// For example:
/*
 import { initializeApp } from "firebase/app";
 import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

 const firebaseConfig = {
   apiKey: "...",
   authDomain: "...",
   projectId: "...",
   storageBucket: "...",
   messagingSenderId: "...",
   appId: "...",
 };

 initializeApp(firebaseConfig);
 const messaging = getMessaging();

 onBackgroundMessage(messaging, (payload) => {
   console.log("[firebase-messaging-sw.js] Received background message ", payload);
   
   const notificationTitle = payload.notification.title;
   const notificationOptions = {
     body: payload.notification.body,
     icon: "/kalyanwinnerlogo.png",
   };

   self.registration.showNotification(notificationTitle, notificationOptions);
 });
*/
