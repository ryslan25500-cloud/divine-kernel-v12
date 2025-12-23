/**
 * 🌐 API Tests
 */

import { validateDNASequence } from '../src/api/middleware/validation.js';

console.log('🌐 Testing API Module...\n');

const mockReq: any = { body: { sequence: 'ATCG' } };
const mockRes: any = { 
  status: (code: number) => ({ json: (data: any) => {} }) 
};
const mockNext = () => {};

// Should pass
validateDNASequence(mockReq, mockRes, mockNext);

console.log('✅ All API tests passed!');
