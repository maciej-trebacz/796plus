var REFRESH_INTERVAL = 1500;

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

Meteor.setInterval(function () { 
    // Ticker
    Meteor.http.call("GET", "http://api.796.com/v3/futures/ticker.html?type=weekly", {}, function (error, result) {
        if (error) return;
        var data = JSON.parse(result.content);
        var ticker = TickerData.findOne({});
        if (!ticker) 
            TickerData.insert(data.ticker);
        else {
            data.ticker.date = (new Date()).formattedTime();
            TickerData.update(ticker._id, {$set: data.ticker});
        }
    });

    // Trades
    Meteor.http.call("GET", "http://api.796.com/v3/futures/trades.html?type=weekly", {}, function (error, result) {
        if (error) return;
        var data = JSON.parse(result.content);
        data.forEach(function(item) {
            var check = Trades.findOne({tid: item.tid});
            if (!check) Trades.insert(item);
        });
    });

    // Orderbook
    Meteor.http.call("GET", "http://api.796.com/v3/futures/depth.html?type=weekly", {}, function (error, result) {
        function insertOrder(type, price, amount) {
            var check = Orderbook.findOne({type: type, price: price, amount: amount});
            if (!check) 
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

Meteor.methods({
    authorize: function(appId, apiKey, secretKey) {
        var timestamp = Math.round(+new Date() / 1000);
        var paramUri = 'apikey=' + apiKey + '&appid=' + appId + '&secretkey=' + secretKey + '&timestamp=' + timestamp;
        var signature = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(CryptoJS.HmacSHA1(paramUri, secretKey)));

        this.unblock();

        var response = Meteor.http.call('GET', 'https://796.com/oauth/token?appid=' + appId + '&timestamp=' + timestamp + '&apikey=' + apiKey + '&sig=' + signature, {});
        var body = JSON.parse(response.content);

        if (body.errno != 0)
            throw new Meteor.Error(body.errno, body.msg);

        return body.data;
    }
});