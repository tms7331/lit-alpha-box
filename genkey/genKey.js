//@ts-nocheck
import { LitNodeClient, encryptString } from "@lit-protocol/lit-node-client";
import { LIT_RPC, LitNetwork } from "@lit-protocol/constants";
import { ethers } from 'ethers';
const key = "<KEY HERE>";
const ONE_WEEK_FROM_NOW = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
const genProvider = () => {
    return new ethers.providers.JsonRpcProvider(LIT_RPC.CHRONICLE_YELLOWSTONE);
};
const genWallet = () => {
    // known private key for testing
    return new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', genProvider());
};
const main = async () => {
    let client = new LitNodeClient({
        litNetwork: LitNetwork.DatilDev,
        debug: true
    });
    // We can encode with any wallet
    const wallet = genWallet();
    const chain = 'sepolia';
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
    ];
    await client.connect();
    const { ciphertext, dataToEncryptHash } = await encryptString({
        accessControlConditions,
        dataToEncrypt: key,
    }, client);
    console.log("RESULTING VALUES:");
    console.log(ciphertext);
    console.log(dataToEncryptHash);
    client.disconnect();
};
await main();
