/**
 * v0 by Vercel.
 * @see https://v0.dev/t/bDA0dc58k9R
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LitNodeClient, encryptString } from "@lit-protocol/lit-node-client";
import { AuthCallbackParams } from "@lit-protocol/types";
import { LIT_RPC, LitNetwork } from "@lit-protocol/constants";
import { LitAbility, LitAccessControlConditionResource, LitActionResource, createSiweMessageWithRecaps, generateAuthSig } from "@lit-protocol/auth-helpers";
import { ethers } from 'ethers';


const genActionSource = (url: string) => {
    return `(async () => {
        const apiKey = await Lit.Actions.decryptAndCombine({
            accessControlConditions,
            ciphertext,
            dataToEncryptHash,
            authSig: null,
            chain: 'ethereum',
        });
        const headers = {
        'Content-Type': 'application/json',
        'Authorization': "Bearer " + apiKey,
        };
        const data = {
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'You are a helpful assistant.' },
                { role: 'user', content: 'When was the Roman empire founded?' },
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

const genProvider = () => {
    return new ethers.providers.JsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE);
}

const genWallet = () => {
    return new ethers.Wallet(process.env.NEXT_PUBLIC_W3_KEY!, genProvider());
}

const genAuthSig = async (
    wallet: ethers.Wallet,
    client: LitNodeClient,
    uri: string,
    resources: LitResourceAbilityRequest[]
) => {

    let blockHash = await client.getLatestBlockhash();
    const message = await createSiweMessageWithRecaps({
        walletAddress: wallet.address,
        nonce: blockHash,
        litNodeClient: client,
        resources,
        expiration: ONE_WEEK_FROM_NOW,
        uri
    })
    const authSig = await generateAuthSig({
        signer: wallet,
        toSign: message,
        address: wallet.address
    });
    return authSig;
}

const genSession = async (
    wallet: ethers.Wallet,
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


export default function Component() {
  const [message, setMessage] = useState("")

    let client = new LitNodeClient({
        litNetwork: LitNetwork.DatilDev,
        debug: true
    });

    const wallet = genWallet();
    const chain = 'ethereum';

    const accessControlConditions = [
        {
            contractAddress: '',
            standardContractType: '',
            chain,
            method: 'eth_getBalance',
            parameters: [':userAddress', 'latest'],
            returnValueTest: {
                comparator: '>=',
                value: '0',
            },
        },
    ];


    const encryptAndSetMessage = async () => {
    await client.connect();
     const { ciphertext, dataToEncryptHash } = await encryptString(
         {
             accessControlConditions,
             dataToEncrypt: "some_secret_input",
         },
         client
     );
     console.log( ciphertext, dataToEncryptHash )
     setMessage(ciphertext);
     client.disconnect();
    }

    const fetchAndSetMessage = async () => {

    await client.connect();

    const ciphertext = "";
    const dataToEncryptHash = "";

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
        }
    });
    const resText = typeof res.response === 'string' ? res.response : JSON.stringify(res.response);
    setMessage(resText);
    client.disconnect();
    };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background">
      <div className="space-x-4">
        <Button
          onClick={() => encryptAndSetMessage()}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Primary Button
        </Button>
        <Button
          onClick={() => fetchAndSetMessage()}
          className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
        >
          Secondary Button
        </Button>
      </div>
      {message && <div className="mt-8 p-4 rounded-md bg-card text-card-foreground">{message}</div>}
    </div>
  )
}
