import { ethers } from "ethers";
import React, { useEffect, useState } from "react";
import "./App.css";
import imge from "./utils/ws.PNG";
import abi from "./utils/WavePortal.json";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import Spinner from "react-bootstrap/Spinner";
import FigureImage from "react-bootstrap/FigureImage";
import Figure from "react-bootstrap/Figure";
import InputGroup from "react-bootstrap/InputGroup";
import FormControl from "react-bootstrap/FormControl";

const App = () => {
	//Just a state variable we use to store our user's public wallet.
	const [currentAccount, setCurrentAccount] = useState("");
	const [stateSpin, setStateSpin] = useState(false);
	const [stateError, setStateError] = useState(false);

	/*
	 * All state property to store all waves
	 */
	const [allWaves, setAllWaves] = useState([]);

	const contractAddress = "0x58C8F5784D4016C490A8fE3103dDc0E835218E59";
	/**
	 * Create a variable here that references the abi content!
	 */
	const ContractAbi = abi.abi;

	const checkIfWalletIsConnected = async () => {
		/*
		 * First make sure we have access to window.ethereum
		 */
		try {
			const { ethereum } = window;

			if (!ethereum) {
				console.log("Make sure you have metamask!");
			} else {
				console.log("We have the ethereum object", ethereum);
			}

			//Check if we're authorized to access the user's wallet
			const accounts = await ethereum.request({ method: "eth_accounts" });

			if (accounts.length !== 0) {
				const account = accounts[0];
				console.log("Found an authorized account:", account);
				setCurrentAccount(account);
				getAllWaves(); // llamamos los waves cuando tenemos un cuenta conectada y autorizada
			} else {
				console.log("No authorized account found");
			}
		} catch (error) {
			console.log(error);
		}
	};

	/**
	 * Implement your connectWallet method here
	 */
	const connectWallet = async () => {
		try {
			const { ethereum } = window;
			if (!ethereum) {
				alert("Get Metamask");
				return;
			}

			const accounts = await ethereum.request({ method: "eth_requestAccounts" });

			setCurrentAccount(accounts[0]);
			console.log("Conneted: ", accounts[0]);
		} catch (error) {
			console.log(error);
		}
	};

	// Calling our wave contract from the blockchain

	const wave = async () => {
		try {
			const { ethereum } = window;
			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const wavePortalContract = new ethers.Contract(contractAddress, ContractAbi, signer);

				let count = await wavePortalContract.getTotalWaves();
				console.log("Retrieved total wave count...", count.toNumber());

				let msg = document.getElementById("msg").value;
				console.log("mensaje: ", msg);

				/*
				 * Execute the actual wave from your smart contract
				 */
				const waveTxn = await wavePortalContract.wave(msg);
				console.log("Mining...", waveTxn.hash);

				setStateSpin(true); // para que aparezca el spin de cargando

				await waveTxn.wait();
				console.log("Mined --", waveTxn.hash);

				setStateSpin(false); // desaparemos el spin

				count = await wavePortalContract.getTotalWaves();
				console.log("Retrieved total wave count...", count.toNumber());
			} else {
				console.log("Ethereum object doesn't exist!");
			}
		} catch (error) {
			console.error(error);
			setStateError(true);
		}
	};

	/*
	 * Create a method that gets all waves from your contract
	 */
	const getAllWaves = async () => {
		try {
			const { ethereum } = window;
			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const wavePortalContract = new ethers.Contract(contractAddress, ContractAbi, signer);

				/*
				 * Call the getAllWaves method from your Smart Contract
				 */
				const waves = await wavePortalContract.getAllWaves();

				const wavesCleaned = waves.map((wave) => {
					return {
						address: wave.waver,
						timestamp: new Date(wave.timestamp * 1000),
						message: wave.message,
					};
				});

				/*
				 * Store our data in React State
				 */
				setAllWaves(wavesCleaned);
			} else {
				console.log("Ethereum object doesn't exist!");
			}
		} catch (error) {
			console.log(error);
		}
	};

	/*
	 * This runs our function when the page loads.
	 */
	/**
	 * Listen in for emitter events!
	 */
	useEffect(() => {
		let wavePortalContract;

		const onNewWave = (from, timestamp, message) => {
			console.log("NewWave", from, timestamp, message);
			setAllWaves((prevState) => [
				...prevState,
				{
					address: from,
					timestamp: new Date(timestamp * 1000),
					message: message,
				},
			]);
		};

		if (window.ethereum) {
			const provider = new ethers.providers.Web3Provider(window.ethereum);
			const signer = provider.getSigner();

			wavePortalContract = new ethers.Contract(contractAddress, ContractAbi, signer);
			wavePortalContract.on("newWave", onNewWave);
		}

		return () => {
			if (wavePortalContract) {
				wavePortalContract.off("newWave", onNewWave);
			}
		};
	}, []);
	useEffect(() => {
		checkIfWalletIsConnected();
	}, []);

	return (
		<div className="mainContainer">
			<div className="dataContainer">
				<Alert variant="success">
					<Alert.Heading>Hey 👋, nice to see you!</Alert.Heading>
					<hr />
					<p>I am Mike, wassssaaaappp!!</p>
				</Alert>

				<Figure>
					<FigureImage width={171} height={180} alt="171x180" src={imge} />
				</Figure>
				{stateSpin && (
					<Spinner animation="border" role="status" variant="warning">
						<span className="visually-hidden">Loading...</span>
					</Spinner>
				)}
				<br></br>
				<InputGroup className="mb-3">
					<FormControl id="msg" placeholder="write a Message" aria-label="write a Message" aria-describedby="basic-addon1" />
				</InputGroup>

				<Button className="waveButton" variant="success" size="lg" onClick={wave}>
					Wave at Me
				</Button>
				<br></br>
				{stateError && (
					<Alert variant="warning">
						<Alert.Heading>Error:</Alert.Heading>
						<hr />
						<p>You have to wait at least 15 minutes to wave</p>
					</Alert>
				)}

				{/*
				 * If there is no currentAccount render this button
				 */}
				{!currentAccount && (
					<Button className="waveButton" variant="primary" size="lg" onClick={connectWallet}>
						Connect Wallet
					</Button>
				)}

				{allWaves.map((wave, index) => {
					return (
						<div key={index} style={{ backgroundColor: "#AFF9F8", marginTop: "16px", padding: "8px" }}>
							<div>Address: {wave.address}</div>
							<div>Time: {wave.timestamp.toString()}</div>
							<div>Message: {wave.message}</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default App;
