Meteor.publish('tickerdata', function() {
    return TickerData.find(); 
});

Meteor.publish('trades', function() {
    return Trades.find({}, {sort: {date: -1}, limit: 30});
});

Meteor.publish('bids', function() {
    return Orderbook.find({type: 'bid'}, {sort: {price: -1}, limit: 30});
});

Meteor.publish('asks', function() {
    return Orderbook.find({type: 'ask'}, {sort: {price:  1}, limit: 30});
});

Meteor.publish('orders', function() {
    return Orders.find();
});

Meteor.publish('positions', function() {
    return Positions.find();
});

Meteor.publish('balances', function() {
    return Balances.find();
});

Meteor.publish('transactions', function() {
    return Transactions.find();
});
