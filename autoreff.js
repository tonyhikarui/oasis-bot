import Mailjs from "@cemalgnlts/mailjs";
import axios from "axios";
import fs from 'fs';
import { HttpsProxyAgent } from 'https-proxy-agent';
import readline from "readline/promises";
import { delay } from "./utils/file.js";
import { logger } from "./utils/logger.js";
import { showBanner } from "./utils/banner.js";


const mailjs = new Mailjs();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function extractCodeFromEmail(text) {
    // Look for verification code in different formats
    const patterns = [
        /code=([A-Za-z0-9]+)/i,
        /verification code:\s*([A-Za-z0-9]+)/i,
        /verification link:.*?([A-Za-z0-9]{6,})/i
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            console.log('Found verification code:', match[1]); // Debug log
            return match[1];
        }
    }
    
    // If no code found, log the email content for debugging
    console.log('Email content:', text);
    return null;
}

function readProxies(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return reject(err);
        const proxies = data.split('\n').map(proxy => proxy.trim()).filter(proxy => proxy);
        resolve(proxies);
        });
    });
}

async function verifyEmail(code, proxy) {
    const proxyAgent = new HttpsProxyAgent(proxy);
    const url = "https://api.oasis.ai/internal/auth/verify-email";
    const payload = {
        token: code
    };

    try {
        const response = await axios.post(url, payload, {
            headers: { 
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
            httpsAgent: proxyAgent,
            validateStatus: false
        });

        // Debug log
        console.log('Verification Response:', {
            status: response.status,
            data: response.data
        });

        if (response.status === 200) {
            return response.data;
        } else {
            logger(
                "Error verifying email:",
                JSON.stringify(response.data, null, 2),
                'error'
            );
            return null;
        }
    } catch (error) {
        logger(
            "Error verifying email:",
            error.response ? JSON.stringify(error.response.data, null, 2) : error.message,
            'error'
        );
        return null;
    }
}

// Check for new emails 
async function checkForNewEmails(proxy, maxRetries = 3) {
    let retryCount = 0;
    try {
        const emailData = await mailjs.getMessages();
        const emails = emailData.data;

        for (const email of emails) {
            if (!email.subject.toLowerCase().includes('verification')) {
                continue;
            }

            logger("Processing verification email:", email.subject);
            const msgId = email.id;

            const emailMessage = await mailjs.getMessage(msgId);
            const textContent = emailMessage.data.text || emailMessage.data.html;

            if (textContent) {
                const verificationCode = extractCodeFromEmail(textContent);
                if (verificationCode) {
                    await delay(2000);
                    const verifyResult = await verifyEmail(verificationCode, proxy);
                    
                    if (verifyResult) {
                        logger("Email successfully verified", '', 'success');
                        await mailjs.deleteMessage(msgId);
                        return true;
                    }

                    // Handle verification failure
                    retryCount++;
                    if (retryCount >= maxRetries) {
                        logger(`Verification failed after ${maxRetries} attempts`, '', 'error');
                        await mailjs.deleteMessage(msgId);
                        return false;
                    }
                    
                    logger(`Verification attempt ${retryCount}/${maxRetries} failed, retrying...`, '', 'warn');
                    await delay(5000); // Wait before retry
                    continue;
                }
            }

            await mailjs.deleteMessage(msgId);
        }
        return false;
    } catch (error) {
        if (error.message === 'fetch failed') {
            logger("Temporary connection error, retrying...", '', 'warn');
            await delay(5000);
            return false;
        }
        logger("Error checking new emails:", error, 'error');
        return false;
    }
}

// Send signup request
async function sendSignupRequest(email, password, proxy, referralCode) {
    const proxyAgent = new HttpsProxyAgent(proxy);
    const url = "https://api.oasis.ai/internal/auth/signup";
    
    // Simplify payload structure
    const payload = {
        email: email,
        password: password,
        referralCode: referralCode
    };

    try {
        const response = await axios.post(url, payload, {
            headers: { 
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
            httpsAgent: proxyAgent,
            validateStatus: false // Allow any status code
        });

        // More detailed debug log
        console.log('Signup Response:', {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            data: response.data
        });

        // Handle 200 status with empty data as success
        if (response.status === 200) {
            logger(`Signup successful for ${email}`, '', 'success');
            return { 
                email, 
                status: "success", 
                data: response.data || { message: "Signup successful" } 
            };
        }

        // Handle error cases
        const errorMessage = response.data?.error || 
                           response.data?.message || 
                           response.statusText || 
                           'Unknown error';
        logger(`Signup failed for ${email}: ${errorMessage}`, '', 'error');
        
        return (response.status === 404 || response.status === 429 || response.status >= 500) 
            ? null  // retryable error
            : false; // non-retryable error
    } catch (error) {
        const errorMessage = error.response?.data?.error || 
                           error.response?.data?.message || 
                           error.message;
        logger(`Network error during signup for ${email}: ${errorMessage}`, '', 'error');
        console.log('Full error:', error.response?.data);
        return null; // Return null to allow retry
    }
}

async function saveAccountToFile(email, password) {
    const account = `${email}|${password}\n`;
    try {
        fs.appendFileSync("accountsReff.txt", account);
        logger(`Account saved successfully: ${email}`, '', 'success');
    } catch (error) {
        logger("Error saving account:", error, 'error');
        // Retry once if failed
        try {
            await delay(1000);
            fs.appendFileSync("accountsReff.txt", account);
            logger(`Account saved successfully on retry: ${email}`, '', 'success');
        } catch (retryError) {
            logger("Failed to save account even after retry:", retryError, 'error');
        }
    }
}

// Main process 
async function main() {
    try {
        showBanner()
        const proxies = await readProxies('proxy.txt');
        if (proxies.length === 0) {
            throw new Error('No proxies available in proxy.txt');
        }
        const referralCode = "4a816317d91f63c7";// await rl.question("Enter Your Referral code: ");
        const numAccounts = await rl.question("How many accounts do you want to create: ");
        const totalAccounts = parseInt(numAccounts);
        if (isNaN(totalAccounts) || totalAccounts <= 0) {
            logger("Please enter a valid number of accounts.", '', 'warn');
            return;
        }

        logger(`Starting task creation - Total accounts to create: ${totalAccounts}`, '', 'info');

        for (let i = 1; i <= totalAccounts; i++) {
            logger(`Task Progress: [${i}/${totalAccounts}]`, '', 'info');
            const proxy = proxies[i % proxies.length];
            logger(`Creating account ${i} of ${totalAccounts}...`);

            try {
                const account = await mailjs.createOneAccount();

                if (!account.status || !account.data) {
                    logger(`Error creating account ${i}:`, account.error || "Rate Limited, Recreating in 5 second...", 'error');
                    i--; 
                    await delay(5000);
                    continue;
                }

                const username = account.data.username;
                const password = account.data.password;
                logger(`Account ${i} created:`, username);

                mailjs.on("open", () => logger(`Awaiting verification email for account ${i}...`));
                
                let isSignup = await sendSignupRequest(username, password, proxy, referralCode);
                let retryCount = 0;
                while (!isSignup && retryCount < 3) { // Add retry limit
                    if (isSignup === false) { // Non-retryable error
                        break;
                    }
                    retryCount++;
                    logger(`Retrying signup (${retryCount}/3)...`, '', 'warn');
                    await delay(5000 * retryCount); // Increasing delay between retries
                    isSignup = await sendSignupRequest(username, password, proxy, referralCode);
                }

                let isEmailVerified = false;
                let verificationAttempts = 0;
                const maxVerificationAttempts = 5; // Maximum number of verification attempts

                while (!isEmailVerified && verificationAttempts < maxVerificationAttempts) {
                    isEmailVerified = await checkForNewEmails(proxy);
                    if (!isEmailVerified) {
                        verificationAttempts++;
                        if (verificationAttempts >= maxVerificationAttempts) {
                            logger(`Failed to verify email after ${maxVerificationAttempts} attempts, skipping account`, '', 'error');
                            break;
                        }
                        await delay(5000);
                    }
                }

                // Save account immediately after verification
                if (isEmailVerified) {
                    logger(`Account ${i} verified successfully, saving to file...`, '', 'success');
                    await saveAccountToFile(username, password);
                }

                // Remove the arrive event listener since we already saved the account
                // mailjs.on("arrive", () => onNewMessageReceived(i, username, password, proxy));
                await delay(5000);
            } catch (error) {
                logger(`Error during account creation ${i}:`, error, 'error');
            }
        }

        logger(`Task completed! Created ${totalAccounts} accounts`, '', 'success');
        rl.close();
    } catch (error) {
        logger("Error:", error.message || error, 'error');
        rl.close();
    }
}

main();
