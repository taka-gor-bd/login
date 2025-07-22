// js/main.js - Main application logic and event listeners
import { auth } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    handleLogin,
    handleRegister,
    handleLogout,
    handlePasswordReset
} from './auth.js';
import {
    getUserData,
    fetchAndDisplayUserBalanceAndReferralCode,
    updateBalance,
    fetchTransactions,
    getAvailablePlans,
    buyPlan
} from './database.js';
import {
    initializeUI,
    showAuthSection,
    showAppSection,
    showLoading,
    showMessage,
    hideMessage,
    showBonusPopup
} from './ui.js';
import { TOKEN_PRICE_BDT, WELCOME_BONUS } from './firebase-config.js'; // Import WELCOME_BONUS


// --- DOM Elements ---
const authPage = document.getElementById('authPage');
const mainAppPage = document.getElementById('mainAppPage');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const passwordResetForm = document.getElementById('passwordResetForm');
const userNameSpan = document.getElementById('userName');

const depositForm = document.getElementById('depositForm');
const depositAmountInput = document.getElementById('depositAmount');
const depositMessage = document.getElementById('depositMessage');

const withdrawForm = document.getElementById('withdrawForm');
const withdrawAmountInput = document.getElementById('withdrawAmount');
const withdrawMethodInput = document.getElementById('withdrawMethod');
const withdrawAccountInput = document.getElementById('withdrawAccount');
const withdrawMessage = document.getElementById('withdrawMessage');

const plansListDiv = document.getElementById('plansList');
const plansMessage = document.getElementById('plansMessage');

const transactionsListDiv = document.getElementById('transactionsList');

const buyTokensForm = document.getElementById('buyTokensForm'); // Added for buy tokens section
const tokenAmountInput = document.getElementById('tokenAmount'); // Added
const buyTokensMessage = document.getElementById('buyTokensMessage'); // Added
const buyTokenBtn = document.getElementById('buyTokenBtn'); // Added

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', initializeUI);

loginForm.addEventListener('submit', handleLogin);
registerForm.addEventListener('submit', handleRegister);
passwordResetForm.addEventListener('submit', handlePasswordReset);
document.getElementById('logoutBtn').addEventListener('click', handleLogout);

// Deposit Form Submission
depositForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = parseFloat(depositAmountInput.value);
    hideMessage(depositMessage);

    if (isNaN(amount) || amount <= 0) {
        showMessage(depositMessage, "Please enter a valid amount (1 or more).", 'error');
        return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
        showMessage(depositMessage, "You must be logged in to deposit.", 'error');
        return;
    }

    const btn = e.target.querySelector('button[type="submit"]'); // Get the specific submit button
    const resetBtn = showLoading(btn);

    try {
        const success = await updateBalance(currentUser.uid, amount, 'deposit', { depositMethod: 'Online' }); // Add more details
        if (success) {
            showMessage(depositMessage, `Successfully deposited ${amount.toFixed(2)} BDT!`, 'success');
            depositAmountInput.value = '';
            await fetchAndDisplayUserBalanceAndReferralCode(currentUser.uid); // Update balance display
        } else {
            showMessage(depositMessage, "Failed to deposit. Please try again.", 'error');
        }
    } catch (error) {
        console.error("Error during deposit:", error);
        showMessage(depositMessage, "An unexpected error occurred during deposit.", 'error');
    } finally {
        resetBtn();
    }
});

// Withdraw Form Submission
withdrawForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmountInput.value);
    const method = withdrawMethodInput.value.trim();
    const accountNumber = withdrawAccountInput.value.trim();
    hideMessage(withdrawMessage);

    if (isNaN(amount) || amount <= 0) {
        showMessage(withdrawMessage, "Please enter a valid amount (1 or more).", 'error');
        return;
    }
    if (!method || !accountNumber) {
        showMessage(withdrawMessage, "Please fill in payment method and account number.", 'error');
        return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
        showMessage(withdrawMessage, "You must be logged in to withdraw.", 'error');
        return;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    const resetBtn = showLoading(btn);

    try {
        const success = await updateBalance(currentUser.uid, -amount, 'withdraw', { method, accountNumber });
        if (success) {
            showMessage(withdrawMessage, `Withdrawal request for ${amount.toFixed(2)} BDT sent!`, 'success');
            withdrawAmountInput.value = '';
            withdrawMethodInput.value = '';
            withdrawAccountInput.value = '';
            await fetchAndDisplayUserBalanceAndReferralCode(currentUser.uid); // Update balance display
        } else {
            showMessage(withdrawMessage, "Withdrawal failed. Insufficient balance or an error occurred.", 'error');
        }
    } catch (error) {
        console.error("Error during withdrawal:", error);
        showMessage(withdrawMessage, "An unexpected error occurred during withdrawal.", 'error');
    } finally {
        resetBtn();
    }
});

