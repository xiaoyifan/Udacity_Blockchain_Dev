/* ===== Persist data with LevelDB ==================
|  Learn more: level: https://github.com/Level/level |
/===================================================*/

const level = require('level');
const hex2ascii = require('hex2ascii');

const chainDB = './chaindata';

class LevelSandbox {

    constructor() {
        this.db = level(chainDB);
    }

    // Get data from levelDB with key (Promise)
    getLevelDBData(key){
        let self = this;
        console.log("key is: ", key);
        return new Promise(function(resolve, reject) {
            // Add your code here, remember un Promises you need to resolve() or reject()
            self.db.get(key, (err, value) => {
                            if(err){
                                if (err.type == 'NotFoundError') {
                                    resolve(undefined);
                                }else {
                                    console.log('Block ' + key + ' get failed', err);
                                    reject(err);
                                }
                            }else {
                                let block = JSON.parse(value);
                                self.decodeStory(block);
                                resolve(block);
                            }
            });
        });
    }

    // Add data to levelDB with key and value (Promise)
    addLevelDBData(key, value) {
        let self = this;
        return new Promise(function(resolve, reject) {
            // Add your code here, remember un Promises you need to resolve() or reject()
            self.db.put(key, value, function(err) {
                if (err) {
                    console.log('Block ' + key + ' submission failed', err);
                    reject(err);
                }
                resolve(value);
            });
        });
    }

    // Add data to levelDB with value
    addDataToLevelDB(value) {
        let self = this;
        console.log("value param: " + value);

        return new Promise(function(resolve, reject){
            // Add your code here, remember un Promises you need to resolve() or reject()
            let i = 0;
            self.db.createReadStream().on('data', function(data) {
                  i++;
                }).on('error', function(err) {
                    reject(err);
                }).on('close', function() {
                  console.log('Block #' + i);
                  console.log("Value is: ", value)
                  self.addLevelDBData(i, value);
                });
        });
    }


    // Method that return the height
    getBlocksCount() {
        let self = this;
        return new Promise(function(resolve, reject){
            // Add your code here, remember un Promises you need to resolve() or reject()
            self.count = 0;
            self.db.createReadStream().on('data', function (data) {
                      // Count each object inserted
                      self.count++;
                 })
                .on('error', function (err) {
                    // reject with error
                    reject(err);
                 })
                 .on('close', function () {
                    //resolve with the count value
                     resolve(self.count);
                });
        });
    }


    // Method that get the block object by hash
    getBlockByHash(hash) {
        let self = this;
        return new Promise(function(resolve, reject){
            // Add your code here, remember un Promises you need to resolve() or reject()
            self.block = null;
            console.log("the hash is: ", hash);
            self.db.createReadStream().on('data', function (data) {
                      let block = JSON.parse(data.value);

                      if(block.hash === hash){
                          console.log("here?")
                          self.decodeStory(block);
                          self.block = block;
                      }
                 })
                .on('error', function (err) {
                    // reject with error
                    reject(err);
                 })
                 .on('close', function () {
                    //resolve with the count value
                     resolve(self.block);
                });
        });
    }


    // Method that get the block object by hash
    getBlockByWalletAddress(walletAddress) {
        let self = this;
        return new Promise(function(resolve, reject){
            // Add your code here, remember un Promises you need to resolve() or reject()
            self.blocks = [];
            console.log("the wallet address is: ", walletAddress);
            self.db.createReadStream().on('data', function (data) {
                        let block = JSON.parse(data.value);
                        console.log("block got: ", block.body.address);
                        if(block.body && block.body.address === walletAddress){
                            self.decodeStory(block);
                            self.blocks.push(block);
                        }
                    })
                .on('error', function (err) {
                    // reject with error
                    reject(err);
                    })
                    .on('close', function () {
                    //resolve with the count value
                        resolve(self.blocks);
                });
        });
    }

    // Method that return the height
    getChain() {
        let self = this;
        return new Promise(function(resolve, reject){
            // Add your code here, remember un Promises you need to resolve() or reject()
            self.chain = [];
            self.db.createReadStream().on('data', function (data) {
                      // Count each object inserted
                      self.chain.push(data)
                 })
                .on('error', function (err) {
                    // reject with error
                    reject(err);
                 })
                 .on('close', function () {
                    //resolve with the count value
                     resolve(self.chain);
                });
        });
    }

    decodeStory(block){

        if(block.body && block.body.star && block.body.star.story){
            block.body.star.storyDecoded = hex2ascii(block.body.star.story);
        }

        
    }


}

module.exports.LevelSandbox = LevelSandbox;
