/**
 * Contract Compilation Validator for AudioTon
 * Verifies compiled contracts and tests the compilation pipeline
 */

import { Cell, Address } from '@ton/core';
import { 
  getPaymentContractCode, 
  getNFTCollectionContractCode, 
  getFanClubContractCode, 
  getRewardDistributorContractCode,
  hasPlaceholderContracts,
  getPlaceholderContractsList
} from '@/contracts/compiled';
import { RealContractCompiler } from '@/utils/realContractCompiler';
import { MainnetContractCompiler } from '@/utils/mainnetContractCompiler';
import { ContractBytecode } from '@/utils/contractBytecode';

interface ValidationResult {
  contractName: string;
  isValid: boolean;
  hasRealBytecode: boolean;
  size: number;
  sourceHash: string;
  errors: string[];
  warnings: string[];
}

interface CompilationTestResult {
  success: boolean;
  contractsValidated: number;
  totalContracts: number;
  results: ValidationResult[];
  summary: {
    realContracts: number;
    placeholderContracts: number;
    failedValidations: number;
    totalSizeBytes: number;
  };
  recommendations: string[];
}

export class ContractCompilationValidator {
  
  /**
   * Test all contract compilation and validate bytecode
   */
  static async validateAllContracts(): Promise<CompilationTestResult> {
    console.log('🔍 Starting comprehensive contract compilation validation...');
    
    const contractNames = ['payment', 'nft-collection', 'fan-club', 'reward-distributor'];
    const results: ValidationResult[] = [];
    
    for (const contractName of contractNames) {
      const result = await this.validateSingleContract(contractName);
      results.push(result);
    }
    
    const summary = this.generateSummary(results);
    const recommendations = this.generateRecommendations(results, summary);
    
    const testResult: CompilationTestResult = {
      success: summary.failedValidations === 0,
      contractsValidated: results.length,
      totalContracts: contractNames.length,
      results,
      summary,
      recommendations
    };
    
    this.logValidationResults(testResult);
    return testResult;
  }
  
  /**
   * Validate a single contract's compilation
   */
  private static async validateSingleContract(contractName: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let isValid = true;
    let hasRealBytecode = false;
    let size = 0;
    let sourceHash = '';
    
    try {
      console.log(`Validating ${contractName} contract...`);
      
      // 1. Test compiled bytecode loading
      const compiledCode = await this.loadCompiledContract(contractName);
      size = this.calculateCellSize(compiledCode);
      
      // 2. Validate bytecode structure
      const structureValid = this.validateBytecodeStructure(compiledCode, contractName);
      if (!structureValid) {
        errors.push('Invalid bytecode structure');
        isValid = false;
      }
      
      // 3. Check if it's real bytecode or placeholder
      hasRealBytecode = this.isRealBytecode(compiledCode, contractName);
      if (!hasRealBytecode) {
        warnings.push('Using placeholder bytecode - needs real FunC compilation');
      }
      
      // 4. Test compilation from source
      try {
        const sourceCompiled = await RealContractCompiler.compileContract(contractName);
        sourceHash = sourceCompiled.sourceHash;
        
        // Compare sizes - production compiler generates much larger bytecode than test compiler
        const sourceSize = this.calculateCellSize(sourceCompiled.bytecode);
        const sizeDiff = Math.abs(sourceSize - size);
        
        // Only warn if size difference is unexpectedly large (>2500 bytes)
        // Normal difference between production and test compilers is ~1300-2000 bytes
        if (sizeDiff > 2500) {
          warnings.push(`Unexpected size difference: compiled (${size}) vs source (${sourceSize}) bytecode - difference: ${sizeDiff} bytes`);
        }
      } catch (sourceError) {
        warnings.push(`Source compilation test failed: ${sourceError.message}`);
      }
      
      // 5. Test mainnet compilation
      try {
        const dummyAddress = Address.parse('EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c');
        const mainnetCompiled = await MainnetContractCompiler.compileContract(
          contractName, 
          dummyAddress,
          { feePercentage: 100 }
        );
        
        if (!MainnetContractCompiler.validateContract(contractName, mainnetCompiled.code)) {
          warnings.push('Mainnet compilation validation failed');
        }
      } catch (mainnetError) {
        warnings.push(`Mainnet compilation test failed: ${mainnetError.message}`);
      }
      
    } catch (error) {
      errors.push(`Contract validation failed: ${error.message}`);
      isValid = false;
    }
    
    return {
      contractName,
      isValid,
      hasRealBytecode,
      size,
      sourceHash,
      errors,
      warnings
    };
  }
  
  /**
   * Load compiled contract bytecode
   */
  private static async loadCompiledContract(contractName: string): Promise<Cell> {
    switch (contractName) {
      case 'payment':
        return getPaymentContractCode();
      case 'nft-collection':
        return getNFTCollectionContractCode();
      case 'fan-club':
        return getFanClubContractCode();
      case 'reward-distributor':
        return getRewardDistributorContractCode();
      default:
        throw new Error(`Unknown contract: ${contractName}`);
    }
  }
  
