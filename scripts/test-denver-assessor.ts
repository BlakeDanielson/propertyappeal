#!/usr/bin/env tsx
/**
 * Test script for Denver Assessor API integration
 * 
 * Usage:
 *   npx tsx scripts/test-denver-assessor.ts "3319 w moncrieff pl"
 *   npx tsx scripts/test-denver-assessor.ts "0229227041000"  # Direct property ID
 *   
 *   Or use the npm script:
 *   npm run test:denver "3319 w moncrieff pl"
 */

import { DenverAssessorService } from '../src/external/DenverAssessorService';

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: tsx scripts/test-denver-assessor.ts <address|propertyId>');
    console.log('\nExamples:');
    console.log('  tsx scripts/test-denver-assessor.ts "3319 w moncrieff pl"');
    console.log('  tsx scripts/test-denver-assessor.ts "0229227041000"');
    process.exit(1);
  }

  const query = args[0];
  const service = new DenverAssessorService();

  try {
    // Check if query is a property ID (13 digits)
    if (/^\d{13}$/.test(query)) {
      console.log(`\n🔍 Fetching property record for ID: ${query}\n`);
      const property = await service.getPropertyRecord(query);
      console.log('✅ Property Record Retrieved:');
      console.log(JSON.stringify(property, null, 2));
    } else {
      // Search by address
      console.log(`\n🔍 Searching for address: "${query}"\n`);
      
      // Step 1: Get suggestions
      console.log('Step 1: Getting address suggestions...');
      const suggestions = await service.getAddressSuggestions(query);
      console.log(`Found ${suggestions.length} suggestions:`);
      suggestions.forEach((suggestion, index) => {
        console.log(`  ${index + 1}. ${suggestion.text} (${suggestion.type})`);
        if (suggestion.propertyId) {
          console.log(`     Property ID: ${suggestion.propertyId}`);
        }
        if (suggestion.url) {
          console.log(`     URL: ${suggestion.url}`);
        }
      });

      // Step 2: Extract property ID
      console.log('\nStep 2: Extracting property ID...');
      const propertyId = await service.searchPropertyId(query);
      
      if (!propertyId) {
        console.log('❌ No property ID found for this address');
        process.exit(1);
      }

      console.log(`✅ Found property ID: ${propertyId}`);
      const scheduleNumber = service.propertyIdToScheduleNumber(propertyId);
      console.log(`   Schedule Number: ${scheduleNumber}`);

      // Step 3: Get full property record
      console.log('\nStep 3: Fetching complete property record...');
      const property = await service.getPropertyRecord(propertyId);
      
      console.log('\n✅ Property Record Retrieved:');
      console.log('=' .repeat(60));
      console.log(`Schedule Number: ${property.scheduleNumber || propertyId}`);
      console.log(`Property ID: ${property.propertyId || propertyId}`);
      console.log(`Address: ${property.address?.situs || property.keyInformation?.situsAddress || 'N/A'}`);
      console.log(`Owner: ${property.owner?.name || property.keyInformation?.owner || 'N/A'}`);
      if (property.actualValues?.total) {
        console.log(`Total Appraised Value: $${property.actualValues.total.toLocaleString()}`);
        console.log(`  - Land: $${property.actualValues.land?.toLocaleString() || '0'}`);
        console.log(`  - Improvements: $${property.actualValues.improvements?.toLocaleString() || '0'}`);
      } else {
        console.log(`Total Appraised Value: N/A (check API response)`);
      }
      
      if (property.buildingDetails) {
        console.log(`\nBuilding Details:`);
        console.log(`  Year Built: ${property.buildingDetails.yearBuilt}`);
        console.log(`  Square Footage: ${property.buildingDetails.totalLivingArea} sqft`);
        console.log(`  Bedrooms: ${property.buildingDetails.fullBathrooms} full, ${property.buildingDetails.halfBathrooms} half`);
        console.log(`  Style: ${property.buildingDetails.style}`);
        console.log(`  Condition: ${property.buildingDetails.condition}`);
      }

      if (property.keyInformation) {
        console.log(`\nKey Information:`);
        console.log(`  Class: ${property.keyInformation.class}`);
        console.log(`  Land Use Code: ${property.keyInformation.landUseCode}`);
        console.log(`  Zoning: ${property.keyInformation.zoning}`);
        console.log(`  Land Sq Ft: ${property.keyInformation.landSqFt?.toLocaleString()}`);
        console.log(`  Building Sq Ft: ${property.keyInformation.buildingSqFt?.toLocaleString()}`);
      }

      if (property.saleDetails && property.saleDetails.length > 0) {
        console.log(`\nSale History:`);
        property.saleDetails.forEach((sale, index) => {
          console.log(`  ${index + 1}. ${sale.saleDate}: $${sale.salePrice.toLocaleString()} (${sale.instrument})`);
        });
      }

      // Optionally output full JSON
      if (args.includes('--json') || args.includes('-j')) {
        console.log('\n' + '='.repeat(60));
        console.log('Full JSON:');
        console.log(JSON.stringify(property, null, 2));
      }
    }
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

main();

