class validRequest{
    constructor(requestObject){
        this.registerStar = true;
        this.status = {
            walletAddress: requestObject.walletAddress,
            requestTimeStamp: requestObject.requestTimeStamp,
            message: requestObject.message,
            validationWindow: requestObject.validationWindow,
            messageSignature: true
        };

    }

}

module.exports.validRequest = validRequest