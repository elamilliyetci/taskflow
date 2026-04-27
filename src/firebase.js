import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDpzLMmbDCvsGYYaScgnS7oTyKZvhlhNwg",
  authDomain: "taskflow-54572.firebaseapp.com",
  databaseURL: "https://taskflow-54572-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "taskflow-54572",
  storageBucket: "taskflow-54572.firebasestorage.app",
  messagingSenderId: "255245138537",
  appId: "1:255245138537:web:61e216b499ac7968f680f8"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);