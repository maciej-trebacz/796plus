var REFRESH_INTERVAL = 2500;

Meteor.setInterval(function () { 
    // Ticker
    Meteor.http.call('GET', 'http://api.796.com/v3/futures/ticker.html?type=weekly', {}, function(error, result) {
        if (error) return;
        var data = JSON.parse(result.content);
        var ticker = TickerData.findOne({});
        if (! ticker) 
            TickerData.insert(data.ticker);
        else {
            data.ticker.date = (new Date()).format('H:i:s');
            TickerData.update(ticker._id, {$set: data.ticker});
        }
    });

    // Trades
    Meteor.http.call('GET', 'http://api.796.com/v3/futures/trades.html?type=weekly', {}, function(error, result) {
        if (error) return;
        var data = JSON.parse(result.content);
        data.forEach(function(item) {
            var check = Trades.findOne({tid: item.tid});
            if (!check) Trades.insert(item);
        });
    });

    // Orderbook
    Meteor.http.call('GET', 'http://api.796.com/v3/futures/depth.html?type=weekly', {}, function(error, result) {
        function insertOrder(type, price, amount) {
            var check = Orderbook.findOne({type: type, price: price, amount: amount});
            if (! check) 
                Orderbook.insert({type:type, price: price, amount: amount, updated: (new Date()).getTime()});
            else 
                Orderbook.update(check._id, {$set: {updated: (new Date()).getTime()}});
        }

        if (error) return;

        var data = JSON.parse(result.content);
        data.bids.forEach(function(item) {
            insertOrder('bid', item[0], item[1]);
        });
        data.asks.forEach(function(item) {
            insertOrder('ask', item[0], item[1]);
        });
        Orderbook.remove({updated: { $lt: (new Date()).getTime() - 1000 }});
    });
}, REFRESH_INTERVAL);
