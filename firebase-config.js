// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCH_kZxK9laiN0boBrvs6sJpacr38Ccpqk",
    authDomain: "bestoptions-fc701.firebaseapp.com",
    projectId: "bestoptions-fc701",
    storageBucket: "bestoptions-fc701.firebasestorage.app",
    messagingSenderId: "552088049731",
    appId: "1:552088049731:web:76b079f64059906cde9cf6",
    measurementId: "G-EXKTLJ2BFG"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get Firestore instance
const db = firebase.firestore();

console.log('Firebase initialized successfully');
