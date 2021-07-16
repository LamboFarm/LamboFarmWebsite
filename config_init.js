
const addPools = function() {
    for(var i = 0; i < pools.length; i++) {
        var pool = pools[i];
        var stakingToken = getTokenBySymbol(pool.stakingToken)
        var poolId = pool.stakingToken + '--' + pool.rewardToken;
        var disabled = !pool.enabled;
        var classes = "pool--container";
        if(disabled) {
            classes+= ' disabled';
        }
        var row = '<div class="' + classes + '" data-pool="' + poolId + '">';
        row+= '<a href="#" class="toggle-container"><i class="fa fa-chevron-down"></i><i class="fa fa-chevron-up"></i></a>';
        row+= '<div class="row">';
        row+= '<div class="col-md-2 col-12 title"><h5><strong>$'+pool.stakingToken+'</strong></h5><small>1% deposit fee</small></div>';
        row+= '<div class="col-md-2 col-4"><strong><span class="display--apr">-</span></strong><br>APR</div>';
        row+= '<div class="col-md-2 col-4"><strong><span class="display--tvl">-</span></strong><br>TVL (KCS)</div>';
        row+= '<div class="col-md-2 col-4"><strong><span class="display--total-staked">-</span></strong><br>Total Staked</div>';
        row+= '<div class="col-md-1 col-4"><strong><span class="display--user-staked">-</span></strong><br>Staked</div>';
        row+= '<div class="col-md-1 col-4"><strong><span class="display--user-reward">-</span></strong><br>Earned</div>';
        row+= '<div class="col-md-2 col-4"><strong><span class="display--user-balance" data-token="'+(stakingToken.address?stakingToken.address:stakingToken.symbol)+'">-</span></strong><br>Balance</div>';
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
        row+= '<a href="#" class="btn--claim-rewards btn btn-outline-dark btn-block">Claim Rewards</a>';
        row+= '</div>';
        row+= '<div class="col-md-3">';
        row+= '<a href="#" class="btn--exit btn btn-outline-dark btn-block">Exit (Unstake & Claim)</a>';
        row+= '</div>';
        row+= '</div>';
        row+= '<div class="messages center-text">';
        row+= '</div>';
        row+= '</div>';
        row+= '</div>';
        row+= '</div>';
        $('#container--pools').append(row);
    }
}

const afterWalletConnect = function() {
    initFarm();
}

addPools();

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

