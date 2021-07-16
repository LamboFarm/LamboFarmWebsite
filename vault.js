var contracts = [];
var contractsPairs = [];
var userBalancesStakingTokens = [];
var userAllowedStakingTokens = [];
var userBalancesPools = [];
var userBalancesTokens = [];
var userRewardsPools = [];
var totalBalancesPools = [];
var totalSupply = [];
var totalStaked = [];
var rewardRates = [];
var reserves = [];
var pricesPerFullShare = [];

const getTokenByAddress = function(address) {
    for(var i = 0; i < tokens.length; i++) {
        if(address == tokens[i].address) {
            return tokens[i];
        }
    }
    return false;
}

const getTokenBySymbol = function(symbol) {
    for(var i = 0; i < tokens.length; i++) {
        if(symbol == tokens[i].symbol) {
            return tokens[i];
        }
    }
    return false;
}

const getVaultId = function(vault) {
    return vault.depositToken + '--' + vault.rewardToken;
}

const getVaultById = function(id) {
    for(var i = 0; i < vaults.length;i++) {
        if(id == getVaultId(vaults[i])) {
            return vaults[i];
        }
    }
}

const getVaultByAddress = function(address) {
    for(var i = 0; i < vaults.length;i++) {
        if(address == vaults[i].address) {
            return vaults[i];
        }
    }
}


const weiToDecimal = function (value, tokenSymbol) {
    return value / (10**getTokenBySymbol(tokenSymbol).decimals);
}

const getPairByTokenSymbols = function(baseTokenSymbol, quoteTokenSymbol) {
    for(var i = 0; i < pairs.length; i++) {
        if(baseTokenSymbol == pairs[i].token0 && quoteTokenSymbol == pairs[i].token1) {
            return pairs[i];
        } else if(baseTokenSymbol == pairs[i].token1 && quoteTokenSymbol == pairs[i].token0) {
            return pairs[i];
        }
    }
    return false;
}

const getTokenPrice = function(tokenSymbol, quoteTokenSymbol) {
    if(quoteTokenSymbol != mainTokenSymbol) {
        return -1;
    }
    if(tokenSymbol == quoteTokenSymbol) {
        return 1;
    }
    var pair = getPairByTokenSymbols(tokenSymbol, quoteTokenSymbol);

    if(!reserves[pair.address]) {
        return 0;
    }

    var token = getTokenBySymbol(tokenSymbol);
    var quoteToken = getTokenBySymbol(quoteTokenSymbol);

    var reserve0 = reserves[pair.address][0] / (10**token.decimals);
    var reserve1 = reserves[pair.address][1] / (10**quoteToken.decimals);

    if(pair.is_switched === true) {
        reserve0 = reserves[pair.address][0] / (10**quoteToken.decimals);
        reserve1 = reserves[pair.address][1] / (10**token.decimals);
        return reserve0 / reserve1;
    }
    return reserve1 / reserve0;
}





const messageVault = function(vaultId, message, txHash) {
    removeMessage();
    if(txHash) {
        message+= ' <a href="' + explorerUrl + txHash + '" target="_blank">View TX</a>';
    }
    $('*[data-vault="' + vaultId +'"] .messages').html(message);
}

const removeMessage = function () {
    $('.messages').html('');
}


const fv = function(value) {
    var result = value;
    if(result >= 10000000) {          // 10m
        result = result / 1000000;
        result = Math.round(result);
        result+= 'm';
    } else if(result > 1000000) {   // 1m
        result = result / 1000000;
        result = result * 100;
        result = Math.round(result);
        result = result / 100;
        result+= 'm';
    } else if(result > 100) {
        result = result * 100;
        result = Math.round(result);
        result = result / 100;
    } else {
        result = result * 10000;
        result = Math.round(result);
        result = result / 10000;
    }
    return result;
}

