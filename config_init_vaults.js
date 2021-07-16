let abiVault = [
    {
        "constant": true,
        "inputs": [
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "deposit",
        "outputs": [],
        "payable": false,
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "withdraw",
        "outputs": [],
        "payable": false,
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "totalSupply",
                "type": "uint256"
            }
        ],
        "payable": false,
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "getPricePerFullShare",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "pricePerFullShare",
                "type": "uint256"
            }
        ],
        "payable": false,
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "rewardsOf",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "pricePerFullShare",
                "type": "uint256"
            }
        ],
        "payable": false,
        "type": "function"
    }
]

let abiStrategy = [
    {
        "constant": true,
        "inputs": [],
        "name": "harvest",
        "outputs": [],
        "payable": false,
        "type": "function"
    }
]

tokens.push({
    'symbol' : 'KANDY-LP',
    'decimals' : 18,
    'is_main' : false,
    'is_lp' : true,
    'address' : '0x07eee6090d66b3b290857ac88577a49f49ac8586',
    'pair' : '0x07eee6090d66b3b290857ac88577a49f49ac8586'
});

let vaults = [
    {
        'depositToken' : 'KANDY',
        'rewardToken' : 'KANDY',
        'address' : '0xa2078746ea74a92f5968f7980cA80aE817906661',
        'strategyAddress' : '0x476Bd5Dc2d248c68BACf1a57Da4aA11a2D80E7fe',
        'enabled' : true,
        'info' : '1% deposit fee<br>Address Cap: 500 KANDY<br>Total Cap: 50000 KANDY'
    },
    {
        'depositToken' : 'KANDY-LP',
        'rewardToken' : 'KANDY',
        'address' : '0xDB8CC62478bc287112286B3A47C34C157A0F6861',
        'strategyAddress' : '0x6B3B1d801c7a2f8c9e56fcA446F2ecb0b787ab93',
        'enabled' : true,
        'info' : '1% deposit fee<br>Address Cap: 50 KANDY-LP<br>Total Cap: 5000 KANDY-LP'
    }
];

const addVaults = function() {
    for(var i = 0; i < vaults.length; i++) {
        var vault = vaults[i];
        var depositToken = getTokenBySymbol(vault.depositToken)
        var vaultId = vault.depositToken + '--' + vault.rewardToken;
        var disabled = !vault.enabled;
        var classes = "pool--container";
        if(disabled) {
            classes+= ' disabled';
        }
        var row = '<div class="' + classes + '" data-vault="' + vaultId + '">';
        row+= '<a href="#" class="toggle-container"><i class="fa fa-chevron-down"></i><i class="fa fa-chevron-up"></i></a>';
        row+= '<div class="row">';
        row+= '<div class="col-md-4 col-12 title"><h5><strong>$'+vault.depositToken+'</strong></h5><small>' + vault.info + '</small></div>';
        row+= '<div class="col-md-2 col-4"><strong><span class="display--total-staked">-</span></strong><br>Total Staked</div>';
        row+= '<div class="col-md-2 col-4"><strong><span class="display--user-staked">-</span></strong><br>Staked</div>';
        row+= '<div class="col-md-2 col-4"><strong><span class="display--user-earned">-</span></strong><br>Earned</div>';
        row+= '<div class="col-md-2 col-4"><strong><span class="display--user-balance" data-token="'+(depositToken.address?depositToken.address:depositToken.symbol)+'">-</span></strong><br>Balance</div>';
        row+= '<div class="col-md-12 pool-actions">';
        row+= '<div class="row">';
        row+= '<div class="col-md-3">';
        row+= '<form class="form staking-form">';
        if(!disabled) {
            row+= '<div class="form-group">';
            row+= '<input type="text" class="form-control amount-input" name="amount" /><input type="submit" class="form-control" value="Stake" />';
            row+= '<a href="#" class="btn--stake-max btn-xs btn btn-outline-dark">max</a>';
            row+= '</div>';
        }
        row+= '</form>';
        row+= '</div>';
        row+= '<div class="col-md-3">';
        row+= '<form class="form unstaking-form">';
        if(!disabled) {
            row+= '<div class="form-group">';
            row+= '<input type="text" class="form-control amount-input" name="amount" /><input type="submit" class="form-control" value="Withdraw" />';
            row+= '<a href="#" class="btn--unstake-max btn-xs btn btn-outline-dark">max</a>';
            row+= '</div>';
        }
        row+= '</form>';
        row+= '</div>';
        row+= '<div class="col-md-3">';
        //row+= '<a href="#" class="btn--claim-rewards btn btn-outline-dark btn-block">Claim Rewards</a>';
        row+= '</div>';
        row+= '<div class="col-md-3">';
        row+= '<a href="#" class="btn--harvest btn btn-outline-dark btn-block">Harvest</a>';
        row+= '</div>';
        row+= '</div>';
        row+= '<div class="messages center-text">';
        row+= '</div>';
        row+= '</div>';
        row+= '</div>';
        row+= '</div>';
        $('#container--vaults').append(row);
    }
}

const afterWalletConnect = function() {
    initFarm();
}

addVaults();

$(document).ready(function() {
    connectWallet();
});





