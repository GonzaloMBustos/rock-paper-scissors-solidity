//SPDX-License-Identifier: MIT

// Solidity files have to start with this pragma.
// It will be used by the Solidity compiler to validate its version.
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract RPS is AccessControl {

	modifier onlyChallengedPlayers(address player) {
		require(challengedPlayers[player] != address(0));
		_;
	}

	enum Choice {
		None,
		Rock,
		Paper,
		Scissors
	}

	enum Stage {
		FirstCommit,
		SecondCommit,
		FirstReveal,
		SecondReveal,
		DeclareWinner
	}

	struct CommitChoice {
		address playerAddress;
		bytes32 commitment;
		Choice choice;
		uint256 playerBet;
	}

	event Commit(address player);
	event Reveal(address player, Choice choice);
	event DeclareWinner(address player, uint256 amount);

	mapping(address => address) public challengedPlayers;

	// Initialization arguments
	uint256 public bet;
	uint256 public revealSpan;

	// State variables
	CommitChoice[2] public players;
	uint256 public revealDeadline;
	Stage public stage = Stage.FirstCommit;

	constructor(uint256 _bet, uint256 _revealSpan) {
		bet = _bet;
		revealSpan = _revealSpan;
	}

	function challenge(address challengedPlayer) external {
		require(challengedPlayers[challengedPlayer] == address(0), "already challenged player");
		challengedPlayers[challengedPlayer] = msg.sender;
	}

	function acceptChallenge(address challengerPlayer) external {
		require(challengedPlayers[msg.sender] != address(0), "player hasn't been challenged yet");
		challengedPlayers[challengerPlayer] = msg.sender;
	}

	function rejectChallenge() external {
		require(challengedPlayers[msg.sender] != address(0), "player hasn't been challenged yet");
		delete challengedPlayers[msg.sender];
	}

	function commit(bytes32 commitment) public payable onlyChallengedPlayers(msg.sender) {
		// Only run during commit stages
		uint256 playerIndex;
		if (stage == Stage.FirstCommit) playerIndex = 0;
		else if (stage == Stage.SecondCommit) playerIndex = 1;
		else revert("both players have already played");

		require(msg.value >= bet, "no bets can be smaller than minimum amount");

		// Store the commitment
		players[playerIndex] = CommitChoice(msg.sender, commitment, Choice.None, msg.value);

		// Emit the commit event
		emit Commit(msg.sender);

		// If we're on the first commit, move to the second
		if (stage == Stage.FirstCommit) stage = Stage.SecondCommit;
		else stage = Stage.FirstReveal;
	}

	function reveal(Choice choice) public onlyChallengedPlayers(msg.sender){
		// Only run during reveal stages
		require(stage == Stage.FirstReveal || stage == Stage.SecondReveal, "not at reveal stage");
		// Only accept valid choices
		require(choice == Choice.Rock || choice == Choice.Paper || choice == Choice.Scissors, "invalid choice");

		// Find the player's index
		uint256 playerIndex;
		if (players[0].playerAddress == msg.sender) playerIndex = 0;
		else if (players[1].playerAddress == msg.sender) playerIndex = 1;
		// Revert if unknown player
		else revert("unknown player");

		CommitChoice storage commitChoice = players[playerIndex];

		// THIS HASHING HAS NOT BEEN SALTED FOR SIMPLICITY, BUT SHOULD BE!
		require(keccak256(abi.encodePacked(msg.sender, choice)) == commitChoice.commitment, "invalid hash");

		commitChoice.choice = choice;

		emit Reveal(msg.sender, commitChoice.choice);

		if (stage == Stage.FirstReveal) {
			revealDeadline = block.number + revealSpan;
			require(revealDeadline >= block.number, "overflow error");
			stage = Stage.SecondReveal;
		}
		else stage = Stage.DeclareWinner;
	}

	function declareWinner() public {
		// To declareWinner we need:
		// a) to be in declareWinner stage OR
		// b) still in the second reveal stage but past the deadline

		require(stage == Stage.DeclareWinner || (stage == Stage.SecondReveal && revealDeadline <= block.number), "cannot yet declareWinner");

		// Calculate value of payouts for players
		uint256 player0Payout;
		uint256 player1Payout;
		uint256 winningAmount = players[0].playerBet + players[1].playerBet;
		require(winningAmount >= players[0].playerBet, "overflow error");

		// If both players picked the same choice, return their bets
		if (players[0].choice == players[1].choice) {
			// Recommended way of sending ether
			(bool success0,) = players[0].playerAddress.call{value: players[0].playerBet}("");
			(bool success1,) = players[1].playerAddress.call{value: players[1].playerBet}("");
			require(success0 && success1, "couldnt pay");
			player0Payout = 0;
			player1Payout = 0;
		}
		else if (players[0].choice == Choice.None) {
			player1Payout = winningAmount;
		}
		else if (players[1].choice == Choice.None) {
			player0Payout = winningAmount;
		}
		else if (players[0].choice == Choice.Rock) {
			assert(players[1].choice == Choice.Paper || players[1].choice == Choice.Scissors);
			if (players[1].choice == Choice.Paper) {
				// Rock loses to paper
				player1Payout = winningAmount;
			}
			else if (players[1].choice == Choice.Scissors) {
				// Rock beats scissors
				player0Payout = winningAmount;
			}
		}
		else if (players[0].choice == Choice.Paper) {
			assert(players[1].choice == Choice.Rock || players[1].choice == Choice.Scissors);
			if(players[1].choice == Choice.Rock) {
				// Paper beats rock
				player0Payout = winningAmount;
			}
			else if(players[1].choice == Choice.Scissors) {
				// Paper loses to scissors
				player1Payout = winningAmount;
			}
		}
		else if(players[0].choice == Choice.Scissors) {
			assert(players[1].choice == Choice.Paper || players[1].choice == Choice.Rock);
			if(players[1].choice == Choice.Rock) {
				// Scissors lose to rock
				player1Payout = winningAmount;
			}
			else if(players[1].choice == Choice.Paper) {
				// Scissors beats paper
				player0Payout = winningAmount;
			}
		}

		if (player0Payout > player1Payout) {
			(bool success,) = players[0].playerAddress.call{value: player0Payout}("");
			require(success, "couldnt pay");
			emit DeclareWinner(players[0].playerAddress, player0Payout);

		} else if (player1Payout > player0Payout) {
			(bool success,) = players[1].playerAddress.call{value: player1Payout}("");
			require(success, "couldnt pay");
			emit DeclareWinner(players[1].playerAddress, player1Payout);
		}

		delete challengedPlayers[players[0].playerAddress];
		delete challengedPlayers[players[1].playerAddress];
		stage = Stage.FirstCommit;
	}

	function hashPacked(address _addr, Choice _choice) external pure returns(bytes32 h) {
		// This hash isn't salted for simplicity of storing the salt value
		// but it should be salted in production
		return keccak256(abi.encodePacked(_addr, _choice));
	}
}