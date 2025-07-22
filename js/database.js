// js/database.js - Handles all Firebase Realtime Database interactions
import { database } from './firebase-config.js';
import { ref, get, set, runTransaction, push, update } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { WELCOME_BONUS, REFERRAL_BONUS, TOKEN_PRICE_BDT } from './firebase-config.js'; // Import constants
import { showMessage } from './ui.js';

// --- User Data Management ---
export async function getUserData(uid, path = '') {
    const userRef = ref(database, 'users/' + uid + '/' + path);
    const snapshot = await get(userRef);
    return snapshot;
}

export async function createNewUserEntry(uid, name, email, referralCode, referredByUid = null) {
    const userRef = ref(database, 'users/' + uid);
    const newUserBalance = WELCOME_BONUS + (referredByUid ? REFERRAL_BONUS : 0);

    await set(userRef, {
        name: name || email, // Use email if name is not provided
        email: email,
        balance: newUserBalance,
        referralCode: referralCode,
        referredBy: referredByUid,
        hasReceivedWelcomeBonus: true, // Mark as received after initial entry
        createdAt: Date.now() // Timestamp of creation
    });

    // Map the generated referral code to the user's UID for quick lookup
    await set(ref(database, 'referralCodes/' + referralCode), uid);
    console.log("New user entry created in DB for", uid);
}

// --- Balance Operations ---
export async function updateBalance(uid, amount, transactionType, details = {}) {
    const userBalanceRef = ref(database, 'users/' + uid + '/balance');
    const transactionsRef = ref(database, 'users/' + uid + '/transactions');

    let newBalance = 0;
    try {
        const result = await runTransaction(userBalanceRef, (currentBalance) => {
            newBalance = (currentBalance || 0) + amount;
            // Prevent negative balance unless it's a specific withdrawal/purchase
            if (newBalance < 0 && (transactionType === 'withdraw' || transactionType === 'plan-buy' || transactionType === 'token-buy')) {
                // Return undefined to abort transaction if balance goes negative
                // This will be handled by the calling function's error logic.
                return;
            }
            return newBalance;
        });

        if (result.committed) {
            // Record the transaction
            await push(transactionsRef, {
                type: transactionType, // e.g., 'deposit', 'withdraw', 'bonus', 'referral_bonus', 'plan-buy', 'token-buy'
                amount: amount,
                newBalance: newBalance,
                timestamp: Date.now(),
                status: 'completed', // You might add 'pending' for withdraw/deposit
                ...details // Extra details like planId, tokenCount, method, accountNumber
            });
            console.log(`Balance for ${uid} updated by ${amount}. New balance: ${newBalance}`);
            return true; // Success
        } else {
            console.log("Transaction aborted for balance update.");
            return false; // Aborted
        }
    } catch (error) {
        console.error(`Error updating balance for ${uid}:`, error);
        return false; // Error
    }
}

export async function fetchAndDisplayUserBalanceAndReferralCode(uid) {
    const userData = await getUserData(uid);
    const userBalanceSpan = document.getElementById('userBalance');
    const referralCodeDisplay = document.getElementById('referralCodeDisplay');

    if (userData.exists()) {
        const data = userData.val();
        userBalanceSpan.textContent = `${(data.balance || 0).toFixed(2)}`;
        referralCodeDisplay.textContent = data.referralCode || "Generating...";
    } else {
        userBalanceSpan.textContent = `0.00`;
        referralCodeDisplay.textContent = "Not available";
    }
}

export async function fetchTransactions(uid) {
    const transactionsRef = ref(database, 'users/' + uid + '/transactions');
    const snapshot = await get(transactionsRef);
    if (snapshot.exists()) {
        const transactions = snapshot.val();
        // Convert object of transactions to an array and sort by timestamp
        return Object.keys(transactions).map(key => ({ id: key, ...transactions[key] }))
            .sort((a, b) => b.timestamp - a.timestamp); // Sort descending by time
    }
    return [];
}

// --- Plans Management (Example Static Plans for now) ---
// In a real app, these would come from the database and potentially be managed by an admin.
const examplePlans = [
    { id: "basic", name: "Basic Plan", price: 100, duration: "30 days", benefits: "Access to basic content" },
    { id: "premium", name: "Premium Plan", price: 500, duration: "90 days", benefits: "All content, faster support" },
    { id: "vip", name: "VIP Plan", price: 1000, duration: "180 days", benefits: "Exclusive content, priority support" }
];

export async function getAvailablePlans() {
    // In a real app, you would fetch these from a 'plans' node in your database:
    // const plansRef = ref(database, 'plans');
    // const snapshot = await get(plansRef);
    // return snapshot.exists() ? Object.values(snapshot.val()) : [];
    // For now, return static example plans
    return examplePlans;
}

export async function buyPlan(uid, planId, planPrice) {
    const planRef = ref(database, 'users/' + uid + '/plans/' + planId);
    const userBalanceRef = ref(database, 'users/' + uid + '/balance');
    const transactionsRef = ref(database, 'users/' + uid + '/transactions');

    try {
        let transactionSuccess = false;
        await runTransaction(userBalanceRef, (currentBalance) => {
            const availableBalance = currentBalance || 0;
            if (availableBalance < planPrice) {
                showMessage(document.getElementById('plansMessage'), `Insufficient balance for ${planId}. You need ${planPrice} BDT.`, 'error');
                return; // Abort transaction
            }
            transactionSuccess = true;
            return availableBalance - planPrice;
        });

        if (transactionSuccess) {
            // Update user's active plans
            await update(planRef, {
                purchasedAt: Date.now(),
                expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000), // Example: 30 days from now
                status: 'active'
            });

            // Record transaction
            await push(transactionsRef, {
                type: 'plan-buy',
                planId: planId,
                amount: -planPrice, // Negative amount for deduction
                timestamp: Date.now(),
                status: 'completed'
            });
            console.log(`User ${uid} bought plan ${planId}`);
            return true;
        }
        return false;
    } catch (error) {
        console.error(`Error buying plan ${planId}:`, error);
        showMessage(document.getElementById('plansMessage'), `Failed to buy plan: ${error.message}`, 'error');
        return false;
    }
      }