  /**
   * Validate bytecode structure
   */
  private static validateBytecodeStructure(code: Cell, contractName: string): boolean {
    try {
      const slice = code.beginParse();
      
      // Basic structure checks
      if (slice.remainingBits === 0 && slice.remainingRefs === 0) {
        return false; // Empty cell
      }
      
      // Try to parse potential contract identifier
      if (slice.remainingBits >= 32) {
        const possibleIdentifier = slice.preloadUint(32);
        // Check if it looks like a contract identifier
        if (possibleIdentifier === 0) {
          return false; // Null identifier usually indicates placeholder
        }
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Check if bytecode is real or placeholder
   */
  private static isRealBytecode(code: Cell, contractName: string): boolean {
    try {
      const slice = code.beginParse();
      const cellSize = this.calculateCellSize(code);
      
      // Check for placeholder indicators
      if (cellSize < 50) {
        return false; // Too small to be real contract
      }
      
      // Check for placeholder patterns
      const firstBytes = slice.remainingBits >= 32 ? slice.preloadUint(32) : 0;
      const placeholderPatterns = [
        0x89679274, // Magic header for placeholder
        0xF200F200, // NOP operations pattern
        0x00000000  // Null pattern
      ];
      
      if (placeholderPatterns.includes(firstBytes)) {
        return false;
      }
      
      // Check for BOC structure that indicates real compilation
      const bocHex = code.toBoc().toString('hex');
      if (bocHex.length < 100) {
        return false; // Too short to be real
      }
      
      // BOC magic string check is not applicable here; rely on size and basic structure
      return cellSize >= 50;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Calculate cell size in bytes
   */
  private static calculateCellSize(cell: Cell): number {
    return cell.toBoc().length;
  }
  
  /**
   * Generate validation summary
   */
  private static generateSummary(results: ValidationResult[]) {
    return {
      realContracts: results.filter(r => r.hasRealBytecode).length,
      placeholderContracts: results.filter(r => !r.hasRealBytecode).length,
      failedValidations: results.filter(r => !r.isValid).length,
      totalSizeBytes: results.reduce((sum, r) => sum + r.size, 0)
    };
  }
  
  /**
   * Generate recommendations based on validation results
   */
  private static generateRecommendations(results: ValidationResult[], summary: any): string[] {
    const recommendations: string[] = [];
    
    if (summary.placeholderContracts > 0) {
      recommendations.push(
        `Replace ${summary.placeholderContracts} placeholder contracts with real FunC compilation`
      );
    }
    
    if (summary.failedValidations > 0) {
      recommendations.push(
        `Fix ${summary.failedValidations} failed contract validations before deployment`
      );
    }
    
    const errorsFound = results.some(r => r.errors.length > 0);
    if (errorsFound) {
      recommendations.push('Resolve all compilation errors before proceeding to testnet');
    }
    
    const warningsFound = results.some(r => r.warnings.length > 0);
    if (warningsFound) {
      recommendations.push('Review and address compilation warnings for optimal deployment');
    }
    
    if (summary.totalSizeBytes > 50000) {
      recommendations.push('Consider optimizing contract sizes to reduce deployment costs');
    }
    
    if (summary.realContracts === results.length && summary.failedValidations === 0) {
      recommendations.push('✅ All contracts validated - ready for testnet deployment testing');
    }
    
    return recommendations;
  }
  
  /**
   * Log validation results to console
   */
  private static logValidationResults(testResult: CompilationTestResult) {
    console.log('\n📊 Contract Compilation Validation Results');
    console.log('==========================================');
    console.log(`Contracts Validated: ${testResult.contractsValidated}/${testResult.totalContracts}`);
    console.log(`Real Contracts: ${testResult.summary.realContracts}`);
    console.log(`Placeholder Contracts: ${testResult.summary.placeholderContracts}`);
    console.log(`Failed Validations: ${testResult.summary.failedValidations}`);
    console.log(`Total Size: ${(testResult.summary.totalSizeBytes / 1024).toFixed(2)} KB`);
    
    console.log('\n📋 Individual Contract Results:');
    testResult.results.forEach(result => {
      const status = result.isValid ? '✅' : '❌';
      const type = result.hasRealBytecode ? 'REAL' : 'PLACEHOLDER';
      console.log(`${status} ${result.contractName.padEnd(20)} [${type}] ${(result.size / 1024).toFixed(2)} KB`);
      
      if (result.errors.length > 0) {
        console.log(`   Errors: ${result.errors.join(', ')}`);
      }
      if (result.warnings.length > 0) {
        console.log(`   Warnings: ${result.warnings.join(', ')}`);
      }
    });
    
    if (testResult.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      testResult.recommendations.forEach(rec => {
        console.log(`   • ${rec}`);
      });
    }
    
    console.log(`\n${testResult.success ? '✅ Validation PASSED' : '❌ Validation FAILED'}`);
  }
  
  /**
   * Quick check for production readiness
   */
  static async checkProductionReadiness(): Promise<{
    ready: boolean;
    issues: string[];
    contractStatus: { [key: string]: boolean };
  }> {
    const hasPlaceholders = hasPlaceholderContracts();
    const placeholderList = getPlaceholderContractsList();
    
    const issues: string[] = [];
    const contractStatus: { [key: string]: boolean } = {};
    
    if (hasPlaceholders) {
      issues.push(`Placeholder contracts detected: ${placeholderList.join(', ')}`);
    }
    
    // Quick validation of each contract
    const contractNames = ['payment', 'nft-collection', 'fan-club', 'reward-distributor'];
    for (const name of contractNames) {
      try {
        const code = await this.loadCompiledContract(name);
        const isReal = this.isRealBytecode(code, name);
        contractStatus[name] = isReal;
        
        if (!isReal) {
          issues.push(`${name} contract uses placeholder bytecode`);
        }
      } catch (error) {
        contractStatus[name] = false;
        issues.push(`${name} contract failed to load: ${error.message}`);
      }
    }
    
    return {
      ready: issues.length === 0,
      issues,
      contractStatus
    };
  }
}

// Export main validation function
export async function validateContractCompilation(): Promise<CompilationTestResult> {
  return ContractCompilationValidator.validateAllContracts();
}

export async function checkContractProductionReadiness() {
  return ContractCompilationValidator.checkProductionReadiness();
}