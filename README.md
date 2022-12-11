# Rock Paper Scissors

The React App was constructed from the boilerplate project provided by Hardhat on the following [link](https://hardhat.org/tutorial/boilerplate-project).
The full project requires npm and Hardhat to be installed.

## Running the RPS (short for Rock, Paper, Scissors Project)

To run this project, simply:
- Clone the repo
- `cd` into the repo's folder (on the command line)
- `npm i`
- `npx hardhat node` (To start the Hardhat Network's instance)
- `npx hardhat --network localhost run scripts/deploy.js` (make sure to use localhost network)


Remember to connect your wallet provider (eg. [Metamask](https://metamask.io/)) to Localhost. And in order to connect to the hardhat's node, grab one of the private keys that appear on the console and import that address into your metamask wallet.

And to start the React App (while inside your repo folder):
- `cd frontend`
- `npm i`
- `npm run start`

After that last command, the application should automatically open on your browser. In case it doesn't, access [http://127.0.0.1:3000/](http://127.0.0.1:3000/) manually or check for available ports.

**Enjoy playing _Rock Paper Scissors_!**

## Executing the Test Suites
