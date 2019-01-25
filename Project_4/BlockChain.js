/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

const SHA256 = require('crypto-js/sha256');
const LevelSandbox = require('./LevelSandbox.js');
const Block = require('./Block.js');

class Blockchain {

    constructor() {
        this.bd = new LevelSandbox.LevelSandbox();
        this.generateGenesisBlock();
    }

    // Auxiliar method to create a Genesis Block (always with height= 0)
    // You have to options, because the method will always execute when you create your blockchain
    // you will need to set this up statically or instead you can verify if the height !== 0 then you
    // will not create the genesis block
    generateGenesisBlock(){
        // Adding block object to chain
        let block = new Block.Block("First Block in the chain - Genesis block");

        block.time = new Date().getTime().toString().slice(0,-3);
        // Block hash with SHA256 using newBlock and converting to a string
        block.hash = SHA256(JSON.stringify(block)).toString();

        block.height = 0;

        block.previousBlockHash = "";

        // Add your code here
        let value = JSON.stringify(block).toString();
        console.log("genesis block value: ", value);
        this.bd.addLevelDBData(0, value);

    }

    // Get block height, it is auxiliar method that return the height of the blockchain
    getBlockHeight() {
        // Add your code here
        return new Promise((resolve, reject) => {
            this.bd.getBlocksCount().then((height) => {
                console.log("total block counts: ", height);
                resolve(height-1);
            }).catch((err) => {
                reject(err);
            });
        });
    }

    // Add new block
    addBlock(block) {
      return new Promise((resolve, reject) => {
        // UTC timestamp
        block.time = new Date().getTime().toString().slice(0,-3);

        this.getBlockHeight().then((height) => {
            console.log("block height is: ", height)
            block.height = height + 1;
            // previous block hash
            this.getBlock(height).then((prev_block) => {
              block.previousBlockHash = prev_block.hash;
              // Block hash with SHA256 using newBlock and converting to a string
              block.hash = SHA256(JSON.stringify(block)).toString();
              // Add your code here
              this.bd.addLevelDBData(block.height, JSON.stringify(block).toString())
                     .catch((err) => {
                            reject('Fail to add block to chain. ',err);
                      }).then((block) => {
                            resolve(JSON.parse(block));
                      });

            }).catch((err) => {
              reject('Unable to get previous block.', err);
            });

        }).catch((err) => {
          reject('Unable to get chain counts', err);
        });

      });

    }

    // Get Block By Height
    getBlock(height){
        console.log("height: ", height);
        return new Promise((resolve, reject) => {
            this.bd.getLevelDBData(height).then((value) => {
                resolve(value);
            }).catch((err) => {
                reject(err);
            });
        });
    }

    // Validate if Block is being tampered by Block Height
    validateBlock(height) {
        // Add your code here
        return new Promise((resolve, reject) => {
            this.getBlock(height).then((block) => {
                let blockHash = block.hash;
                block.hash = '';
                let validBlockHash = SHA256(JSON.stringify(block)).toString();
                if (blockHash === validBlockHash) {
                    resolve(true);
                } else {
                    reject('Block #'+height+' invalid hash:\n'+blockHash+'<>'+validBlockHash);
                }
            }).catch((err) => {
                console.log('validateBlock: Unable to get block #'+height);
                reject(err);
            })
        });
    }

    getBlockByHash(hash){
        return new Promise((resolve, reject) => {
            this.bd.getBlockByHash(hash).then((block) => {
                console.log("block returned from hash: ", block);
                resolve(block);
            }).catch((err) => {
                reject(err);
            });
        });
    }

    getBlockByWalletAddress(walletAddress){
        return new Promise((resolve, reject) => {
            this.bd.getBlockByWalletAddress(walletAddress).then((blocks) => {
                console.log("block returned from wallet: ", blocks);
                resolve(blocks);
            }).catch((err) => {
                reject(err);
            });
        });
    }

    // validate each block and return the corresponding error log
    async validateAllBlocks(blockHeight) {
        let errors = [];
        for (let i = 0; i <= blockHeight; i++) {
            try {
                await this.validateBlock(blockHeight);
            } catch (err) {
                console.log('validate a single block: ', err);
                errors.push(i);
            }
        }
        return errors;
    }

    // Validate Blockchain
    async validateChain() {
        let errors = [];
        try {
            const height = await this.getBlockHeight();
            let errors_a = await this.validateBlockLinks(height);
            errors.concat(errors_a);
            let errors_b = await this.validateEachBlock(height);
            errors.concat(errors_b);
        } catch (err) {
            console.log('validateChain:', err);
        }
        return errors;
    }

    // validate block connectivity and return corresponding error log
    async validateBlockLinks(height) {
        let errors = [];
        for (let i = 0; i < height; i++) {
            try {
                let block = await this.getBlock(i);
                let next_block = await this.getBlock(i+1);
                if (block.hash !== next_block.previousBlockHash) {
                    errors.push(i);
                }
            } catch (err) {
                console.log(err);
            }
        }
        return errors;
    }


    // validate each block and return the corresponding error log
    async validateEachBlock(blockHeight) {
        let errors = [];
        for (let i = 0; i <= blockHeight; i++) {
            try {
                await this.validateBlock(blockHeight);
            } catch (err) {
                console.log('validateEachBlock: ', err);
                errors.push(i);
            }
        }
        return errors;
    }



    // Utility Method to Tamper a Block for Test Validation
    // This method is for testing purpose
    _modifyBlock(height, block) {
        let self = this;
        return new Promise( (resolve, reject) => {
            self.bd.addLevelDBData(height, JSON.stringify(block).toString()).then((blockModified) => {
                resolve(blockModified);
            }).catch((err) => { console.log(err); reject(err)});
        });
    }

}

module.exports.Blockchain = Blockchain;
