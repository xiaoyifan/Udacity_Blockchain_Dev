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
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
    }

    initialize(callback) {
        this.web3.eth.getAccounts((error, accts) => {
           
            this.owner = accts[0];

            let counter = 1;
            
            while(this.airlines.length < 5) {
                this.airlines.push(accts[counter++]);
            }

            while(this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }

            callback();
        });
    }

    isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }

    fetchFlightStatus(flight, callback) {
        let self = this;
        let payload = {
            airline: self.airlines[0],
            flight: flight,
            timestamp: Math.floor(Date.now() / 1000)
        } 
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner}, (error, result) => {
                callback(error, payload);
            });
    }


    registerAirline(airlineName, airlineAddress,callback) {
        let self = this;
       
        self.flightSuretyApp.methods
            .registerAirline(airlineName, airlineAddress)
            .send({ from:self.owner}, (error, result) => {
          //      callback(error, payload);
            console.log("current owner: ", self.owner);
		    console.log("inside contract js");
			console.log("airline getting registered=",airlineAddress);
            console.log("airline which is registering=",self.owner);
            console.log("error: ", error);
            console.log("result: ", result);
			console.log(error,result);
			callback(error,result);
            });

        self.flightSuretyApp.methods.getRegisteredAirlines().send({ from:self.owner}, (error, result) => {
            console.log("Registered Airlines Count: ", result);
        });
    }
	
	fund(airlineAddress,callback) {
        let self = this;
       	const amount = web3.toWei(10, 'ether');
		this.web3.eth.getBalance(airlineAddress).then(function(receipt){ console.log("balance before=",receipt); });
		
		/*
		this.web3.eth.getBalance(airlineAddress,function(balance){
		console.log("before fund=", balance);
		});
		*/
        self.flightSuretyApp.methods
            .fundAirline().send({ from:airlineAddress, value:amount}, (error, result) => {
          //      callback(error, payload);
			console.log("airline getting funded=",airlineAddress);
	//		 console.log("balance after",web3.eth.getBalance(airlineAddress));
			console.log(error,result);
			callback(error,result);
			this.web3.eth.getBalance(airlineAddress).then(function(receipt){ console.log("balance after=",receipt); });
            });
			
    }
	
	buy(flightId,flightTime,passengerAddress,callback) {
        let self = this;
       	const amount = web3.toWei(5, 'ether');
		console.log("inside contract js flight id=",flightId);
		console.log("inside contract js flight time=",flightTime);
		console.log("inside contract js passenger address=",passengerAddress);

	this.web3.eth.getBalance(passengerAddress).then(function(receipt){ console.log("balance before buy insurance=",receipt); });
        self.flightSuretyApp.methods
            .buy(flightId,flightTime).send({ from:passengerAddress, value:amount}, (error, result) => {
          //      callback(error, payload);

	//		 console.log("balance after",web3.eth.getBalance(airlineAddress));
			console.log(error,result);
			callback(error,result);
			this.web3.eth.getBalance(passengerAddress).then(function(receipt){ 
				console.log("balance after buy insurance=",receipt); });
            });

    }
}