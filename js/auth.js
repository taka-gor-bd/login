// js/auth.js - Handles Firebase Authentication logic
import { auth } from './firebase-config.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    showLoading, showMessage, hideMessage,
    showAuthSection, showAppSection, showBonusPopup,
    closeBonusPopup
} from './ui.js';
import {
    createNewUserEntry,
    updateBalance,
    getUserData,
    fetchAndDisplayUserBalanceAndReferralCode
} from './database.js';
import { REFERRER_BONUS, REFERRAL_BONUS, WELCOME_BONUS } from './firebase-config.js';


const loginEmailInput = document.getElementById('loginEmail');
const loginPasswordInput = document.getElementById('loginPassword');
const loginMessage = document.getElementById('loginMessage');

const regNameInput = document.getElementById('regName');
const regEmailInput = document.getElementById('regEmail');
const regPasswordInput = document.getElementById('regPassword');
const regConfirmPasswordInput = document.getElementById('regConfirmPassword');
const regReferralCodeInput = document.getElementById('regReferralCode');
const registerMessage = document.getElementById('registerMessage');

const resetEmailInput = document.getElementById('resetEmail');
const passwordResetMessage = document.getElementById('passwordResetMessage');

// --- User Registration ---
export async function handleRegister(event) {
    event.preventDefault(); // Prevent default form submission
    const name = regNameInput.value;
    const email = regEmailInput.value;
    const password = regPasswordInput.value;
    const confirmPassword = regConfirmPasswordInput.value;
    const referrerCode = regReferralCodeInput.value.trim().toUpperCase();
    const btn = event.target;
    const resetBtn = showLoading(btn);
    hideMessage(registerMessage);

    if (password !== confirmPassword) {
        showMessage(registerMessage, "Passwords do not match!", 'error');
        resetBtn();
        return;
    }
    if (password.length < 6) {
        showMessage(registerMessage, "Password must be at least 6 characters long.", 'error');
        resetBtn();
        return;
    }

    let referrerUid = null;
    if (referrerCode) {
        try {
            const referrerCodeSnapshot = await getUserData(referrerCode, 'referralCode'); // Get UID from referral code
            if (referrerCodeSnapshot && referrerCodeSnapshot.val()) {
                referrerUid = referrerCodeSnapshot.val(); // Get UID from the snapshot value
                if (referrerUid === auth.currentUser?.uid) {
                    showMessage(registerMessage, "You cannot refer yourself!", 'error');
                    resetBtn();
                    return;
                }
                console.log(`Referral code ${referrerCode} found, referrer UID: ${referrerUid}`);
            } else {
                showMessage(registerMessage, "Invalid referral code!", 'error');
                resetBtn();
                return;
            }
        } catch (error) {
            console.error("Error checking referral code:", error);
            showMessage(registerMessage, "Error checking referral code.", 'error');
            resetBtn();
            return;
        }
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (name) {
            await updateProfile(user, { displayName: name });
        }

        const newUserReferralCode = generateReferralCode(); // Assume this is imported or defined
        await createNewUserEntry(user.uid, name, email, newUserReferralCode, referrerUid);

        if (referrerUid) {
            await updateBalance(referrerUid, REFERRER_BONUS);
            console.log(`Referrer ${referrerUid} received ${REFERRER_BONUS} bonus.`);
        }

        console.log("User registered:", user);
        showMessage(registerMessage, "Account created successfully! Please log in.", 'success');
        resetBtn();
        showAuthSection('loginFormSection');
        loginEmailInput.value = email;
        loginPasswordInput.focus();
    } catch (error) {
        console.error("Error during registration:", error.message);
        let errorMessage = "Registration failed: " + error.message;
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = "This email is already in use.";
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = "Please enter a valid email address.";
        } else if (error.code === 'auth/weak-password') {
            errorMessage = "Password is too weak. Please use a stronger password.";
        }
        showMessage(registerMessage, errorMessage, 'error');
        resetBtn();
    }
}

// --- User Login ---
export async function handleLogin(event) {
    event.preventDefault(); // Prevent default form submission
    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;
    const btn = event.target;
    const resetBtn = showLoading(btn);
    hideMessage(loginMessage);

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("User logged in:", user);
        showMessage(loginMessage, "Login successful!", 'success');
        resetBtn();
        // UI will be updated by onAuthStateChanged listener in main.js
    } catch (error) {
        console.error("Error during login:", error.message);
        let errorMessage = "Login failed: " + error.message;
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            errorMessage = "Invalid email or password.";
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = "Please enter a valid email address.";
        }
        showMessage(loginMessage, errorMessage, 'error');
        resetBtn();
    }
}

// --- User Logout ---
export async function handleLogout() {
    try {
        await signOut(auth);
        console.log("User signed out");
        // UI will be updated by onAuthStateChanged listener in main.js
    } catch (error) {
        console.error("Error during logout:", error.message);
        alert("Logout failed: " + error.message);
    }
}

// --- Password Reset ---
export async function handlePasswordReset(event) {
    event.preventDefault();
    const email = resetEmailInput.value;
    const btn = event.target;
    const resetBtn = showLoading(btn);
    hideMessage(passwordResetMessage);

    try {
        await sendPasswordResetEmail(auth, email);
        showMessage(passwordResetMessage, `Password reset link sent to ${email}. Check your inbox.`, 'success');
        resetBtn();
    } catch (error) {
        console.error("Error sending password reset email:", error.message);
        let errorMessage = "Failed to send password reset email: " + error.message;
        if (error.code === 'auth/user-not-found') {
            errorMessage = "No user found with that email.";
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = "Please enter a valid email address.";
        }
        showMessage(passwordResetMessage, errorMessage, 'error');
        resetBtn();
    }
}

// Helper to generate referral code - could be in utils.js
function generateReferralCode() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 7);
    return (timestamp + randomStr).toUpperCase();
    }