const updateApy = function() {
    for(var i = 0; i < pools.length; i++) {
        var pool = pools[i];

        var apy = '-';

        if(pool.apyEnabled) {
            if(pool.stakingToken == pool.rewardToken) {
                apy = rewardRates[pool.address] * 60 * 60 * 24 * 365; // total rewards per year
                apy = apy / totalBalancesPools[pool.address] * 100; // total rewards per year per deposited token
            } else if(getTokenBySymbol(pool.stakingToken).is_lp == true) {
                var totalSupplyLPInLambo = reserves[pool.pair][0] * 2;
                apy = rewardRates[pool.address] * 60 * 60 * 24 * 365; // total rewards per year
                apy = apy / totalSupplyLPInLambo * 100;

            } else if(pool.stakingToken == mainTokenSymbol) {
                apy = rewardRates[pool.address] * 60 * 60 * 24 * 365; // total rewards per year
                var lamboprice = reserves['0xefcfa1f3cb9828bbc60e3a47cffc7910ae7c35d9'][1] / reserves['0xefcfa1f3cb9828bbc60e3a47cffc7910ae7c35d9'][0];
                apy = apy * lamboprice;
                var worth = totalBalancesPools[pool.address];
                apy = apy / worth * 100;
            } else {
                if(reserves[pool.pair]) {
                    apy = rewardRates[pool.address] * 60 * 60 * 24 * 365; // total rewards per year
                    var lamboprice = reserves['0xefcfa1f3cb9828bbc60e3a47cffc7910ae7c35d9'][1] / reserves['0xefcfa1f3cb9828bbc60e3a47cffc7910ae7c35d9'][0];
                    apy = apy * lamboprice;
                    var pairPrice = reserves[pool.pair][1] / reserves[pool.pair][0];
                    if(pool.switched == true) {
                        pairPrice = reserves[pool.pair][0] / reserves[pool.pair][1];
                    }
                    var worth = totalBalancesPools[pool.address] * pairPrice;
                    apy = apy / worth * 100;
                }
            }
            apy = Math.round(apy);
            apy+= '<sup>%</sup>';
        }

        $('tr[data-pool="' + getPoolId(pool)  + '"] .display--apy').html(apy);
    }
}



const fetchMainTokenUserBalance = function() {
    web3.eth.getBalance(account, function(error, result) {
        if(!error) {
            userBalancesTokens[mainTokenSymbol] = result;
        } else {
            console.log(error);
        }
    });
    updateToken(mainTokenSymbol)
}

const fetchTokenUserBalance = function(address) {
    var contract = new window.web3.eth.Contract(abiERC20, address);
    contract.methods.balanceOf(account).call({from:account}, function (error, result) {
        if(!error) {
            userBalancesTokens[address] = result;
        } else {
            console.log(error);
        }
        updateToken(address);
    });
}

const fetchApproval = function(address) {
    var vault = getVaultByAddress(address);
    var depositToken = getTokenBySymbol(vault.depositToken);
    var contract = new window.web3.eth.Contract(abiERC20, depositToken.address);
    contract.methods.allowance(account, address).call({from:account}, function (error, result) {
        if(!error) {
            userAllowedStakingTokens[address] = result;
        } else {
            console.log(error);
        }
    });
}

const fetchPoolRewardRate = function(address) {
    var contract = new window.web3.eth.Contract(abiPool, address);
    contract.methods.rewardRate().call({from:account}, function (error, result) {
        if(!error) {
            rewardRates[address] = result;
        } else {
            console.log(error);
        }
        updatePool(address);
    });
}

const fetchVaultUserBalance = function(address) {
    var contract = new window.web3.eth.Contract(abiERC20, address);
    contract.methods.balanceOf(account).call({from:account}, function (error, result) {
        if(!error) {
            userBalancesPools[address] = result;
        } else {
            console.log(error);
        }
        updatePool(address);
    });
}

const fetchVaultPricePerFullShare = function(address) {
    var contract = new window.web3.eth.Contract(abiVault, address);
    contract.methods.getPricePerFullShare().call({from:account}, function (error, result) {
        if(!error) {
            pricesPerFullShare[address] = result;
        } else {
            console.log(error);
        }
        updatePool(address);
    });
}

const fetchPoolUserRewards = function(address) {
    var contract = new window.web3.eth.Contract(abiPool, address);
    contract.methods.earned(account).call({from:account}, function (error, result) {
        if(!error) {
            userRewardsPools[address] = result;
        } else {
            console.log(error);
        }
        updatePool(address);
    });
}

const fetchVaultTotalStaked = function(address) {
    var contract = new window.web3.eth.Contract(abiVault, address);
    contract.methods.totalSupply().call({from:account}, function (error, result) {
        if(!error) {
            totalStaked[address] = result;
        } else {
            console.log(error);
        }
        updatePool(address);
    });
}

