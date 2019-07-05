# Udacity Blockchain Capstone

This is the capstone application for Udacity Blockchain Nanodegree 

## Start

Installing all packages( in the directory contains package.json)
```
npm instal 
```
To start Ganache-cli for local deployment and testing: 
`ganache-cli --gasLimit 300000000 --gasPrice 20000000000 -a 50 -m "forget chief exist liberty video cash twelve nest grief umbrella panel trumpet" -e 10000000`

we will have accounts: 
![accounts](images/accounts.png)


To install, download or clone the repo, then in the directory contains package.json run:

`npm install`
`truffle compile`

## Develop Client

To run truffle tests:

`truffle test`

result will show all passed: 

![truffle test](images/test_rinkeby.png)

To deploy the app to Rinkeby test network: 

![truffle migration](images/deploy_rinkeby.png)


The contract address is: 

`0x73DA2c0225e9C7fF530e8725bAd3F0980A6dAFCb`

and in etherscan shows: 
`https://rinkeby.etherscan.io/address/0x73da2c0225e9c7ff530e8725bad3f0980a6dafcb`




# Project Resources

* [Remix - Solidity IDE](https://remix.ethereum.org/)
* [Visual Studio Code](https://code.visualstudio.com/)
* [Truffle Framework](https://truffleframework.com/)
* [Ganache - One Click Blockchain](https://truffleframework.com/ganache)
* [Open Zeppelin ](https://openzeppelin.org/)
* [Interactive zero knowledge 3-colorability demonstration](http://web.mit.edu/~ezyang/Public/graph/svg.html)
* [Docker](https://docs.docker.com/install/)
* [ZoKrates](https://github.com/Zokrates/ZoKrates)
