import {
  Connection,
  PublicKey,
  Keypair,
  TransactionInstruction,
  SystemProgram,
  Transaction,
  Message,
  sendAndConfirmTransaction,
  clusterApiUrl,
  sendAndConfirmRawTransaction,
} from '@solana/web3.js'
import axios from 'axios'
import dotenv from 'dotenv'
import bs58 from 'bs58'

dotenv.config()

const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed')

const walletKeyPair = Keypair.fromSecretKey(
  Buffer.from(bs58.decode(process.env.PRIVATE_KEY! || ''))
)

const bearerToken = process.env.BEARER_TOKEN!

const nftCollectionAddress = 'open_solmap' //new PublicKey(
//'smccQeqMfKUE3W4a1tQHDxUnx122y3eUoV21JDnQj54'
//)

const meBaseUrl = 'https://api-mainnet.magiceden.dev/v2'

async function getListings() {
  try {
    const options = {
      method: 'GET',
      url: `https://api-mainnet.magiceden.dev/v2/collections/${nftCollectionAddress}/listings`,
      params: { limit: 20 },
      headers: {
        accept: 'application/json',
      },
    }

    const response = await axios.request(options)
    //console.log(response.data)
    return response.data
  } catch (error) {
    console.error('Error fetching listings:', error)

    return []
  }
}

async function getBuyInstruction(listing: any) {
  try {
    if (!listing.auctionHouseAddress) {
      const options = {
        method: 'GET',
        url: `${meBaseUrl}/instructions/buy_now`,
        headers: {
          accept: 'application/json',
          authorization: `Bearer ${bearerToken}`,
        },
        params: {
          buyer: walletKeyPair.publicKey.toString(),
          seller: listing.seller,
          tokenMint: listing.token.mintAddress,
          tokenATA: listing.token.tokenAddress,
          price: listing.price,
          auctionHouseAddress: 'E8cU1WiRWjanGxmn96ewBgk9vPTcL6AEZ1t6F6fkgUWe',
        },
      }
      const response = await axios.request(options)
      //console.log(response.data)
      return response.data
    } else {
      const options = {
        method: 'GET',
        url: `${meBaseUrl}/instructions/buy_now`,
        headers: {
          accept: 'application/json',
          authorization: `Bearer ${bearerToken}`,
        },
        params: {
          buyer: walletKeyPair.publicKey.toString(),
          seller: listing.seller,
          tokenMint: listing.token.mintAddress,
          tokenATA: listing.token.tokenAddress,
          price: listing.price,
          auctionHouseAddress: listing.auctionHouseAddress,
        },
      }

      const response = await axios.request(options)
      //console.log(response.data)
      return response.data
    }
  } catch (error) {
    throw new Error(
      'Error getting buy instruction: ' + (error as Error).message
    )
  }
}

async function buyNFT(listings: any[], amount: number) {
  try {
    for (let i = 0; i < amount && i < listings.length; i++) {
      const floorListing = listings[i]

      const buyInstruction = await getBuyInstruction(floorListing)

      const buyTxn = Transaction.from(Buffer.from(buyInstruction.txSigned))

      //buyTxn.partialSign(walletKeyPair)

      const txid = await sendAndConfirmTransaction(connection, buyTxn, [
        walletKeyPair,
      ])

      console.log('Transaction sent and confirmed succeddfully')
      console.log(`https://explorer.solana.com/tx/${txid}`)
    }
  } catch (error) {
    console.log('Error while buying NFT:', error)
  }
}

async function main() {
  try {
    const listings = await getListings()

    const amountToBuy = 1
    await buyNFT(listings, amountToBuy)
  } catch (error) {
    console.error('Error occurred:', error)
  }
}

async function test() {
  const listings = await getListings()

  await getBuyInstruction(listings[1])
}

console.clear()
main()
