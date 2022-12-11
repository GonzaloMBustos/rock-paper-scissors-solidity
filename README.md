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
On the repo's root directory:
- `npx hardhat test`

This test suite will run tests over the `RPS.sol` Smart Contract. You can check each test out going to `test/RPS.js`.

## HOW TO PLAY ROCK, PAPER, SCISSORS
- Once your app is running, start by _Connecting your Wallet_ using the provided yellow button.

- After that, you'll see a greeting with your selected ethereum address and an input prompt where you can challenge other players using their public addresses. Bare in mind that this version of the app only allows two players at once.

- Once you've challenged a player, you'll have to WAIT until the other player has accepted or rejected your challenge.
If you're the player being challenged, then you'll be prompted to Accept or Reject the challenge.

- Once the challenge has been accepted, both players will be prompted to choose Rock, Paper or Scissors, and also place a bet.
After choosing one of the options and submitting it, you'll have to wait for the other player to submit their choice.

*DO NOT LEAVE OR RELOAD THE PAGE SINCE THERE IS NO DATABASE OR GLOBAL STORAGE KEEPING YOUR INFORMATION*

- When both players have submitted their choices, both will be able to Reveal their choices to the public, and therefore, to their opponent.

- Once both players have revealed their choices, the winner will be announced, and both players will get to claim their respective prizes.

- After declaring the winner, the game has finished and the players will have to refresh the page in order to reset the initial state to avoid caching.

**Happy playing _Rock Paper Scissors_ and good luck!**
