
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async() => {

    let result = null;

    let contract = new Contract('localhost', () => {

        // Read transaction
        contract.isOperational((error, result) => {
            console.log(error,result);
            display('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
        });
    

        // User-submitted transaction
        DOM.elid('submit-oracle').addEventListener('click', () => {
            let flight = DOM.elid('flight').value;
            let airline = DOM.elid('airline-address').value;
            let timestamp = DOM.elid('flight-time').value;
            console.log("airline address: ", airline);
            console.log("flight id is: ", flight);
            // Write transaction
            contract.fetchFlightStatus(airline, flight, timestamp, (error, result) => {
                display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
            });
        })

		// transaction for registration of airline
		DOM.elid('register-airline').addEventListener('click', () => {
            let airlineName = DOM.elid('airline-name').value;
			let airlineAddress = DOM.elid('airline-address').value;
			console.log("before register");
            // Write transaction
            contract.registerAirline(airlineName,airlineAddress,(error,result) => {
				console.log("inside register",result);
               display('Register', 'Register Airlines', [ { label: 'Fetch register status', error: error, value: result} ]);
            });
        })
        
		DOM.elid('register-flight').addEventListener('click', () => {
            let flightName = DOM.elid('flight-id').value;
			let flightTime = DOM.elid('flight-time').value;
			console.log("before register flight. ");
            // Write transaction
            contract.registerFlight(flightName,flightTime,(error,result) => {
				console.log("inside register: ",result);
               display('Register', 'Register Flights', [ { label: 'Fetch register status', error: error, value: result} ]);
            });
        })

		// transaction for funding of airline
		DOM.elid('fund-airline').addEventListener('click', () => {
 			let airlineAddress = DOM.elid('funded-airline').value;
			console.log("before fund");
            // Write transaction
            contract.fund(airlineAddress,(error,result) => {
				console.log("inside fund",result);
              display('Fund', 'Fund Airlines', [ { label: 'Fetch funding status', error: error, value: result} ]);
            });
        })
		
		// transaction for purchasing of insurance
		DOM.elid('purchase-insurance').addEventListener('click', () => {
        
        let airlineAddress = DOM.elid('airline').value;
        let passengerAddress = DOM.elid('passenger').value;
        let flightName = DOM.elid('flight-id').value;
        let flightTime = DOM.elid('flight-time').value;
		console.log("Passenger address=",passengerAddress);
            // Write transaction
        contract.buyInsurance(airlineAddress, flightName, flightTime, passengerAddress, (error,result) => {
				console.log("inside fund",passengerAddress);
                display('Purchase', 'Purchase Insurance', [ { label: 'Insurance purchasing status', error: error, value: result} ]);
           });
        })
    
    });
    

})();


function display(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);

}







