import { spawn } from 'child_process';

const logo = `
  ___ __   __ _  _    _    ___  ___  ___ 
 / __|\\ \\ / /| \\| |  /_\\  | _ \\/ __|| __|
 \\__ \\ \\ V / | .  | / _ \\ |  _/\\__ \\| _| 
 |___/  |_|  |_|\\_|/_/ \\_\\|_|  |___/|___|
                                         
`;

console.clear();
console.log('\x1b[36m%s\x1b[0m', logo); // Prints in cyan
console.log('\x1b[32m%s\x1b[0m', '>>> FOCUS MODE ACTIVATED <<<'); // Prints in green
console.log('\x1b[33m%s\x1b[0m', 'Shielding your deep work. Intercepting Slack messages...\n'); // Prints in yellow

// Boot up the main server
const server = spawn('node', ['index.js'], { stdio: 'inherit' });

server.on('close', (code) => {
  console.log(`\nSynapse offline. Welcome back.`);
});
