// define a variable to import the <Verifier> or <renamedVerifier> solidity contract generated by Zokrates
var Verifier = artifacts.require('Verifier');
const successfulProof = require('../../zokrates/code/square/proof.json');
const failedProof = require('../../zokrates/code/square/proof_fail.json');

contract('Verifier', accounts => {

    const owner = accounts[0];

    describe('Test ZoKrates Verifier Contract', () => {

            before(async () => { 
                this.contract = await Verifier.new({from: owner});
            });

            // Test verification with correct proof
            // - use the contents from proof.json generated from zokrates steps
            it('verification with correct proof', async () => {
                result = await this.contract.verifyTx.call(
                    successfulProof.proof.a,
                    successfulProof.proof.b,
                    successfulProof.proof.c,
                    successfulProof.inputs, {from: owner});
                assert.equal(result, true, 'Error: Verification invalid');
            });
    
            // Test verification with incorrect proof
            it('verification with wrong proof', async () => {

                let result = true;
                try {
                    result = await this.contract.verifyTx.call(
                    failedProof.proof.a,
                    failedProof.proof.b,
                    failedProof.proof.c,
                    failedProof.inputs, {from: owner});
                }
                catch(e){
                    result = false
                }
                assert.equal(result, false, 'Error: Verification invalid');
            });
    })
});