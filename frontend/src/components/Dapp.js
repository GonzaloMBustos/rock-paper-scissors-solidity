import React from "react";

import { ethers } from "ethers";

import RPSArtifact from "../contracts/RPS.json";
import contractAddress from "../contracts/contract-address.json";

import { NoWalletDetected } from "./NoWalletDetected";
import { ConnectWallet } from "./ConnectWallet";
// import { Loading } from "./Loading";

// This is the Hardhat Network id that we set in our hardhat.config.js.
// Here's a list of network ids https://docs.metamask.io/guide/ethereum-provider.html#properties
// to use when deploying to other networks.
const HARDHAT_NETWORK_ID = "1337";

export class Dapp extends React.Component {
  constructor(props) {
    super(props);

    // We store multiple things in Dapp's state.
    // You don't need to follow this pattern, but it's an useful example.
    this.initialState = {
      // The user's address
      selectedAddress: undefined,
      stage: 0,
      challenger: undefined,
      challenged: undefined,
      gameStarted: false,
      challengedPlayer: false,
      choice: undefined,
      revealedChoices: [],
      bid: 0,
    };

    this.state = this.initialState;
  }

  _challengePlayer = async () => {
    await this._rps.challenge(this.state.challenged);
    this.setState({ challengedPlayer: true });
  };

