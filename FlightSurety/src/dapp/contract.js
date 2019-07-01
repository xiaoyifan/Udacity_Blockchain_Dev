import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
        this.initialize(callback, config);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
    }

    initialize(callback, config) {
        let self = this;
        this.web3.eth.getAccounts((error, accts) => {
           
            this.owner = accts[0];

            let counter = 1;
            
            //During init phase, authorize app contract to call data contract.
            self.flightSuretyData.methods.authorizeCaller(config.appAddress).send({ from: self.owner}, (error, result) => {
                callback(error, result);
            });
        });
    }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }

    fetchFlightStatus(airline, flight, timestamp, callback) {
        let self = this;
        console.log("fetching flight status");
        self.flightSuretyApp.methods
            .fetchFlightStatus(airline, flight, timestamp)
            .send({ from: self.owner, gas:650000}, (error, result) => {
                console.log("fetchFlightStatus result: ", result);
                callback(error, result);
            });
    }


    registerAirline(airlineName, airlineAddress,callback) {
        let self = this;
        this.web3.eth.getBalance(airlineAddress).then(function(receipt){ console.log("balance before=",receipt); });
        self.flightSuretyApp.methods
            .registerAirline(airlineName, airlineAddress)
            .send({ from:self.owner, gas:650000}, (error, result) => {
          //      callback(error, payload);
            console.log("current owner: ", self.owner);
		    console.log("inside contract js");
			console.log("airline getting registered=",airlineAddress);
            console.log("airline which is registering=",self.owner);
            console.log("error: ", error);
            console.log("result: ", result);
			console.log(error,result);
            callback(error,result);
            this.web3.eth.getBalance(airlineAddress).then(function(receipt){ console.log("balance after=",receipt); });
            });
    }
    
    registerFlight(flightName, flightTime, callback) {
        let self = this;
        this.web3.eth.getBalance(self.owner).then(function(receipt){ console.log("balance before=",receipt); });
        self.flightSuretyApp.methods
            .registerFlight(flightName, flightTime)
            .send({ from:self.owner, gas:650000}, (error, result) => {
          //      callback(error, payload);
            console.log("current owner: ", self.owner);
		    console.log("inside contract js");
            console.log("error: ", error);
            console.log("result: ", result);
			console.log(error,result);
            callback(error,result);
            this.web3.eth.getBalance(self.owner).then(function(receipt){ console.log("balance after=",receipt); });
            });
    }

	fund(airlineAddress,callback) {
        let self = this;
       	const amount = web3.toWei(10, 'ether');
		this.web3.eth.getBalance(airlineAddress).then(function(receipt){ console.log("balance before=",receipt); });
		
        self.flightSuretyApp.methods
            .fundAirline().send({ from:airlineAddress, value:amount, gas:650000}, (error, result) => {
          //      callback(error, payload);
			console.log("airline getting funded=",airlineAddress);
	//		 console.log("balance after",web3.eth.getBalance(airlineAddress));
			console.log(error,result);
			callback(error,result);
			this.web3.eth.getBalance(airlineAddress).then(function(receipt){ console.log("balance after=",receipt); });
            });
			
    }

    buyInsurance(airline, flight, flightTime, passengerAddress, callback) {
        let self = this;
       	const amount = web3.toWei(0.5, 'ether');
		console.log("inside contract js flight id=",flight);
		console.log("inside contract js flight time=",flightTime);
		console.log("inside contract js passenger address=",passengerAddress);

	    this.web3.eth.getBalance(passengerAddress).then(function(receipt){ console.log("balance before buy insurance=",receipt); });
        self.flightSuretyApp.methods
            .buyInsurance(airline, flight, flightTime).send({ from:passengerAddress, value:amount, gas:650000}, (error, result) => {
			console.log(error,result);
			callback(error,result);
			this.web3.eth.getBalance(passengerAddress).then(function(receipt){ 
				console.log("balance after buy insurance=",receipt); });
            });

    }
}