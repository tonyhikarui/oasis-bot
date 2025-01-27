import axios from 'axios';
import { readAccounts, saveToken } from './file.js';
import { logger } from './logger.js';

// Function to register user
async function registerUser(email, password) {
    const url = 'https://api.oasis.ai/internal/auth/signup';
    const payload = {
        email: email,
        password: password,
        referralCode: "zlketh"
    }
    const headers = {
        'Content-Type': 'application/json',
    };

    try {
        const response = await axios.post(url, payload, { headers });
        if (response.data) {
            logger('register successful:', email);
            logger('Check Your inbox for verification email');
            return true;
        }
    } catch (error) {
        logger(`register error for ${email}:`, error.response ? error.response.data[0] : error.response.statusText, 'error');
        return null;
    }
}
// Function to login a user
async function loginUser(email, password) {
    const url = 'https://api.oasis.ai/internal/auth/login';
    const payload = {
        email,
        password,
        rememberSession: true
    }

    const headers = {
        'Content-Type': 'application/json',
    };

    try {
        const response = await axios.post(url, payload, { headers });
        logger('Login successful:', email);
        return response.data.token;
    } catch (error) {
        logger(`Login error for ${email}:`, error.response ? error.response.data[0] : error.response.statusText, 'error');
        logger('Please Check Your inbox to verification your email', email, 'error');
        return null;
    }
}

// Main function
export async function loginFromFile(filePath) {
    try {
        const accounts = await readAccounts(filePath);
        let successCount = 0;

        logger(`Trying to login and get token to all accounts...`)
        for (const account of accounts) {
            logger(`Attempting login for ${account.email}`);
            const token = await loginUser(account.email, account.password);
            if (token) {
                saveToken('tokens.txt', token);
                successCount++;
            } else {
                logger(`Attempting Register for ${account.email}`);
                await registerUser(account.email, account.password);
            }
        }

        if (successCount > 0) {
            logger(`${successCount}/${accounts.length} accounts successfully logged in.`);
            return true;
        } else {
            logger("All accounts failed to log in.", "", "error");
            return false;
        }
    } catch (error) {
        logger("Error reading accounts or processing logins:", error, "error");
        return false;
    }
}