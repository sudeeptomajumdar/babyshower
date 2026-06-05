// Import updated functions from Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, onSnapshot, query, where, updateDoc, doc, orderBy } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

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

// --- NEW: Auto-populate form when email is entered ---
// The 'blur' event fires the moment they click or tab out of the email box
document.getElementById('email').addEventListener('blur', async (e) => {
    const emailInput = e.target.value.trim().toLowerCase();
    
    // If the box is empty, don't do anything
    if (!emailInput) return; 

    try {
        // Search the database for this exact email
        const rsvpsRef = collection(db, "rsvps");
        const q = query(rsvpsRef, where("email", "==", emailInput));
        const querySnapshot = await getDocs(q);

        // If a match is found, fill in the form!
        if (!querySnapshot.empty) {
            const existingData = querySnapshot.docs[0].data();
            
            // Populate the text and number fields
            document.getElementById('name').value = existingData.name || '';
            document.getElementById('guests').value = existingData.guests || 1;
            document.getElementById('message').value = existingData.message || '';
            
            // Check the correct Attendance Status radio button
            if (existingData.status) {
                const statusRadio = document.querySelector(`input[name="status"][value="${existingData.status}"]`);
                if (statusRadio) statusRadio.checked = true;
            }
            
            // Check the correct Privacy radio button
            if (existingData.privacy) {
                const privacyRadio = document.querySelector(`input[name="privacy"][value="${existingData.privacy}"]`);
                if (privacyRadio) privacyRadio.checked = true;
            }
            
            console.log("Previous RSVP found and populated.");
        }
    } catch (error) {
        console.error("Error fetching existing RSVP:", error);
    }
});
// -----------------------------------------------------
// Handle Form Submission (Create or Update)
document.getElementById('rsvpForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Gather form data
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value.toLowerCase(); // Convert to lowercase for accurate matching
    const guests = parseInt(document.getElementById('guests').value);
    const message = document.getElementById('message').value;
    const status = document.querySelector('input[name="status"]:checked').value;
    const privacy = document.querySelector('input[name="privacy"]:checked').value;

    const rsvpData = {
        name: name,
        email: email,
        guests: guests,
        message: message,
        status: status,
        privacy: privacy,
        timestamp: new Date()
    };

    try {
        // Step 1: Check if this email already exists in the database
        const rsvpsRef = collection(db, "rsvps");
        const q = query(rsvpsRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            // Step 2a: Email exists! UPDATE the existing record.
            const existingDocId = querySnapshot.docs[0].id; // Get the ID of the existing record
            const docRef = doc(db, "rsvps", existingDocId);
            await updateDoc(docRef, rsvpData);
            alert("Your previous RSVP has been successfully updated!");
        } else {
            // Step 2b: Email does not exist. CREATE a new record.
            await addDoc(rsvpsRef, rsvpData);
            alert("Thank you for RSVPing!");
        }
        
        // Clear the form after success
        document.getElementById('rsvpForm').reset();
    } catch (e) {
        console.error("Error submitting RSVP: ", e);
        alert("There was an error submitting your RSVP. Please try again.");
    }
});

// Listen for RSVPs in real-time (Sorted by newest first)
// const rsvpsRefForGuestbook = collection(db, "rsvps");
// Use "desc" for newest messages at the top, or change to "asc" for oldest at the top
// const sortedQuery = query(rsvpsRefForGuestbook, orderBy("timestamp", "desc"));

// Listen for RSVPs in real-time (Sorted safely using JavaScript)
onSnapshot(collection(db, "rsvps"), (snapshot) => {
    let totalAttending = 0;
    const messagesDiv = document.getElementById('publicMessages');
    messagesDiv.innerHTML = ''; 

    // 1. Put all the database records into a standard array
    let rsvpsArray = [];
    snapshot.forEach((doc) => {
        rsvpsArray.push(doc.data());
    });

    // 2. Sort the array so newest messages are at the top
    rsvpsArray.sort((a, b) => {
        // Safely grab the time. If it's an old test entry with no timestamp, we default it to 0 so it just goes to the bottom!
        const timeA = a.timestamp && a.timestamp.toMillis ? a.timestamp.toMillis() : 0;
        const timeB = b.timestamp && b.timestamp.toMillis ? b.timestamp.toMillis() : 0;
        return timeB - timeA; // Descending order
    });

    // 3. Loop through the newly sorted array and build the guestbook
    rsvpsArray.forEach((data) => {
        
        // ONLY count guests if their status is "yes"
        if (data.status === 'yes') {
            totalAttending += data.guests;
        }

        // Display public messages
        if (data.privacy === 'public' && data.message && data.message.trim() !== "") {
            const msgElement = document.createElement('div');
            msgElement.className = 'message-card';
            
            // Adds a visual cue so people know if the message writer is attending
            let statusText = '';
            if (data.status === 'yes') statusText = ' (Attending)';
            if (data.status === 'maybe') statusText = ' (Maybe Attending)';
            if (data.status === 'no') statusText = ' (Unable to Attend)';

            msgElement.innerHTML = `
                <p>"${data.message}"</p>
                <small>- ${data.name}${statusText}</small>
            `;
            messagesDiv.appendChild(msgElement);
        }
    });

    // Update the attendance counter
    document.getElementById('totalRsvps').innerHTML = `Total Guests Attending: <strong>${totalAttending}</strong>`;
});

    document.getElementById('totalRsvps').innerHTML = `Total Guests Attending: <strong>${totalAttending}</strong>`;
});
