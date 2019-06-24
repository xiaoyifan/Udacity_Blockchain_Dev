
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
            let flight = DOM.elid('flight-number').value;
            // Write transaction
            contract.fetchFlightStatus(flight, (error, result) => {
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
               display('register', 'Register Airlines', [ { label: 'Fetch reguster status Status', error: error, value: result} ]);
            });
        })
		
		// transaction for funding of airline
		DOM.elid('fund-airline').addEventListener('click', () => {
 			let airlineAddress = DOM.elid('funded-airline').value;
			console.log("before fund");
            // Write transaction
            contract.fund(airlineAddress,(error,result) => {
				console.log("inside fund",result);
              display('fund', 'Fund Airlines', [ { label: 'Fetch reguster status Status', error: error, value: result} ]);
            });
        })
		
		// transaction for purchasing of insurance
		DOM.elid('purchase-insurance').addEventListener('click', () => {
			
		let passengerAddress = DOM.elid('passenger-address-buy').value;

 		//	let flightId = DOM.elid('FlightId');
		var e = document.getElementById("FlightId");
			var flightId = e.options[e.selectedIndex].text;
			console.log("Selected Flight Id=",flightId);
			
		var f = document.getElementById("FlightTime");
			var flightTime = f.options[f.selectedIndex].text;
			console.log("Selected Flight Time=",flightTime);
			
				console.log("Passenger address=",passengerAddress);
            // Write transaction
           contract.buy(flightId,flightTime,passengerAddress,(error,result) => {
				console.log("inside fund",passengerAddress);
   
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







