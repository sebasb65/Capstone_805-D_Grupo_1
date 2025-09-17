// HU-007: Sistema de autenticación con Firebase (offline-first)
// Estado: en desarrollo local

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Configuración de Firebase 
const firebaseConfig = {
  apiKey: "AIzaSyDtIl2mXyAEc-u8fTdoPnEfMgKxDdEMX7E",
  authDomain: "youconapp-155b2.firebaseapp.com",
  projectId: "youconapp-155b2",
  storageBucket: "youconapp-155b2.firebasestorage.app",
  messagingSenderId: "641705056447",
  appId: "1:641705056447:web:98fbc67c8fe0a26c2c8e0a",
  measurementId: "G-HEJPZ5JH08"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);