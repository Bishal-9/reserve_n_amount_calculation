require("dotenv").config()

const ethers = require("ethers")
const abi = require("./abi")

const POOL_ADDRESS = process.env.POOL_ADDRESS.toString().trim()
const INFURA_API_KEY = process.env.INFURA_API_KEY.toString().trim()

let usdc_reserve
let weth_reserve
let pool_constant

const main = async () => {
    const socket_provider_url =
        "wss://mainnet.infura.io/ws/v3/" + INFURA_API_KEY

    const provider = new ethers.WebSocketProvider(socket_provider_url)
    const pool_abi = await abi(POOL_ADDRESS)

    const pool_contract = new ethers.Contract(POOL_ADDRESS, pool_abi, provider)

    pool_contract.on(
        "Swap",
        async (sender, amount0In, amount1In, amount0Out, amount1Out, to) => {
            console.log(`

        Swap Event :-

        Sender                      ${sender}
        Amount 0 In                 ${amount0In}
        Amount 1 In                 ${amount1In}
        Amount 0 Out                ${amount0Out}
        Amount 1 Out                ${amount1Out}
        To                          ${to}
        `)
            await pool_contract
                .getFunction("getReserves")()
                .then((_response) => {
                    // console.log("Reserves Response: ", _response)

                    console.log("Received USDC Reserve: ", _response._reserve0)
                    console.log("Received WETH Reserve: ", _response._reserve1)

                    if (!usdc_reserve && !weth_reserve) {
                        usdc_reserve = BigInt(_response._reserve0.toString())
                        weth_reserve = BigInt(_response._reserve1.toString())
                        pool_constant = usdc_reserve * weth_reserve
                    } else {
                        if (BigInt(amount0In) > 0 && BigInt(amount1Out) > 0) {
                            let amount1ToBeOut =
                                (BigInt(amount0In) *
                                    BigInt(997) *
                                    BigInt(weth_reserve)) /
                                (BigInt(usdc_reserve) * BigInt(1000) +
                                    BigInt(amount0In) * BigInt(997))
                            if (amount1ToBeOut === BigInt(amount1Out)) {
                                console.log("Calculated Amount 1 Out matched!!")
                            } else {
                                console.log(
                                    "Calculation wrong for Amount 1 Out"
                                )
                            }

                            usdc_reserve =
                                BigInt(usdc_reserve) + BigInt(amount0In)
                            weth_reserve =
                                BigInt(weth_reserve) - BigInt(amount1Out)
                        } else if (
                            BigInt(amount1In) > 0 &&
                            BigInt(amount0Out) > 0
                        ) {
                            let amount0ToBeOut =
                                (BigInt(amount1In) *
                                    BigInt(997) *
                                    BigInt(usdc_reserve)) /
                                (BigInt(weth_reserve) * BigInt(1000) +
                                    BigInt(amount1In) * BigInt(997))
                            if (amount0ToBeOut === BigInt(amount0Out)) {
                                console.log("Calculated Amount 0 Out matched!!")
                            } else {
                                console.log(
                                    "Calculation wrong for Amount 0 Out"
                                )
                            }

                            usdc_reserve =
                                BigInt(usdc_reserve) - BigInt(amount0Out)
                            weth_reserve =
                                BigInt(weth_reserve) + BigInt(amount1In)
                        }

                        if (
                            BigInt(_response._reserve1) === BigInt(weth_reserve)
                        ) {
                            console.log("WETH Reserve calculation matched")
                        } else if (
                            BigInt(_response._reserve0) === BigInt(usdc_reserve)
                        ) {
                            console.log("USDC Reserve calculation matched")
                        } else {
                            console.log(
                                `Existing USDC Reserve is ${BigInt(
                                    usdc_reserve
                                )} and got update of ${BigInt(
                                    _response._reserve0
                                )}`
                            )
                            console.log(
                                `Existing WETH Reserve is ${BigInt(
                                    weth_reserve
                                )} and got update of ${BigInt(
                                    _response._reserve1
                                )}`
                            )

                            usdc_reserve = BigInt(
                                _response._reserve0.toString()
                            )
                            weth_reserve = BigInt(
                                _response._reserve1.toString()
                            )
                            pool_constant = usdc_reserve * weth_reserve
                        }
                    }

                    console.log("Updated USDC Reserve to: ", usdc_reserve)
                    console.log("Updated WETH Reserve to: ", weth_reserve)
                })
                .catch((_error) => {
                    console.log("Reserve Fetching Error: ", _error)
                })
        }
    )
}
main()
