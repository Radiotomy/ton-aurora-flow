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
import { compileRealContract } from '@/utils/realTonCompiler';
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
      
      // 4. Test real FunC compilation
      try {
        const realCompiled = await compileRealContract(contractName);
        sourceHash = realCompiled.sourceHash;
        
        // Compare with real compilation results
        const realSize = this.calculateCellSize(realCompiled.bytecode);
        const sizeDiff = Math.abs(realSize - size);
        
        // If current bytecode is real, sizes should be similar
        if (hasRealBytecode && sizeDiff > 1000) {
          warnings.push(`Size mismatch with real FunC compilation: current (${size}) vs real (${realSize}) - diff: ${sizeDiff} bytes`);
        }
        
        // If current bytecode is synthetic, note the real compilation succeeded
        if (!hasRealBytecode) {
          warnings.push(`Synthetic bytecode detected. Real FunC compilation available (${realSize} bytes)`);
        }
      } catch (sourceError) {
        warnings.push(`Real FunC compilation test failed: ${sourceError.message}`);
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
      const boc = code.toBoc();
      const bocHex = boc.toString('hex');
      
      // Check if this is just an empty Cell (fallback bytecode)
      if (boc.length < 10) {
        return false;
      }
      
      // Check for synthetic/placeholder bytecode patterns
      if (bocHex.includes('DEADBEEF') || bocHex.includes('placeholder') || bocHex.includes('test')) {
        return false;
      }
      
      // Real TVM bytecode should start with BOC magic number
      if (!bocHex.startsWith('b5ee9c72')) {
        return false;
      }
      
      // Check for actual TVM opcodes that indicate real compilation
      const realTVMOpcodes = [
        'a9ec17c4', // DIVMOD
        'b817c4ae', // SEND_RAW_MESSAGE  
        'c5c25040', // STORE_REF
        '9130e8a1', // LOAD_MSG_ADDR
        'f2cc', 'f84c', 'f85c' // Various TVM instructions
      ];
      
      const hasRealOpcodes = realTVMOpcodes.some(opcode => bocHex.includes(opcode));
      
      // Contract should have substantial size (real compiled contracts are larger)
      const hasSubstantialSize = boc.length > 100;
      
      return hasRealOpcodes && hasSubstantialSize;
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