$('.pool--container').on('click', function(e) {
    $(e.target).find('.toggle-container').trigger('click');
});
$('.toggle-container').on('click', function(e) {
    if($(e.target).parents('.pool--container').hasClass('open')) {
        $('.pool--container').removeClass('open');
    } else {
        $('.pool--container').removeClass('open');
        $(e.target).parents('.pool--container').addClass('open');
    }

    return false;
});

$('.btn--stake-max').on('click', function(e) {
    var vaultId = $(e.target).parents('.pool--container').data('vault');
    var vault = getVaultById(vaultId);
    var token = getTokenBySymbol(vault.depositToken);
    if(!vault.enabled) {
        return false;
    }
    var amount = weiToDecimal(userBalancesTokens[token.address], token.symbol);
    if(token.is_main) {
        amount = weiToDecimal(userBalancesTokens[mainTokenSymbol], token.symbol);
    }
    $('.pool--container[data-vault="' + vaultId  + '"] .staking-form input[name="amount"]').val(amount);
    return false;
});

$('.staking-form').on('submit', function(e) {
    if(chainId != 321) {
        alert('Wrong network or chain, please connect to KCC and refresh this page');
    }
    var vaultId = $(e.target).parents('.pool--container').data('vault');
    var vault = getVaultById(vaultId);
    var amount = $(e.target).find('input[name="amount"]').val();
    if(!amount || amount <= 0) {
        return false;
    }
    amount = new BigNumber(amount*(10**getTokenBySymbol(vault.depositToken).decimals));
    $(e.target).find('input[name="amount"]').val('');
    var done = false;
    var done2 = false;

    if(parseFloat(userAllowedStakingTokens[vault.address]) >= parseFloat(amount.toFixed())) {
        var contract = new window.web3.eth.Contract(abiVault, vault.address);
        contract.methods.deposit(amount.toFixed()).send({from:account})
            .on('transactionHash', function(hash){
                messageVault(vaultId, 'Staking ... Please wait', hash);
            })
            .on('confirmation', function(confirmationNumber, receipt){
                if(!done) {
                    done = true;
                    removeMessage();
                    updateEverything();
                }
            })
            .on('error', function(error){
                console.log(error);
            });
    } else {
        var contract = new window.web3.eth.Contract(abiERC20, getTokenBySymbol(vault.depositToken).address);
        var approveAmount = new BigNumber(10**33);
        contract.methods.approve(vault.address, approveAmount.toFixed()).send({from:account})
            .on('transactionHash', function(hash){
                messageVault(vaultId, 'Approving ... Please wait', hash);
            })
            .on('confirmation', function(confirmationNumber, receipt){
                if(!done) {
                    done = true;
                    var contract = new window.web3.eth.Contract(abiVault, vault.address);
                    contract.methods.deposit(amount.toFixed()).send({from:account})
                        .on('transactionHash', function(hash){
                            messageVault(vaultId, 'Staking ... Please wait', hash);
                        })
                        .on('confirmation', function(confirmationNumber, receipt){
                            if(!done2) {
                                done2 = true;
                                removeMessage();
                                updateEverything();
                            }
                        })
                        .on('error', function(error){
                            console.log(error);
                        });
                }
            })
            .on('error', function(error){
                console.log(error);
            });
    }

    return false;
});

$('.btn--unstake-max').on('click', function(e) {
    var vaultId = $(e.target).parents('.pool--container').data('vault');
    var vault = getVaultById(vaultId);
    var token = getTokenBySymbol(vault.depositToken);
    if(!vault.enabled) {
        return false;
    }
    var amount = weiToDecimal(userBalancesPools[vault.address], token.symbol);
    $('.pool--container[data-vault="' + vaultId  + '"] .unstaking-form input[name="amount"]').val(amount);
    return false;
});


$('.unstaking-form').on('submit', function(e) {
    var vaultId = $(e.target).parents('.pool--container').data('vault');
    var vault = getVaultById(vaultId);
    var amount = $(e.target).find('input[name="amount"]').val();
    if(!amount || amount <= 0) {
        return false;
    }
    amount = new BigNumber(amount*(10**getTokenBySymbol(vault.depositToken).decimals));
    $(e.target).find('input[name="amount"]').val('');
    var done = false;
    var contract = new window.web3.eth.Contract(abiVault, vault.address);
    contract.methods.withdraw(amount.toFixed()).send({from:account})
        .on('transactionHash', function(hash){
            messageVault(vaultId, 'Unstaking ... Please wait', hash);
        })
        .on('confirmation', function(confirmationNumber, receipt){
            if(!done) {
                done = true;
                removeMessage();
                updateEverything();
            }
        })
        .on('error', function(error){
            console.log(error);
        });

    return false;
});

$('.btn--harvest').on('click', function(e) {
    var vaultId = $(e.target).parents('.pool--container').data('vault');
    var vault = getVaultById(vaultId);
    if(!vault.enabled) {
        return false;
    }
    var done = false;
    var contract = new window.web3.eth.Contract(abiStrategy, vault.strategyAddress);
    contract.methods.harvest().send({from:account})
        .on('transactionHash', function(hash){
            messageVault(vaultId, 'Harvesting ... Please wait', hash);
        })
        .on('confirmation', function(confirmationNumber, receipt){
            if(!done) {
                done = true;
                removeMessage();
                updateEverything();
            }
        })
        .on('error', function(error){
            console.log(error);
        });
    return false;
});