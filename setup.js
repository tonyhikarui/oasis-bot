import { readToken, delay } from "./utils/file.js";
import beddu from "./utils/banner.js";
import { loginFromFile } from "./utils/login.js";
import { createProviders } from "./utils/providers.js";
import { logger } from "./utils/logger.js";
import { createInterface } from 'readline';
import fs from 'fs';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setup() {
  console.log(beddu)
  // Ask for number of providers to create
  const input = await askQuestion('Enter the number of Providers you want to create [1-100] for each account: ');
  const numProv = parseInt(input, 10);

  if (isNaN(numProv) || numProv < 1 || numProv > 100) {
    logger("Invalid input. Please enter a number between 1 and 100.", "", "error");
    rl.close();
    return;
  };

  const accounts = await readToken("accounts.txt");
  if (fs.existsSync('tokens.txt')) {
    const tokens = await readToken("tokens.txt");

    if (accounts.length !== tokens.length) {
      fs.unlinkSync('tokens.txt');
      const isLogin = await loginFromFile('accounts.txt');
      if (!isLogin) {
        logger("No accounts were successfully logged in. Exiting...", "", "error");
        rl.close();
        return;
      }
    }
  }

  const isLogin = await loginFromFile('accounts.txt');
  if (!isLogin) {
    logger("No accounts were successfully logged in. Exiting...", "", "error");
    rl.close();
    return;
  }

  logger(`Creating ${numProv} Providers...`);
  await createProviders(numProv);

  rl.close();
}

setup();
