"use client"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { LitNodeClient, encryptString } from "@lit-protocol/lit-node-client";
import { AuthCallbackParams } from "@lit-protocol/types";
import { LIT_RPC, LitNetwork } from "@lit-protocol/constants";
import { LitAbility, LitAccessControlConditionResource, LitActionResource, createSiweMessageWithRecaps, generateAuthSig } from "@lit-protocol/auth-helpers";
import { disconnectWeb3 } from "@lit-protocol/auth-browser";
import { ethers } from 'ethers';
import { createClient } from '@supabase/supabase-js'
import * as Tooltip from "@radix-ui/react-tooltip"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

const NFT_CONTRACT_ADDRESS = '0xfdc5ecc2c57D8bE009C02b930518aa85e319B094';
const NFT_ABI = [
  "function mintNFT() public",
];


async function mintNFT() {
  if (typeof window.ethereum !== 'undefined') {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, signer);
      const tx = await nftContract.mintNFT();
      const receipt = await tx.wait();
      console.log('NFT minted successfully!', receipt.transactionHash);
      return receipt.transactionHash;
    } catch (error) {
      console.error('Error minting NFT:', error);
      throw error;
    }
  } else {
    console.error('MetaMask is not installed!');
    throw new Error('MetaMask is not installed');
  }
}

const genActionSource = (url: string) => {
    return `(async () => {
        const apiKey = await Lit.Actions.decryptAndCombine({
            accessControlConditions,
            ciphertext,
            dataToEncryptHash,
            authSig: null,
            chain: 'sepolia',
        });
        const headers = {
        'Content-Type': 'application/json',
        'Authorization': "Bearer " + apiKey,
        };
        let inputString = '';
        for (const data of encryptedData ?? []) {
            const userInput = await Lit.Actions.decryptAndCombine({
                accessControlConditions,
                ciphertext: data.ciphertext,
                dataToEncryptHash: data.dataToEncryptHash,
                authSig: null,
                chain: 'sepolia',
            });
            inputString += "#####" + userInput;
        }
        const data = {
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'You are a helpful assistant who will summarize data from a variety of users.  The users will submit predictions about three projects: BTC, ETH, and Lit Protocol, and you will summarize the predictions into a single prediction.  Their predictions will be separated by ##### .  Give a concise summary of the predictions, trying to find common themes and patterns.' },
                { role: 'user', content: inputString },
            ],
            max_tokens: 50,
            temperature: 0.7,
        };
        const text = await Lit.Actions.runOnce({ waitForResponse: true, name: "apiCall" }, async () => {
            const resp = await fetch("${url}", {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(data),
            });
            let dataResp = await resp.json();
            const textResp = dataResp.choices[0].message.content.trim();
            return textResp;
        });
        Lit.Actions.setResponse({ response: text });
    })();`;
}



const ONE_WEEK_FROM_NOW = new Date(
    Date.now() + 1000 * 60 * 60 * 24 * 7
).toISOString();

const genWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const ethersSigner = provider.getSigner();
      return ethersSigner;
    } else {
        console.error("MetaMask is not installed!");
        throw new Error("MetaMask is not installed");
    }
}


const genAuthSig = async (
    wallet: ethers.Signer,
    client: LitNodeClient,
    uri: string,
    resources: LitResourceAbilityRequest[]
) => {

    const address = await wallet.getAddress();
    console.log("genAuthSig address: ", address);

    let blockHash = await client.getLatestBlockhash();
    const message = await createSiweMessageWithRecaps({
        walletAddress: address,
        nonce: blockHash,
        litNodeClient: client,
        resources,
        expiration: ONE_WEEK_FROM_NOW,
        uri
    })
    const authSig = await generateAuthSig({
        signer: wallet,
        toSign: message,
        address: address
    });
    return authSig;
}

const genSession = async (
    wallet: ethers.Signer,
    client: LitNodeClient,
    resources: LitResourceAbilityRequest[]) => {
    let sessionSigs = await client.getSessionSigs({
        chain: "ethereum",
        resourceAbilityRequests: resources,
        authNeededCallback: async (params: AuthCallbackParams) => {
            if (!params.expiration) {
                throw new Error("expiration is required");
            }
            if (!params.resources) {
                throw new Error("resourceAbilityRequests is required");
            }
            if (!params.uri) {
                throw new Error("uri is required");
            }
            const authSig = genAuthSig(wallet, client, params.uri, params.resourceAbilityRequests ?? []);
            return authSig;
        }
    });

    return sessionSigs;
}


const writeToSupabase = async (ciphertext: string, dataToEncryptHash: string) => {
  const newEntry = {
    "ciphertext": ciphertext,
    "dataToEncryptHash": dataToEncryptHash,
  }
  const { data, error } = await supabase
    .from('tbl1')
    .insert([
      newEntry,
    ]);
    console.log("WROTE");
    console.log(data);
    console.log(error);
}

const fetchSupabase = async () => {
  const { data, error } = await supabase
    .from('tbl1')
    .select('*');

  if (error) {
    console.error(error);
  }
  console.log("SUPABASE RESULTS");
  console.log(data);
  console.log(error);
  return data;
}


