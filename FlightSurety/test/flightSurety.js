var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {
  var config;

  // Constants
  const AIRLINE_FUNDING_VALUE = web3.utils.toWei("10", "ether");
  const PASSENGER_INSURANCE_VALUE_1 = web3.utils.toWei("1", "ether");
  const PASSENGER_INSURANCE_VALUE_2 = web3.utils.toWei("0.5", "ether");
  const TIMESTAMP = Math.floor(Date.now() / 1000);
  const STATUS_CODE_LATE_AIRLINE = 20;
  const TEST_ORACLES_COUNT = 20;
  const ORACLES_OFFSET = 20;

  // Airlines
  let airline2 = accounts[2];
  let airline3 = accounts[3];
  let airline4 = accounts[4];
  let airline5 = accounts[5];

  // Flights
  let flight1 = {
    airline: airline2,
    flight: "5J 814", 
    from: "SIN",
    to: "MNL", 
    timestamp: TIMESTAMP
  }
  let flight2 = {
    airline: airline2,
    flight: "5J 600", 
    from: "CEB",
    to: "DVO", 
    timestamp: TIMESTAMP
  }
  let flight3 = {
    airline: airline3,
    flight: "PR 2543", 
    from: "MNL",
    to: "DGT", 
    timestamp: TIMESTAMP
  }
  let flight4 = {
    airline: airline4,
    flight: "SQ 345",
    from: "ZRH",
    to: "SIN",
    timestamp: TIMESTAMP
  }

  // Passengers
  let passenger1 = accounts[10];
  let passenger2 = accounts[11];

  before('setup contract', async () => {
    config = await Test.Config(accounts);
    console.log("setting up: ", config.flightSuretyApp.address);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
  });

  describe('(multiparty) test stop loss functionality', function() {
    it(`(multiparty) has correct initial isOperational() value`, async function () {
      // Get operating status
      let status = await config.flightSuretyData.isOperational.call();
      assert.equal(status, true, "Incorrect initial operating status value");
    });

    it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {
      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try {
        await config.flightSuretyData.setOperatingStatus(false, {from: config.testAddresses[2]});
      }
      catch(e) {
        //console.log(e);
        accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
    });

    it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {
      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try {
        await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
        //console.log(e);
        accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);
    });

    it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {
      await config.flightSuretyData.setOperatingStatus(false);

      let reverted = false;
      try {
        await config.flightSurety.isOperational(true);
      }
      catch(e) {
        //console.log(e);
        reverted = true;
      }
      assert.equal(reverted, true, "Access not blocked for requireIsOperational");

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);
    });
  });

  describe('(airline) test airline functionality', function() {

    // Airline Ante: Airline can be registered, but does not participate in contract until it submits funding of 10 ether
    it('(airline) airline needs to be funded with 10 ether', async () => {
      const AIRLINE_FUNDING_VALUE_LOWER = web3.utils.toWei("5", "ether");

      let reverted = false;
      try {
        await config.flightSuretyApp.fundAirline({from: config.firstAirlineAddress, value: AIRLINE_FUNDING_VALUE_LOWER, gasPrice: 0})
      }
      catch(e) {
        //console.log(e);
        reverted = true;
      }

      assert.equal(reverted, true, "Airline cannot be funded with less than 10 ether");
    });

    it('(airline) cannot register an airline more than once', async () => {
      let reverted = false;
      try {
        await config.flightSuretyApp.registerAirline("Cebu Pacific Air", airline2, {from: config.firstAirlineAddress});
      }
      catch(e) {
        //console.log(e);
        reverted = true;
      }

      assert.equal(reverted, true, "Airline cannot be registered twice");
    });
  });

  describe('(flight) test flight functionality', function() {
    it('(flight) cannot register a flight  more than once', async () => {
      let reverted = false;
      try {
        await config.flightSuretyApp.registerFlight(flight1.flight, flight1.timestamp, {from: flight1.airline});
      }
      catch(e) {
        //console.log(e);
        reverted = true;
      }

      assert.equal(reverted, true, "Airline cannot register a flight more than once");
    });

    it('(flight) cannot register a flight if the airline is not funded', async () => {
      let reverted = false;
      try {
        await config.flightSuretyApp.registerFlight(flight3.flight, flight3.timestamp, {from: flight3.airline});
      }
      catch(e) {
        //console.log(e);
        reverted = true;
      }

      assert.equal(reverted, true, "Airline cannot register a flight if it is not funded");
    });
  });

  describe('(passenger) test passenger functionality', function() {
    it('(passenger) cannot buy insurance for non-registered flight', async () => {
      let reverted = false;
      try {
        await config.flightSuretyApp.buyInsurance(flight3.airline, flight3.flight, flight3.timestamp, {from: passenger1, value: PASSENGER_INSURANCE_VALUE, gasPrice: 0});
      }
      catch(e) {
        //console.log(e);
        reverted = true;
      }

      assert.equal(reverted, true, "Flight is not registered");
    });

    it('(passenger) cannot buy insurance without funds', async () => {
      let reverted = false;
      try {
        await config.flightSuretyApp.buyInsurance(flight2.airline, flight2.flight, flight2.timestamp, {from: passenger1, value: 0, gasPrice: 0});
      }
      catch(e) {
        //console.log(e);
        reverted = true;
      }

      assert.equal(reverted, true, "No funds provided");
    });

    it('(passenger) cannot buy insurance above insurance limit', async () => {
      let reverted = false;
      try {
        await config.flightSuretyApp.buyInsurance(flight2.airline, flight2.flight, flight2.timestamp, {from: passenger1, value: PASSENGER_INSURANCE_VALUE_1 + 1, gasPrice: 0});
      }
      catch(e) {
        //console.log(e);
        reverted = true;
      }

      assert.equal(reverted, true, "Insurance amount is above limit");
    });

    it('(passenger) cannot buy insurance for the same flight twice', async () => {
      let reverted = false;
      try {
        await config.flightSuretyApp.buyInsurance(flight2.airline, flight2.flight, flight2.timestamp, {from: passenger1, value: PASSENGER_INSURANCE_VALUE_1, gasPrice: 0});
      }
      catch(e) {
        //console.log(e);
        reverted = true;
      }

      assert.equal(reverted, true, "Passenger cannot buy insurance for the same flight twice");
    });
  });

  describe('(oracles) test oracles functionality', function() {
    it('(oracles) can register oracles', async () => {
      let fee = await config.flightSuretyApp.REGISTRATION_FEE.call();
      for(let a=1; a<TEST_ORACLES_COUNT; a++) {      
        await config.flightSuretyApp.registerOracle({from: accounts[a+ORACLES_OFFSET], value: fee});
        let result = await config.flightSuretyApp.getMyIndexes.call({from: accounts[a+ORACLES_OFFSET]});
      }
    });

    it('(oracles) can request flight status', async () => {
      let airline = flight2.airline;
      let flight = flight2.flight;
      let timestamp = flight2.timestamp;

      // Submit a request for oracles to get status information for a flight
      await config.flightSuretyApp.fetchFlightStatus(airline, flight, timestamp);

      // Since the Index assigned to each test account is opaque by design
      // loop through all the accounts and for each account, all its Indexes (indices?)
      // and submit a response. The contract will reject a submission if it was
      // not requested so while sub-optimal, it's a good test of that feature
      for(let a=1; a<TEST_ORACLES_COUNT; a++) {
        // Get oracle information
        let oracleIndexes = await config.flightSuretyApp.getMyIndexes.call({from: accounts[a+ORACLES_OFFSET]});
        for(let idx=0;idx<3;idx++) {
          try {
            // Submit a response...it will only be accepted if there is an Index match
            await config.flightSuretyApp.submitOracleResponse(oracleIndexes[idx], airline, flight, timestamp, STATUS_CODE_LATE_AIRLINE, {from: accounts[a+ORACLES_OFFSET]});
          }
          catch(e) {
            // Enable this when debugging
            //console.log('\nError', idx, oracleIndexes[idx].toNumber(), flight, timestamp);
          }
        }
      }
    });

  });

});