// Buy Tokens Form Submission (from previous implementation)
buyTokensForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const tokensToBuy = parseInt(tokenAmountInput.value);
    hideMessage(buyTokensMessage);

    if (isNaN(tokensToBuy) || tokensToBuy <= 0) {
        showMessage(buyTokensMessage, "Please enter a valid number of tokens (1 or more).", 'error');
        return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
        showMessage(buyTokensMessage, "You must be logged in to buy tokens.", 'error');
        return;
    }

    const cost = tokensToBuy * TOKEN_PRICE_BDT;
    const btn = e.target.querySelector('button[type="submit"]');
    const resetBtn = showLoading(btn);

    try {
        const success = await updateBalance(currentUser.uid, -cost, 'token-buy', { tokens: tokensToBuy, cost: cost });
        if (success) {
            showMessage(buyTokensMessage, `Successfully bought ${tokensToBuy} tokens for ${cost} BDT!`, 'success');
            tokenAmountInput.value = '';
            await fetchAndDisplayUserBalanceAndReferralCode(currentUser.uid); // Update displayed balance
        } else {
            showMessage(buyTokensMessage, "Failed to buy tokens. Insufficient balance or an error occurred.", 'error');
        }
    } catch (error) {
        console.error("Error buying tokens:", error);
        showMessage(buyTokensMessage, "An unexpected error occurred during token purchase.", 'error');
    } finally {
        resetBtn();
    }
});


// --- Dynamic Content Loading for App Sections ---
async function loadTransactions(uid) {
    const transactions = await fetchTransactions(uid);
    transactionsListDiv.innerHTML = ''; // Clear previous list
    if (transactions.length === 0) {
        transactionsListDiv.innerHTML = '<p class="hint-text">No transactions yet.</p>';
        return;
    }
    transactions.forEach(tx => {
        const item = document.createElement('div');
        item.className = `transaction-item ${tx.type}`; // Add type class for styling
        const date = new Date(tx.timestamp).toLocaleString();
        let details = `Type: ${tx.type}`;
        if (tx.amount) details += `, Amount: ${tx.amount.toFixed(2)} BDT`;
        if (tx.newBalance !== undefined) details += `, New Balance: ${tx.newBalance.toFixed(2)} BDT`;
        if (tx.method) details += `, Method: ${tx.method}`;
        if (tx.accountNumber) details += `, Acc: ${tx.accountNumber}`;
        if (tx.planId) details += `, Plan: ${tx.planId}`;
        if (tx.tokens) details += `, Tokens: ${tx.tokens}`;

        item.innerHTML = `<strong>${date}</strong>: ${details}`;
        transactionsListDiv.appendChild(item);
    });
}

