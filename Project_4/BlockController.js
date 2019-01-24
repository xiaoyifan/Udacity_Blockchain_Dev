const SHA256 = require('crypto-js/sha256');
const BlockClass = require('./Block.js');
const BlockChain = require('./BlockChain.js');
const RequestObject = require('./RequestObject.js');
const ValidRequest = require('./validRequest.js');
const Star = require('./StarData.js');

const bitcoinMessage = require('bitcoinjs-message'); 

/**
 * Controller Definition to encapsulate routes to work with blocks
 */
class BlockController {

    /**
     * Constructor to create a new BlockController, you need to initialize here all your endpoints
     * @param {*} app 
     */
    constructor(app) {
        this.app = app;
        this.blockchain = new BlockChain.Blockchain();
        // this.initializeMockData();
        this.getBlockByHeight();
        this.postNewBlock();
        this.requestValidation();
        this.validation();

        this.mempool = [];
        this.timeoutRequests = [];
        this.mempoolValid = [];
    }

    /**
     * 
     */
    requestValidation(){
        this.app.post("/requestValidation", (req, res) => {

            let body = req.body;

            if(this.isEmpty(body)){
                res.send({"error": "empty request"});
            }

            let address = body.address;
            let index = this.mempool.findIndex(obj => obj.walletAddress === address);

            let requestObject;

            if(index > -1){
                requestObject = this.mempool[index];
                this.updateValidationWindow(requestObject);

            }else{
                requestObject = new RequestObject.RequestObject(address);
                this.mempool.push(requestObject);
                this.timeoutRequests[address]=setTimeout(function(){ 
                    this.removeValidationRequest(address)
                }, requestObject.validationWindow * 1000 );

            }

            res.send(requestObject);

        });
    }


    validation(){

        this.app.post("/message-signature/validate", (req, res) => {

            let body = req.body;

            if(this.isEmpty(body)){
                res.send({"error": "empty request"});
            }

            let address = body.address;
            let index = this.mempool.findIndex(obj => obj.walletAddress === address);
            let signature = body.signature;
            let requestObject;

            if(index > -1){
                requestObject = this.mempool[index];
                this.updateValidationWindow(requestObject);

                if(requestObject.validationWindow < 0){
                    res.send({"error": "time for validation request timeout"});
                    return;
                }

                if(!bitcoinMessage.verify(requestObject.message, address, signature)){
                    res.send({"error": "Signature verification failed"});
                    return;
                }

                //then logic here should be init an valid request object
                //remove validatiojnrequest, timeoutRequests
                let validRequest = new ValidRequest.validRequest(requestObject);
                console.log("valid request: ", validRequest);
                this.mempoolValid.push(validRequest);
                console.log("mempool valid: ", this.mempoolValid);

                delete this.timeoutRequests[address];
                this.removeValidationRequest(address);

                res.send(validRequest);
            }else{
                res.send({"error": "Request is not found"})
            }
            
        });

    }

    /**
     * Implement a GET Endpoint to retrieve a block by height, url: "/api/block/:height"
     */
    getBlockByHeight() {
        let self = this
        this.app.get("/block/:height", (req, res) => {
            // Add your code here
            console.log("params: ", req.params)
            var index = req.params['index'];

            self.blockchain.getBlock(index).then((block) => {
                res.json(block);
            }).catch((err) => { 
                res.json("get block at index " + index +"failed");
            });

        });
    }

    /**
     * Implement a POST Endpoint to add a new Block, url: "/api/block"
     */
    postNewBlock() {
        let self = this;
        this.app.post("/block", (req, res) => {
            var body = req.body;

            if(this.isEmpty(body)){
                res.send({"error": "empty request"});
            }

            let star = body.star;
            let address = body.address;

            console.log("star is: ", star);
            console.log("address is: ", address);

            if (star instanceof Array || !this.verifyAddressRequest(address)){
                res.json({"error": "data format is wrong"});
            }
            else{
                starData = StarData.StarData(address, star);
                let blockAux = new BlockClass.Block(starData);
            
                self.blockchain.addBlock(blockAux).then((result) => {
                    console.log(result);
                    this.removeValidation(address);
                    res.json(blockAux);
                }).catch((err) => {
                    res.send({error: err});
                });
                //init new block and encode the data
            }
            

        });
    }


    isEmpty(obj){
        return !Object.keys(obj).length;
    }

    updateValidationWindow(requestObject){
        const TimeoutRequestsWindowTime = 5*60*1000;
        let timeElapse = (new Date().getTime().toString().slice(0,-3)) - requestObject.requestTimeStamp;
        let timeLeft = (TimeoutRequestsWindowTime/1000) - timeElapse;
        requestObject.validationWindow = timeLeft;
    }


    verifyAddressRequest(address){
        let index = this.mempoolValid.findIndex(obj => obj.walletAddress === address);

        console.log("index for valid mempool is: ", index);
        if(index > -1){
            return true;
        }
        return false;
    }

    removeValidationRequest(address){
        console.log(this.mempool);
        this.mempool.splice(this.mempool.findIndex(obj => obj.walletAddress === address), 1);
        console.log(this.mempool);
    }

    removeValidation(address){
        console.log(this.mempoolValid);
        this.mempoolValid.splice(this.mempoolValid.findIndex(obj => obj.status.walletAddress === address), 1);
        console.log(this.mempoolValid);
    }
    
}

/**
 * Exporting the BlockController class
 * @param {*} app 
 */
module.exports = (app) => { return new BlockController(app);}