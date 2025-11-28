
// Import the Firebase app and messaging services
import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

// Your web app's Firebase configuration
// This needs to be present in the service worker file as well.
const firebaseConfig = {
  apiKey: "AIzaSyDHQc1df1xRk8hHZgqTzq-X173aMBoSe5E",
  authDomain: "studio-7786701397-58781.firebaseapp.com",
  projectId: "studio-7786701397-58781",
  storageBucket: "studio-7786701397-58781.firebasestorage.app",
  messagingSenderId: "54126435357",
  appId: "1:54126435357:web:95c508286ee69392b27af4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Handler for background notifications
onBackgroundMessage(messaging, (payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );

  // Customize the notification here
  const notificationTitle = payload.notification?.title || "Kalyan Winner";
  const notificationOptions = {
    body: payload.notification?.body || "A new result has been declared!",
    icon: "/kalyanwinnerlogo.png", // Path to your app's icon
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
