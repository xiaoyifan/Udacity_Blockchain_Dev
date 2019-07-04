// Test if a new solution can be added for contract - SolnSquareVerifier
const SolnSquareVerifier = artifacts.require('SolnSquareVerifier');
const proof = require('../../zokrates/code/square/proof.json');
const Verifier = artifacts.require('Verifier');
// Test if an ERC721 token can be minted for contract - SolnSquareVerifier

contract("SquareVerifier", accounts => {

    const owner = accounts[0];
    const account_one = accounts[1];
    const tokenId = 10;
    const tokenUri1 = 'https://s3-us-west-2.amazonaws.com/udacity-blockchain/capstone/' + tokenId;
    const symbol = "SVC";
    const name = "SquareVerifierCoin";

    describe('test solnSquareVerifier - addSolution', function () {
        beforeEach(async function() { 
            let verifierContract = await Verifier.new({from: owner});
            this.contract = await SolnSquareVerifier.new(verifierContract.address, name, symbol, {from: owner});          
        })

        it('Test if a new solution can be added for contract - SolnSquareVerifier', async function() {
            tx = await this.contract.addSolution(
                owner,
                proof.proof.A,
                proof.proof.A_p,
                proof.proof.B,
                proof.proof.B_p,
                proof.proof.C,
                proof.proof.C_p,
                proof.proof.H,
                proof.proof.K,
                proof.input,
                {from: owner});

            assert.equal(tx.logs[0].event, 'SolutionAdded');
            assert.equal(tx.logs[0].args.solutionAddress, owner);
        });

    });

    describe('test solnSquareVerifier - mint Token', function () {
        beforeEach(async function() { 
            let verifierContract = await Verifier.new({from: owner});
            this.contract = await SolnSquareVerifier.new(verifierContract.address, name, symbol, {from: owner});          
        })

        it('Test if an ERC721 token can be minted for contract - SolnSquareVerifier', async function() {
            number = await this.contract.getSolutions.call();
            tx = await this.contract.mintToken(
                owner, tokenId, 
                proof.proof.A,
                proof.proof.A_p,
                proof.proof.B,
                proof.proof.B_p,
                proof.proof.C,
                proof.proof.C_p,
                proof.proof.H,
                proof.proof.K,
                proof.input, {from: owner});
                assert.equal(tx.logs[0].event, 'SolutionAdded');
                assert.equal(tx.logs[1].event, 'Transfer');
                assert.equal(tx.logs[2].event, 'TokenMinted');
                assert.equal(tx.logs[2].args.tokenId, tokenId);
                assert.equal(tx.logs[2].args.to, owner);
        });

    });
});