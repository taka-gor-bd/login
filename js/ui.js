// js/ui.js - Handles all UI manipulation
const authPage = document.getElementById('authPage');
const mainAppPage = document.getElementById('mainAppPage');
const loginFormSection = document.getElementById('loginFormSection');
const registerFormSection = document.getElementById('registerFormSection');
const passwordResetSection = document.getElementById('passwordResetSection');

const loginMessage = document.getElementById('loginMessage');
const registerMessage = document.getElementById('registerMessage');
const passwordResetMessage = document.getElementById('passwordResetMessage');
const depositMessage = document.getElementById('depositMessage');
const withdrawMessage = document.getElementById('withdrawMessage');
const plansMessage = document.getElementById('plansMessage');
const buyTokensMessage = document.getElementById('buyTokensMessage'); // Added for buy tokens section

const homeSection = document.getElementById('homeSection');
const depositSection = document.getElementById('depositSection');
const withdrawSection = document.getElementById('withdrawSection');
const plansSection = document.getElementById('plansSection');
const transactionsSection = document.getElementById('transactionsSection');
const bonusSection = document.getElementById('bonusSection'); // New: for bonus info

const bonusPopupOverlay = document.getElementById('bonusPopupOverlay');

// --- Section Toggling ---
export function showAuthSection(sectionId) {
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.add('hidden');
    });
    document.getElementById(sectionId).classList.remove('hidden');

    hideAllMessages(); // Clear messages when switching forms
}

export function showAppSection(sectionId) {
    // Hide all feature sections within mainAppPage (except home which is initially active)
    document.querySelectorAll('.feature-section').forEach(section => {
        section.classList.add('hidden');
    });
    // Hide default home content if not going to homeSection
    if (sectionId !== 'homeSection') {
        document.getElementById('defaultHomeContent').classList.add('hidden');
    } else {
        document.getElementById('defaultHomeContent').classList.remove('hidden');
    }

    // Deactivate all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show the selected section and activate its nav button
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
        document.querySelector(`.nav-btn[onclick*="${sectionId}"]`).classList.add('active');
    }

    // Hide messages when switching app sections
    hideAllMessages();
}

// --- Loading State ---
export function showLoading(button) {
    button.disabled = true;
    const originalText = button.innerHTML;
    button.innerHTML = `<span class="loader"></span>`;
    return () => {
        button.disabled = false;
        button.innerHTML = originalText;
    };
}

// --- Message Display ---
const allMessages = [
    loginMessage, registerMessage, passwordResetMessage,
    depositMessage, withdrawMessage, plansMessage,
    buyTokensMessage
];

export function showMessage(element, text, type) {
    element.textContent = text;
    element.className = `message show ${type}`;
}

export function hideMessage(element) {
    element.className = `message`;
    element.textContent = '';
}

export function hideAllMessages() {
    allMessages.forEach(msg => hideMessage(msg));
}

// --- Popup Functions ---
export function showBonusPopup() {
    bonusPopupOverlay.classList.add('show');
}

export function closeBonusPopup() {
    bonusPopupOverlay.classList.remove('show');
}

// --- Initial UI state setup ---
export function initializeUI() {
    authPage.classList.add('active-section'); // Initially show auth page
    mainAppPage.classList.add('hidden');
    showAuthSection('loginFormSection'); // Start with login form
    showAppSection('defaultHomeContent'); // Make sure default home content is visible on loadHome

    // Attach global functions to window for HTML onclick
    window.showRegisterSection = () => showAuthSection('registerFormSection');
    window.showLoginSection = () => showAuthSection('loginFormSection');
    window.showPasswordReset = () => showAuthSection('passwordResetSection');
    window.showAppSection = showAppSection; // Expose to global scope for nav buttons
    window.closeBonusPopup = closeBonusPopup;
}
