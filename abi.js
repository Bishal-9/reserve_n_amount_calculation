const get_abi = async (contract_address) => {
    let response
    const url = `https://api.etherscan.io/api?module=contract&action=getabi&address=${contract_address}&apikey=${process.env.ETHERSCAN_API_KEY.toString().trim()}`

    await fetch(url)
        .then((_response) => _response.json())
        .then((_data) => (response = JSON.parse(_data?.result)))
        .catch((_error) =>
            console.log("Etherscan ABI fetching error: ", _error)
        )

    return response
}

module.exports = get_abi
