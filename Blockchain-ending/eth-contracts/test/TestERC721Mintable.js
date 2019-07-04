var MyCustomERC721Token = artifacts.require('MyCustomERC721Token');

contract('TestERC721Mintable', accounts => {

    const name = "RET";
    const symbol = "RealEstateToken";

    const owner = accounts[0];
    const account_one = accounts[1];
    const account_two = accounts[2];
    const account_three = accounts[3];
    
    const tokenId1 = 10;
    const tokenId2 = 20;
    const tokenId3 = 30;
    const tokenId4 = 40;

    const tokenUri1 = 'https://s3-us-west-2.amazonaws.com/udacity-blockchain/capstone/' + tokenId1;

    describe('match erc721 spec', function () {
        beforeEach(async function () { 
            this.contract = await MyCustomERC721Token.new(name, symbol, {from: owner});
            this.contract.mint(account_one, tokenId1);
            this.contract.mint(account_two, tokenId2);
            this.contract.mint(account_three, tokenId3);
            this.contract.mint(account_one, tokenId4);
            // DONE: mint multiple tokens
        })

        it('should return total supply', async function () { 
            result = await this.contract.totalSupply.call({from: owner});
            // Check the result total supply
            assert.equal(result, 4, 'Error: Invalid total supply');
        })

        it('should get token balance', async function () { 
            result = await this.contract.balanceOf.call(account_one, {from: owner});
            assert.equal(result, 2, "Error: Invalid balance of account_one");
        })

        // token uri should be complete i.e: https://s3-us-west-2.amazonaws.com/udacity-blockchain/capstone/1
        it('should return token uri', async function () { 
            result = await this.contract.tokenURI(tokenId1, {from: owner});
            assert.equal(result, tokenUri1, "Error: returned token URI invalid");
        })

        it('should transfer token from one owner to another', async function () { 
            result = await this.contract.transferFrom(account_one, account_two, tokenId4, {from: account_one});
            assert.equal(result.logs[0].args.from, account_one);
            assert.equal(result.logs[0].args.to, account_two);
            assert.equal(result.logs[0].args.tokenId, tokenId4);
        })
    });

    describe('have ownership properties', function () {
        beforeEach(async function () { 
            this.contract = await MyCustomERC721Token.new(name, symbol, {from: owner});
        })

        it('should fail when minting when address is not contract owner', async function () { 
            let result = true;
            try {
                await this.contract.mint(account_one, tokenId1, {from: account_two});
              }
              catch(e) {
                result = false;
            }
            assert.equal(result, false, "mint from non-owner should fail");
        })

        it('should return contract owner', async function () { 
            result = await this.contract.getOwner.call({from: owner});
            assert.equal(result, owner, 'Error: Invalid contract Owner');
        })

    });
})