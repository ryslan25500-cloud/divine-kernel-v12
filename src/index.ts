/**
 * 🚀 DIVINE KERNEL V12 - Main Entry Point
 */

import 'dotenv/config';
import { startServer } from './api/rest/server.js';
import { log } from './utils/logger.js';

async function main() {
  try {
    log.info('🧬 Divine Kernel V12 starting...');
    
    const port = parseInt(process.env.PORT || '3000');
    
    await startServer({ port });
    
    log.info('✅ Divine Kernel V12 ready!');
  } catch (error) {
    log.error(`Failed to start server: ${error}`);
    process.exit(1);
  }
}

main();
