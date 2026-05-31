// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

// TODO: Replace with your Firebase configuration object
const firebaseConfig = {
    apiKey: "AIzaSyBbNCpQdK5MCBTSqScqexw3fshs7z2kezY",
    authDomain: "baby-shower-evite.firebaseapp.com",
    databaseURL: "https://baby-shower-evite-default-rtdb.firebaseio.com",
    projectId: "baby-shower-evite",
    storageBucket: "baby-shower-evite.firebasestorage.app",
    messagingSenderId: "220534452127",
    appId: "1:220534452127:web:c42f6d6f41e62eaf8a97aa"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Handle Form Submission
document.getElementById('rsvpForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const guests = parseInt(document.getElementById('guests').value);
    const message = document.getElementById('message').value;
    const privacy = document.querySelector('input[name="privacy"]:checked').value;

    try {
        await addDoc(collection(db, "rsvps"), {
            name: name,
            guests: guests,
            message: message,
            privacy: privacy,
            timestamp: new Date()
        });
        alert("Thank you for RSVPing!");
        document.getElementById('rsvpForm').reset();
    } catch (e) {
        console.error("Error adding document: ", e);
        alert("There was an error submitting your RSVP. Please try again.");
    }
});

// Listen for RSVPs in real-time to update counts and public messages
onSnapshot(collection(db, "rsvps"), (snapshot) => {
    let totalGuests = 0;
    const messagesDiv = document.getElementById('publicMessages');
    messagesDiv.innerHTML = ''; // Clear current messages

    snapshot.forEach((doc) => {
        const data = doc.data();
        
        // Add to total RSVP count
        totalGuests += data.guests;

        // Display message IF it's public AND they actually wrote something
        if (data.privacy === 'public' && data.message.trim() !== "") {
            const msgElement = document.createElement('div');
            msgElement.className = 'message-card';
            msgElement.innerHTML = `
                <p>"${data.message}"</p>
                <small>- ${data.name}</small>
            `;
            messagesDiv.appendChild(msgElement);
        }
    });

    document.getElementById('totalRsvps').innerHTML = `Total Guests Attending: <strong>${totalGuests}</strong>`;
});