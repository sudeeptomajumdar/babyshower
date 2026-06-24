// Import updated functions from Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

// TODO: Replace with YOUR actual Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyBbNCpQdK5MCBTSqScqexw3fshs7z2kezY",
    authDomain: "baby-shower-evite.firebaseapp.com",
    databaseURL: "https://baby-shower-evite-default-rtdb.firebaseio.com",
    projectId: "baby-shower-evite",
    storageBucket: "baby-shower-evite.firebasestorage.app",
    messagingSenderId: "220534452127",
    appId: "1:220534452127:web:c42f6d6f41e62eaf8a97aa"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// =========================================================================
// WE DELETED ALL THE FORM SUBMISSION AND EMAIL LOOKUP CODE FROM HERE!
// The page can no longer crash looking for missing HTML form boxes.
// =========================================================================

// Listen for RSVPs in real-time (Independent Rendering for the Archive)
onSnapshot(collection(db, "rsvps"), (snapshot) => {
    try {
        let totalAttending = 0;
        const messagesDiv = document.getElementById('publicMessages');
        const totalRsvpsDiv = document.getElementById('totalRsvps');

        let rsvpsArray = [];
        snapshot.forEach((doc) => {
            rsvpsArray.push(doc.data());
        });

        // 1. BULLETPROOF SORTING
        rsvpsArray.sort((a, b) => {
            let timeA = 0;
            let timeB = 0;

            if (a.timestamp) {
                if (typeof a.timestamp.toMillis === 'function') timeA = a.timestamp.toMillis();
                else if (a.timestamp.seconds) timeA = a.timestamp.seconds * 1000;
                else timeA = new Date(a.timestamp).getTime() || 0;
            }
            
            if (b.timestamp) {
                if (typeof b.timestamp.toMillis === 'function') timeB = b.timestamp.toMillis();
                else if (b.timestamp.seconds) timeB = b.timestamp.seconds * 1000;
                else timeB = new Date(b.timestamp).getTime() || 0;
            }

            return timeB - timeA; 
        });

        // 2. Clear the guestbook only if it actually exists on this page
        if (messagesDiv) {
            messagesDiv.innerHTML = ''; 
        }

        // 3. Loop through the safe array
        rsvpsArray.forEach((data) => {
            
            if (data.status === 'yes') {
                totalAttending += parseInt(data.guests) || 0;
            }

            const safePrivacy = data.privacy || 'public';

            if (safePrivacy === 'public' && data.message && data.message.trim() !== "") {
                
                // Only build the message cards if the guestbook container exists!
                if (messagesDiv) {
                    const msgElement = document.createElement('div');
                    msgElement.className = 'message-card';
                    
                    let statusText = '';
                    if (data.status === 'yes') statusText = ' (Attending)';
                    if (data.status === 'maybe') statusText = ' (Maybe Attending)';
                    if (data.status === 'no') statusText = ' (Unable to Attend)';

                    msgElement.innerHTML = `
                        <p>"${data.message}"</p>
                        <small>- ${data.name || 'Guest'}${statusText}</small>
                    `;
                    messagesDiv.appendChild(msgElement);
                }
            }
        });

        // 4. Update the total counter only if it actually exists on this page
        if (totalRsvpsDiv) {
            totalRsvpsDiv.innerHTML = `Total Guests Attending: <strong>${totalAttending}</strong>`;
        }
        
    } catch (error) {
        console.error("Guestbook rendering error:", error);
    }
});
