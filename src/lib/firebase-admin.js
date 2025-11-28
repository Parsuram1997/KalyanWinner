
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.firestore = exports.auth = exports.app = void 0;
var app_1 = require("firebase-admin/app");
var auth_1 = require("firebase-admin/auth");
var firestore_1 = require("firebase-admin/firestore");
var config_1 = require("@/firebase/config");
function initializeAdminApp() {
    if ((0, app_1.getApps)().length > 0) {
        return (0, app_1.getApp)();
    }
    // In a hosted environment (like App Hosting), ADC are configured automatically.
    // For local development, you must run `gcloud auth application-default login`.
    // This command will save a credentials file on your machine that the SDK can find.
    var credential = (0, app_1.applicationDefault)();
    return (0, app_1.initializeApp)({
        credential: credential,
        projectId: config_1.firebaseConfig.projectId, // Explicitly set the project ID
    });
}
var app = initializeAdminApp();
exports.app = app;
var auth = (0, auth_1.getAuth)(app);
exports.auth = auth;
var firestore = (0, firestore_1.getFirestore)(app);
exports.firestore = firestore;