async function loadPlans(uid) {
    const plans = await getAvailablePlans(); // Get static plans for now
    plansListDiv.innerHTML = ''; // Clear previous list
    if (plans.length === 0) {
        plansListDiv.innerHTML = '<p class="hint-text">No plans available.</p>';
        return;
    }

    plans.forEach(plan => {
        const planItem = document.createElement('div');
        planItem.className = 'plan-item';
        planItem.innerHTML = `
            <h4>${plan.name}</h4>
            <p>Price: ${plan.price} BDT</p>
            <p>Duration: ${plan.duration}</p>
            <p>Benefits: ${plan.benefits}</p>
            <button class="btn buy-plan-btn" data-plan-id="${plan.id}" data-plan-price="${plan.price}">Buy Now</button>
        `;
        plansListDiv.appendChild(planItem);
    });

    // Add event listeners to "Buy Now" buttons
    document.querySelectorAll('.buy-plan-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const planId = e.target.dataset.planId;
            const planPrice = parseFloat(e.target.dataset.planPrice);
            const currentUser = auth.currentUser;
            if (!currentUser) {
                showMessage(plansMessage, "You must be logged in to buy a plan.", 'error');
                return;
            }

            const btn = e.target;
            const resetBtn = showLoading(btn);
            hideMessage(plansMessage);

            try {
                const success = await buyPlan(currentUser.uid, planId, planPrice);
                if (success) {
                    showMessage(plansMessage, `Successfully bought ${planId} plan!`, 'success');
                    await fetchAndDisplayUserBalanceAndReferralCode(currentUser.uid); // Update balance
                } else {
                    // Message already shown by buyPlan if insufficient balance
                    if (!plansMessage.classList.contains('show')) { // Avoid double message
                         showMessage(plansMessage, "Failed to buy plan. Please try again.", 'error');
                    }
                }
            } catch (error) {
                console.error("Error buying plan:", error);
                showMessage(plansMessage, "An unexpected error occurred while buying plan.", 'error');
            } finally {
                resetBtn();
            }
        });
    });
}


// --- Authentication State Change Listener (Centralized) ---
onAuthStateChanged(auth, async (user) => {
    const authPageDiv = document.getElementById('authPage');
    const mainAppPageDiv = document.getElementById('mainAppPage');
    const userNameSpan = document.getElementById('userName');

    if (user) {
        // User is signed in
        authPageDiv.classList.add('hidden');
        mainAppPageDiv.classList.remove('hidden');
        userNameSpan.textContent = user.displayName || user.email;

        await fetchAndDisplayUserBalanceAndReferralCode(user.uid); // Fetch initial balance & referral code

        // Check for welcome bonus (only if user just registered and hasn't received it)
        const userDataSnapshot = await getUserData(user.uid);
        if (userDataSnapshot.exists()) {
            const userData = userDataSnapshot.val();
            if (!userData.hasReceivedWelcomeBonus) {
                // This logic is mostly handled by createNewUserEntry, but ensures state is correct
                // and shows popup on first login if bonus was just applied.
                // updateBalance(user.uid, WELCOME_BONUS, 'welcome_bonus'); // Already added in createNewUserEntry
                await update(userDataSnapshot.ref, { hasReceivedWelcomeBonus: true });
                showBonusPopup();
            }
        }

        // Load content for active section (e.g., if user refreshes on deposit page)
        // For simplicity, always go to home section on login
        showAppSection('homeSection');
        // You would load other sections' data here if they were the default view
        // For example, if depositSection was the default:
        // showAppSection('depositSection');
    } else {
        // User is signed out
        authPageDiv.classList.remove('hidden');
        mainAppPageDiv.classList.add('hidden');

        // Clear forms and messages on logout
        document.getElementById('loginForm').reset();
        document.getElementById('registerForm').reset();
        document.getElementById('passwordResetForm').reset();
        document.getElementById('depositForm').reset();
        document.getElementById('withdrawForm').reset();
        document.getElementById('buyTokensForm').reset();
        hideAllMessages();
        showAuthSection('loginFormSection'); // Always show login form after logout
        closeBonusPopup(); // Hide popup on logout

        // Reset display values
        document.getElementById('userBalance').textContent = '0.00';
        document.getElementById('referralCodeDisplay').textContent = 'Loading...';
        document.getElementById('transactionsList').innerHTML = '<p class="hint-text">No transactions yet.</p>';
        document.getElementById('plansList').innerHTML = '<p class="hint-text">Loading plans...</p>';
    }
});

// Attach specific content loading functions to their respective navigation events
document.querySelector('.nav-btn[onclick*="transactionsSection"]').addEventListener('click', () => {
    if (auth.currentUser) loadTransactions(auth.currentUser.uid);
});
document.querySelector('.nav-btn[onclick*="plansSection"]').addEventListener('click', () => {
    if (auth.currentUser) loadPlans(auth.currentUser.uid);
});

// Initial load for plans section (e.g. if it was default section on home)
// If you want to load plans on initial login to homepage, call loadPlans here:
// if (auth.currentUser) loadPlans(auth.currentUser.uid);