$('.btn--claim-rewards').on('click', function(e) {
    var poolId = $(e.target).parents('.pool--container').data('pool');
    var pool = getPoolById(poolId);
    var done = false;
    var contract = new window.web3.eth.Contract(abiPool, pool.address);
    contract.methods.getReward().send({from:account})
        .on('transactionHash', function(hash){
            message(poolId, 'Claiming Rewards... Please wait', hash);
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

$('.btn--exit').on('click', function(e) {
    var poolId = $(e.target).parents('.pool--container').data('pool');
    var pool = getPoolById(poolId);
    var done = false;
    var contract = new window.web3.eth.Contract(abiPool, pool.address);
    contract.methods.exit().send({from:account})
        .on('transactionHash', function(hash){
            message(poolId, 'Claiming Rewards... Please wait', hash);
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

$('.btn--stake-max').on('click', function(e) {
    var poolId = $(e.target).parents('.pool--container').data('pool');
    var pool = getPoolById(poolId);
    var token = getTokenBySymbol(pool.stakingToken);
    if(!pool.enabled) {
        return false;
    }
    var amount = weiToDecimal(userBalancesTokens[token.address], token.symbol);
    if(token.is_main) {
        amount = weiToDecimal(userBalancesTokens[mainTokenSymbol], token.symbol);
    }
    $('.pool--container[data-pool="' + poolId  + '"] .staking-form input[name="amount"]').val(amount);
    return false;
});

$('.staking-form').on('submit', function(e) {
    if(chainId != 321) {
        alert('Wrong network or chain, please connect to KCC and refresh this page');
    }
    var poolId = $(e.target).parents('.pool--container').data('pool');
    var pool = getPoolById(poolId);
    var amount = $(e.target).find('input[name="amount"]').val();
    if(!amount || amount <= 0) {
        return false;
    }
    amount = new BigNumber(amount*(10**getTokenBySymbol(pool.stakingToken).decimals));
    $(e.target).find('input[name="amount"]').val('');
    var done = false;
    var done2 = false;

    if(pool.stakingToken == mainTokenSymbol) {
        var contract = new window.web3.eth.Contract(abiPoolMain, pool.address);
        contract.methods.stake(amount.toFixed()).send({from:account,value:amount.toFixed()})
            .on('transactionHash', function(hash){
                message(poolId, 'Staking ... Please wait', hash);
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
        if(parseFloat(userAllowedStakingTokens[pool.address]) >= parseFloat(amount.toFixed())) {
            var contract = new window.web3.eth.Contract(abiPool, pool.address);
            contract.methods.stake(amount.toFixed()).send({from:account})
                .on('transactionHash', function(hash){
                    message(poolId, 'Staking ... Please wait', hash);
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
            var contract = new window.web3.eth.Contract(abiERC20, getTokenBySymbol(pool.stakingToken).address);
            var approveAmount = new BigNumber(10**37);
            contract.methods.approve(pool.address, approveAmount.toFixed()).send({from:account})
                .on('transactionHash', function(hash){
                    message(poolId, 'Approving ... Please wait', hash);
                })
                .on('confirmation', function(confirmationNumber, receipt){
                    if(!done) {
                        done = true;
                        var contract = new window.web3.eth.Contract(abiPool, pool.address);
                        contract.methods.stake(amount.toFixed()).send({from:account})
                            .on('transactionHash', function(hash){
                                message(poolId, 'Staking ... Please wait', hash);
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
    }


    return false;
});

$('.btn--unstake-max').on('click', function(e) {
    var poolId = $(e.target).parents('.pool--container').data('pool');
    var pool = getPoolById(poolId);
    var token = getTokenBySymbol(pool.stakingToken);
    if(!pool.enabled) {
        return false;
    }
    var amount = weiToDecimal(userBalancesPools[pool.address], token.symbol);
    console.log(amount);
    $('.pool--container[data-pool="' + poolId  + '"] .unstaking-form input[name="amount"]').val(amount);
    return false;
});


$('.unstaking-form').on('submit', function(e) {
    var poolId = $(e.target).parents('.pool--container').data('pool');
    var pool = getPoolById(poolId);
    var amount = $(e.target).find('input[name="amount"]').val();
    if(!amount || amount <= 0) {
        return false;
    }
    amount = new BigNumber(amount*(10**getTokenBySymbol(pool.stakingToken).decimals));
    $(e.target).find('input[name="amount"]').val('');
    var done = false;
    var contract = new window.web3.eth.Contract(abiPool, pool.address);
    contract.methods.withdraw(amount.toFixed()).send({from:account})
        .on('transactionHash', function(hash){
            message(poolId, 'Unstaking ... Please wait', hash);
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

var claimAllPools = [];
var claimAllIndex = 0;
var claimAllActive = false;
const claimNext = function () {
    if(claimAllIndex == claimAllPools.length) {
        claimAllActive = false;
        removeMessage();
        message('CLAIMALLFUNC', 'Nothing more to claim');
    } else {
        var done = false;
        var contract = new window.web3.eth.Contract(abiPool, claimAllPools[claimAllIndex].address);
        contract.methods.getReward().send({from:account})
            .on('transactionHash', function(hash){
                message('CLAIMALLFUNC', 'Claiming ... Please wait', hash);
                console.log(hash);
            })
            .on('confirmation', function(confirmationNumber, receipt){
                if(!done) {
                    removeMessage();
                    message('CLAIMALLFUNC', 'Done ... Next one');
                    done = true;
                    updateEverything();
                    claimAllIndex++;
                    claimNext();
                }
            })
            .on('error', function(error){
                console.log(error);
                message('CLAIMALLFUNC', 'Error');
                claimAllActive = false;
            });
    }
}
const claimAll = function() {
    claimAllPools = [];
    for(var i = 0; i < pools.length; i++) {
        if(userRewardsPools[pools[i].address] > 0) {
            claimAllPools.push(pools[i]);
        }
    }
    message('CLAIMALLFUNC', claimAllPools.length + ' Pools to claim');
    if(claimAllPools.length > 0) {
        claimAllActive = true;
        claimNext()
    }
}

$('.btn--claim-all').on('click', function(e) {
    claimAll();
    return false;
});

$('input[name="pools_switch"]').on('change', function(e) {
    if($(e.target).val() == 0) {
        $('#container--pools').removeClass('only-own-pools');
    } else {
        $('#container--pools').addClass('only-own-pools');
    }
});