  render() {
    const choices = ["None", "Rock", "Paper", "Scissors"];

    // Ethereum wallets inject the window.ethereum object. If it hasn't been
    // injected, we instruct the user to install MetaMask.
    if (window.ethereum === undefined) {
      return <NoWalletDetected />;
    }

    // The next thing we need to do, is to ask the user to connect their wallet.
    // When the wallet gets connected, we are going to save the users's address
    // in the component's state. So, if it hasn't been saved yet, we have
    // to show the ConnectWallet component.
    //
    // Note that we pass it a callback that is going to be called when the user
    // clicks a button. This callback just calls the _connectWallet method.
    if (!this.state.selectedAddress) {
      return (
        <ConnectWallet
          connectWallet={() => this._connectWallet()}
          networkError={this.state.networkError}
          dismiss={() => this._dismissNetworkError()}
        />
      );
    }

    // if (condition) {
    //   return <Loading />;
    // }

    // If everything is loaded, we render the application.
    return (
      <div className="container p-4">
        <div className="row">
          <div className="col-12">
            <h2>
              Welcome <b>{this.state.selectedAddress}</b>, you can play Rock,
              Paper, Scissors here!
            </h2>
            <p>Minimum bet value is set by default on Smart Contract.</p>
          </div>
        </div>

        <hr />

        <div className="row">
          <div className="col-12">
            {!this.state.challenger && !this.state.challengedPlayer && (
              <div className="input-group mb-3">
                <div className="input-group-prepend">
                  <button
                    className="btn btn-outline-primary"
                    type="button"
                    onClick={this._challengePlayer}
                  >
                    Challenge Player
                  </button>
                </div>
                <input
                  type="text"
                  className="form-control"
                  id="challengePlayer"
                  placeholder="Player's address"
                  onChange={(e) => {
                    this.setState({ challenged: e.target.value });
                  }}
                />
              </div>
            )}
            {/* This part also won't work if the challenged player rejects the challenge */}
            {!this.state.challenger && this.state.challengedPlayer && (
              <>
                <div>
                  Waiting For Other Player to Accept or Reject Challenge
                </div>
                <h4>
                  If the other player rejected the challenge, refresh the page
                  to start over
                </h4>
              </>
            )}

            {!!this.state.challenger && !this.state.challengedPlayer && (
              <>
                <p>
                  If you reject the challenge, you will need to refresh the page
                  after submission.
                </p>
                <div
                  style={{ display: "flex", justifyContent: "space-around" }}
                >
                  Challenged by {this.state.challenger}
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={this._acceptChallenge}
                  >
                    Accept Challenge
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={this._rejectChallenge}
                  >
                    Reject Challenge
                  </button>
                </div>
              </>
            )}
            {this.state.gameStarted &&
              (this.state.stage === 0 || this.state.stage === 1) && (
                <>
                  <h3>Choose and submit Rock, Paper or Scissors!</h3>
                  <p>
                    Once you have submitted your answer, you'll have to wait
                    until your opponent has submitted theirs. Be patient!
                  </p>
                  <div className="input-group mb-3">
                    <input
                      type="number"
                      className="form-control"
                      id="challengePlayer"
                      placeholder="Insert your bid in ether!"
                      onChange={(e) => {
                        this.setState({
                          bid: e.target.value,
                        });
                      }}
                      disabled={!!this.state.choice}
                    />
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-around" }}
                  >
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        this._commitChoice(1);
                      }}
                      disabled={!!this.state.choice}
                    >
                      Rock
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        this._commitChoice(2);
                      }}
                      disabled={!!this.state.choice}
                    >
                      Paper
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        this._commitChoice(3);
                      }}
                      disabled={!!this.state.choice}
                    >
                      Scissors
                    </button>
                  </div>
                </>
              )}
            {(this.state.stage === 2 || this.state.stage === 3) && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-around",
                  marginTop: "10px",
                }}
              >
                You might have to wait for the other player to see the results
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    this._revealChoice();
                  }}
                >
                  Reveal
                </button>
              </div>
            )}
            {this.state.revealedChoices.length > 0 &&
              this.state.revealedChoices.map((c) => {
                return (
                  <div style={{ marginTop: "10px" }}>
                    Player {c.playerAddress}: choice {choices[c.choice]}
                  </div>
                );
              })}
            {this.state.stage === 4 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-around",
                  marginTop: "10px",
                }}
              >
                {this._pickWinner()}
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    this._claimPrizes();
                  }}
                >
                  Claim Prize
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  componentWillUnmount() {
    this._stopPollingData();
    this._stopPollReveals();
    this._stopPollStages();
  }

  _pickWinner = () => {
    if (this.state.revealedChoices.length === 0) {
      return;
    }
    const player1Choice = this.state.revealedChoices[0].choice;
    const player2Choice = this.state.revealedChoices[1].choice;
    // Missing case for not selected choice in time
    if (player1Choice === player2Choice) {
      return "It's a DRAW! Pick up your bids.";
    } else if (player1Choice === 1) {
      if (player2Choice === 2) {
        return `Paper beats Rock, Player ${this.state.revealedChoices[1].playerAddress} wins! Pick up your winnings.`;
      } else {
        return `Rock beats Scissors, Player ${this.state.revealedChoices[0].playerAddress} wins! Pick up your winnings.`;
      }
    } else if (player1Choice === 2) {
      if (player2Choice === 1) {
        return `Paper beats Rock, Player ${this.state.revealedChoices[0].playerAddress} wins! Pick up your winnings.`;
      } else {
        return `Scissors beat Paper, Player ${this.state.revealedChoices[1].playerAddress} wins! Pick up your winnings.`;
      }
    } else if (player1Choice === 3) {
      if (player2Choice === 1) {
        return `Rock beats Scissors, Player ${this.state.revealedChoices[1].playerAddress} wins! Pick up your winnings.`;
      } else {
        return `Scissors beat Paper, Player ${this.state.revealedChoices[0].playerAddress} wins! Pick up your winnings.`;
      }
    }
  };

  _claimPrizes = async () => {
    await this._rps.declareWinner();
    this._resetState();
  };

  async _connectWallet() {
    // This method is run when the user clicks the Connect. It connects the
    // dapp to the user's wallet, and initializes it.

    // To connect to the user's wallet, we have to run this method.
    // It returns a promise that will resolve to the user's address.
    const [selectedAddress] = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    // Once we have the address, we can initialize the application.

    // First we check the network
    if (!this._checkNetwork()) {
      return;
    }

    this._initialize(selectedAddress);

    // We reinitialize it whenever the user changes their account.
    window.ethereum.on("accountsChanged", ([newAddress]) => {
      this._stopPollingData();
      // `accountsChanged` event can be triggered with an undefined newAddress.
      // This happens when the user removes the Dapp from the "Connected
      // list of sites allowed access to your addresses" (Metamask > Settings > Connections)
      // To avoid errors, we reset the dapp state
      if (newAddress === undefined) {
        return this._resetState();
      }

      this._initialize(newAddress);
    });

    // We reset the dapp state if the network is changed
    window.ethereum.on("chainChanged", ([networkId]) => {
      this._stopPollingData();
      this._resetState();
    });
  }

  _initialize(userAddress) {
    // This method initializes the dapp

    // We first store the user's address in the component's state
    this.setState({
      selectedAddress: userAddress,
    });

    this._initializeEthers();
    this._startPollingData();
    this._pollStages();
    this._checkChallenged();
  }

  async _initializeEthers() {
    // We first initialize ethers by creating a provider using window.ethereum
    this._provider = new ethers.providers.Web3Provider(window.ethereum);

    this._rps = new ethers.Contract(
      contractAddress.RPS,
      RPSArtifact.abi,
      this._provider.getSigner(0)
    );
  }

  // The next two methods are needed to start and stop polling data. While
  // the data being polled here is specific to this example, you can use this
  // pattern to read any data from your contracts.
  //
  // Note that if you don't need it to update in near real time, you probably
  // don't need to poll it. If that's the case, you can just fetch it when you
  // initialize the app, as we do with the token data.
  _startPollingData() {
    this._pollRPSDataInterval = setInterval(
      () => this._checkChallenged(),
      1000
    );

    this._checkChallenged();
  }

  _stopPollingData() {
    clearInterval(this._pollRPSDataInterval);
    this._pollRPSDataInterval = undefined;
  }

  _commitChoice = async (choice) => {
    // 1 is the minimum bet set on the Smart Contract
    const bet =
      !!this.state.bid && this.state.bid > 1
        ? Number.parseInt(this.state.bid)
        : 1;
    const hashChoice = await this._rps.hashPacked(
      this.state.selectedAddress,
      choice
    );
    await this._rps.commit(hashChoice, { value: bet });
    this.setState({ choice });
    this._pollReveals();
  };

  _revealChoice = async () => {
    await this._rps.reveal(this.state.choice);
  };

  _pollReveals = async () => {
    this._pollReveals = setInterval(() => this._checkForReveals(), 1000);
  };

  _checkForReveals = async () => {
    const currStage = await this._rps.stage();
    if (currStage === 4) {
      const arr = [];
      for (let i = 0; i < 2; i++) {
        const c = await this._rps.players(i);
        arr.push(c);
      }
      this.setState({ revealedChoices: arr });
    }
  };

  _stopPollReveals = async () => {
    clearInterval(this._pollReveals);
    this._pollReveals = undefined;
  };

  _pollStages = async () => {
    this._pollStages = setInterval(() => this._checkStage(), 1000);
  };

  _stopPollStages = () => {
    clearInterval(this._pollStages);
    this._pollStages = undefined;
  };

  _checkStage = async () => {
    const currentStage = await this._rps.stage();
    this.setState({ stage: currentStage });
  };

  _checkChallenged = async () => {
    const challenger = await this._rps.challengedPlayers(
      this.state.selectedAddress
    );

    if (challenger !== ethers.constants.AddressZero) {
      const challenged = await this._rps.challengedPlayers(challenger);
      if (challenged !== ethers.constants.AddressZero) {
        this.setState({ challenged: this.state.selectedAddress });
        this.setState({ challengedPlayer: true });
        this.setState({ gameStarted: true });
      }
      this.setState({ challenger });
      // this won't work correctly if more than 2 people are trying to play at the same time,
      // but we'll assume only two players will attempt to play at a time
    }
  };

  _acceptChallenge = async () => {
    await this._rps.acceptChallenge(this.state.challenger);
    this.setState({ challenged: this.state.selectedAddress });
    this.setState({ challengedPlayer: true });
    this.setState({ gameStarted: true });
  };

  _rejectChallenge = async () => {
    await this._rps.rejectChallenge();
    // This is not enough because it is not waiting for the txn to be mined, so the user will have to wait and refresh the page.
    this.setState({ challenger: undefined });
  };

  // This method just clears part of the state.
  _dismissTransactionError() {
    this.setState({ transactionError: undefined });
  }

  // This method just clears part of the state.
  _dismissNetworkError() {
    this.setState({ networkError: undefined });
  }

  // This is an utility method that turns an RPC error into a human readable
  // message.
  _getRpcErrorMessage(error) {
    if (error.data) {
      return error.data.message;
    }

    return error.message;
  }

  // This method resets the state
  _resetState() {
    this.setState(this.initialState);
  }

  // This method checks if Metamask selected network is Localhost:8545
  _checkNetwork() {
    if (window.ethereum.networkVersion === HARDHAT_NETWORK_ID) {
      return true;
    }

    this.setState({
      networkError: "Please connect Metamask to Localhost:8545",
    });

    return false;
  }
}
