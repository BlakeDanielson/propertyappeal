/**
 * Test script for RentCast API integration
 * Run with: npx tsx test-rentcast.ts
 */

import { RentCastService } from './src/external/RentCastService';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testRentCastAPI() {
  console.log('\n🧪 Testing RentCast API Integration\n');
  console.log('='.repeat(60));

  // Check API key
  const apiKey = process.env.RENTCAST_API_KEY;
  if (!apiKey) {
    console.error('❌ RENTCAST_API_KEY not found in .env.local');
    process.exit(1);
  }
  console.log('✅ API Key found:', apiKey.substring(0, 10) + '...');

  // Initialize service
  const rentCastService = new RentCastService(apiKey);

  // Test addresses - using known working address from RentCast docs
  const testAddresses = [
    {
      name: 'RentCast example address (KNOWN WORKING)',
      address: '5500 Grand Lake Dr, San Antonio, TX, 78244'
    },
    {
      name: 'Same address without commas',
      address: '5500 Grand Lake Dr San Antonio TX 78244'
    },
    {
      name: 'Original Claypool address',
      address: '35 Claypool Court, Danville, CA 94526'
    }
  ];

  for (const test of testAddresses) {
    console.log('\n' + '-'.repeat(60));
    console.log(`\n📍 Testing: ${test.name}`);
    console.log(`   Address: "${test.address}"\n`);

    try {
      const property = await rentCastService.getPropertyByAddress(test.address);
      
      console.log('✅ SUCCESS! Property found:');
      console.log('   ID:', property.id);
      console.log('   Address:', property.formattedAddress);
      console.log('   Bedrooms:', property.bedrooms);
      console.log('   Bathrooms:', property.bathrooms);
      console.log('   Square Feet:', property.squareFootage);
      console.log('   Assessed Value:', property.assessedValue ? `$${property.assessedValue.toLocaleString()}` : 'N/A');
      console.log('   Coordinates:', property.latitude, property.longitude);
      
    } catch (error) {
      console.log('❌ FAILED');
      if (error instanceof Error) {
        console.log('   Error:', error.message);
      }
      
      // Log more details for debugging
      if ((error as any).response) {
        console.log('\n   HTTP Status:', (error as any).response?.status);
        console.log('   Response:', JSON.stringify((error as any).response?.data, null, 2));
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('🏁 Test complete!\n');
}

// Run tests
testRentCastAPI().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

