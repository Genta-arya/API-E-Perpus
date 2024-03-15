import pkg from "firebase-admin";

const formattedPrivateKey = process.env.FIREBASE_CONFIG_PRIVATE_KEY;
const serviceAccountRaw = {
  type: process.env.FIREBASE_CONFIG_TYPE,
  project_id: process.env.FIREBASE_CONFIG_PROJECT_ID,
  private_key_id: process.env.FIREBASE_CONFIG_PRIVATE_KEY_ID,
  private_key: formattedPrivateKey, 
  client_email: process.env.FIREBASE_CONFIG_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CONFIG_CLIENT_ID,
  auth_uri: process.env.FIREBASE_CONFIG_AUTH_URI,
  token_uri: process.env.FIREBASE_CONFIG_TOKEN_URI,
  auth_provider_x509_cert_url:
    process.env.FIREBASE_CONFIG_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CONFIG_CLIENT_X509_CERT_URL,
  universe_domain: process.env.FIREBASE_CONFIG_UNIVERSE_DOMAIN,
};
const firebaseConfig = {
    apiKey: "AIzaSyCzqUoz8Ddq-9j7Mg3UTqtLxR11JXBfHpE",
    authDomain: "perpustakaan-f20f3.firebaseapp.com",
    projectId: "perpustakaan-f20f3",
    storageBucket: "perpustakaan-f20f3.appspot.com",
    messagingSenderId: "418849619684",
    appId: "1:418849619684:web:ed5113876cc991572ff6f1",
    measurementId: "G-399HME9CLH"
  };
pkg.initializeApp({
  credential: pkg.credential.cert(serviceAccountRaw),
  storageBucket: "perpustakaan-f20f3.appspot.com",

});



const bucket = pkg.storage().bucket();


export { pkg as firebase, bucket , firebaseConfig  };