const fetchPairReserves = function(pair_address) {
    var contract = new window.web3.eth.Contract(abiUniswapPair, pair_address);
    contract.methods.getReserves().call({from:account}, function (error, result) {
        if(!error) {
            reserves[pair_address] = result;
        } else {
            console.log(error);
        }
    });
}

const fetchAllTokens = function() {
    fetchMainTokenUserBalance();
    for(var i = 0; i < tokens.length; i++) {
        var token = tokens[i];
        if(token.address) {
            fetchTokenUserBalance(token.address);
        } else {
            // probably main token
        }
    }
}

const fetchAllVaults = function() {
    for(var i = 0; i < vaults.length; i++) {
        var vault = vaults[i];
        fetchVaultTotalStaked(vault.address);
        fetchVaultUserBalance(vault.address);
        fetchVaultPricePerFullShare(vault.address);
        //fetchPoolUserRewards(pool.address);
        //fetchPoolRewardRate(pool.address);
        if(vault.depositToken != mainTokenSymbol) {
            fetchApproval(vault.address);
        }
        //if(pool.pair) {
        //fetchPairReserves(pool.pair);
        //}
    }
}

const updateToken = function (address) {
    if(address == mainTokenSymbol) {
        if(userBalancesTokens[mainTokenSymbol] >= 0) {
            $('.display--user-balance[data-token="'+mainTokenSymbol+'"]').html(
                fv(weiToDecimal(userBalancesTokens[mainTokenSymbol], mainTokenSymbol))
            );
        }
    } else {
        var token = getTokenByAddress(address);
        console.log(userBalancesTokens[address]);
        if(userBalancesTokens[address] >= 0) {
            $('.display--user-balance[data-token="'+address+'"]').html(
                fv(weiToDecimal(userBalancesTokens[address], token.symbol))
            );
        }
    }
}

const getTVL = function(pool) {
    if(getTokenBySymbol(pool.stakingToken).is_lp == true) {
        if(!reserves[pool.pair]) {
            return 0;
        }
        var totalSupplyLPInLambo = reserves[pool.pair][1] * 2;
        return totalSupplyLPInLambo / (10**18);
        var tokenPrice = getTokenPrice('LAMBO', mainTokenSymbol);
        return tokenPrice * weiToDecimal(totalSupplyLPInLambo, pool.stakingToken);
    }
    var tokenPrice = getTokenPrice(pool.stakingToken, mainTokenSymbol);
    return tokenPrice * weiToDecimal(totalStaked[pool.address], pool.stakingToken);
}

const updatePool = function (address) {
    var vault = getVaultByAddress(address);
    var depositToken = getTokenBySymbol(vault.depositToken);
    // pool
    console.log(totalStaked[address]);
    console.log(userBalancesPools[address]);
    if(totalStaked[address] > 0) {
        $('*[data-vault="'+getVaultId(vault)+'"] .display--total-staked').html(
            fv(weiToDecimal(totalStaked[address], vault.depositToken))
        );
    }
    if(userRewardsPools[address] > 0) {
        $('*[data-vault="'+getVaultId(vault)+'"] .display--user-reward').html(
            fv(weiToDecimal(userRewardsPools[address], vault.depositToken))
        );
    }
    if(userBalancesPools[address] > 0) {
        $('*[data-vault="'+getVaultId(vault)+'"] .display--user-staked').html(
            fv(weiToDecimal(userBalancesPools[address], vault.depositToken))
        );
    }
    if(pricesPerFullShare[address] > 0) {
        var earned = (userBalancesPools[address] * pricesPerFullShare[address] / (10**18)) - userBalancesPools[address];
        $('*[data-vault="'+getVaultId(vault)+'"] .display--user-earned').html(
            fv(weiToDecimal(earned, vault.depositToken))
        );
    }

    if(userBalancesPools[address] == 0) {
        $('*[data-vault="'+getVaultId(vault)+'"]').addClass('empty-pool');
    }

}


const updateEverything = function( ){
    fetchAllTokens();
    fetchAllVaults();
}

const initFarm = function() {
    console.log('init farm');
    updateEverything();

    var intervalId = window.setInterval(function(){
        updateEverything();
    }, 5000);

}