export default function Component() {

  // Run this to reset signing
  // disconnectWeb3();

  const chain = 'sepolia';
  const [prediction, setPrediction] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [alphaText, setAlphaText] = useState("");

    let client = new LitNodeClient({
        litNetwork: LitNetwork.DatilDev,
        debug: true
    });

  const accessControlConditions = [
    {
      contractAddress: '0xfdc5ecc2c57D8bE009C02b930518aa85e319B094',
      standardContractType: 'ERC721',
      chain,
      method: 'balanceOf',
      parameters: [
        ':userAddress'
      ],
      returnValueTest: {
        comparator: '>',
        value: '0'
      }
    }
  ]

    const encryptAndSetMessage = async () => {
    await client.connect();
    console.log("prediction: ", prediction);
     const { ciphertext, dataToEncryptHash } = await encryptString(
         {
             accessControlConditions,
             dataToEncrypt: prediction,
         },
         client
     );
     // Want to store it to supabase
     await writeToSupabase(ciphertext, dataToEncryptHash);
     console.log( ciphertext, dataToEncryptHash )
     client.disconnect();
     setSubmitted(true);
    }

    const fetchAndSetMessage = async () => {

    const encryptedData = await fetchSupabase();
    // console.log("encryptedData: ", encryptedData);
    // let inputString = "";
    // for (const data of encryptedData ?? []) {
    //     console.log("data: ", data.ciphertext, data.dataToEncryptHash);
    //     inputString += "#####\n" +data.ciphertext + "\n";
    //     const dat = data.ciphertext;
    // }
    // console.log("inputString: ", inputString);
    // return ;

    await client.connect();

    const wallet = await genWallet();
    console.log("wallet: ", wallet);

    const ciphertext = process.env.NEXT_PUBLIC_API_CIPHERTEXT!;
    const dataToEncryptHash = process.env.NEXT_PUBLIC_API_DATA_TO_ENCRYPT_HASH!;
    const accsResourceString =
        await LitAccessControlConditionResource.generateResourceString(accessControlConditions as any, dataToEncryptHash);
    const sessionForDecryption = await genSession(wallet, client, [
        {
            resource: new LitActionResource('*'),
            ability: LitAbility.LitActionExecution,
        },
        {
            resource: new LitAccessControlConditionResource(accsResourceString),
            ability: LitAbility.AccessControlConditionDecryption,

        }
    ]
    );

  const url = 'https://api.openai.com/v1/chat/completions';
    const res = await client.executeJs({
        sessionSigs: sessionForDecryption,
        code: genActionSource(url),
        jsParams: {
            accessControlConditions,
            ciphertext,
            dataToEncryptHash,
            encryptedData,
        }
    });
    const resText = typeof res.response === 'string' ? res.response : JSON.stringify(res.response);
    console.log("resText: ", resText);
    setAlphaText(resText);
    client.disconnect();
    };


  return (
    <div 
      className="flex flex-col min-h-[100dvh] bg-gradient-to-b from-[#1E293B] to-[#0F172A] text-white"
      style={{
        backgroundImage: "url('/LightBackground.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <header className="py-8 px-4 md:px-6 lg:px-8">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl text-white">Lit Alpha Box</h1>
        </div>
      </header>
      <main className="flex-1 py-12 px-4 md:px-6 lg:px-8">
        <div className="container mx-auto max-w-3xl space-y-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">The Wisdom of Crowds</h2>
            <p className="mt-4 text-lg text-gray-400">
                Harness the collective intelligence of the community to make informed decisions.  The wisdom of crowds principle suggests that collective decision-making, when diverse and independent, can lead to more accurate outcomes than relying on individual experts.  Share your predictions to learn what others are thinking!
            </p>
          </div>
          <div>
            <label htmlFor="prediction" className="block text-sm font-medium">
              What are your predictions for BTC, ETH, and Lit Protocol?
            </label>
            <div className="mt-1 flex flex-col gap-2">
              <Textarea
                id="prediction"
                name="prediction"
                rows={3}
                className="block w-full rounded-md border-gray-600 bg-gray-700 px-4 py-3 text-white focus:border-primary focus:ring-primary"
                placeholder="Enter your prediction..."
                value={prediction}
                onChange={(e) => setPrediction(e.target.value)}
              />
              <Button className="flex-shrink-0" onClick={() => encryptAndSetMessage()}>
                1. Submit prediction
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <Tooltip.Provider>
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <div>
                    <Button 
                      className="flex-1 w-full" 
                      disabled={!submitted} 
                      onClick={() => mintNFT()}
                    >
                      2. Mint NFT
                    </Button>
                  </div>
                </Tooltip.Trigger>
                {!submitted && (
                  <Tooltip.Portal>
                    <Tooltip.Content
                      className="bg-gray-800 text-white px-3 py-2 rounded shadow-lg z-50"
                      sideOffset={5}
                      side="top"
                    >
                      Submit a prediction to mint the NFT!
                      <Tooltip.Arrow className="fill-gray-800" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                )}
              </Tooltip.Root>
            </Tooltip.Provider>
            <Button variant="secondary" className="flex-1" onClick={() => fetchAndSetMessage()}>
              3. Unlock Alpha
            </Button>
            <div className="bg-gray-800 p-4 rounded-md">
              <p>{alphaText || "Click unlock alpha to see text here"}</p>
            </div>
          </div>
        </div>
      </main>
      <footer className="bg-gray-800 py-6 px-4 md:px-6 lg:px-8">
        <div className="container mx-auto text-center text-sm text-gray-400">
          &copy; 2024 Lit Alpha Box. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
