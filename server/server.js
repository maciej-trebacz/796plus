var REFRESH_INTERVAL = 2000;
var accessToken = "";

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

Meteor.setInterval(function () { 
    // Ticker
    Meteor.http.call('GET', 'http://api.796.com/v3/futures/ticker.html?type=weekly', {}, function(error, result) {
        if (error) return;
        var data = JSON.parse(result.content);
        var ticker = TickerData.findOne({});
        if (! ticker) 
            TickerData.insert(data.ticker);
        else {
            data.ticker.date = (new Date()).formattedTime();
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

    if (accessToken != "") {
        // Orders
        Meteor.http.call('GET', 'https://796.com/v1/weeklyfutures/orders?access_token=' + encodeURIComponent(accessToken), {}, function(error, result) {
            if (error) return;
            var body = JSON.parse(result.content);
            // if (body.errno != 0)
            //     throw new Meteor.Error(body.errno, body.msg);

            body.data.forEach(function(item) {
                var check = Orders.findOne({id: item.no});
                if (! check)
                    Orders.insert({id: item.no, type: item.kp, direction: item.bs, price: item.price, qty: item.gnum, completed: item.cjnum, margin: item.bzj, status: item.state, updated: (new Date()).getTime() });
                else
                    Orders.update(check._id, {$set: {id: item.no, type: item.kp, direction: item.bs, price: item.price, qty: item.gnum, completed: item.cjnum, margin: item.bzj, status: item.state, updated: (new Date()).getTime() }});
            });

            Orders.remove({updated: { $lt: (new Date()).getTime() - 1000 }});
        });

        // Positions
        Meteor.http.call('GET', 'https://796.com/v1/weeklyfutures/position?access_token=' + encodeURIComponent(accessToken), {}, function(error, result) {
            if (error) return;
            var body = JSON.parse(result.content);

            function insertPosition(item) {
                var check = Positions.findOne({bs: item.bs, times: item.times});
                item.updated = (new Date()).getTime();
                if (! check)
                    Positions.insert(item);
                else
                    Positions.update(check._id, {$set: item});
            }

            for (key in body.data.buy) {
                insertPosition(body.data.buy[key]);
            }
            for (key in body.data.sell) {
                insertPosition(body.data.sell[key]);
            }

            Positions.remove({updated: { $lt: (new Date()).getTime() - 1000 }});
        });

        // Balances
        Meteor.http.call('GET', 'https://796.com/v1/user/get_balance?access_token=' + encodeURIComponent(accessToken), {}, function(error, result) {
            if (error) return;
            var body = JSON.parse(result.content);

            if (body.errno == 0)
            {
                var balances = Balances.findOne({});
                if (! balances)
                    Balances.insert(body.data);
                else 
                    Balances.update(balances._id, {$set: body.data});
            }
        });
    }
}, REFRESH_INTERVAL);

Meteor.methods({
    authorize: function(appId, apiKey, secretKey) {
        var timestamp = Math.round(+new Date() / 1000);
        var paramUri = 'apikey=' + apiKey + '&appid=' + appId + '&secretkey=' + encodeURIComponent(secretKey) + '&timestamp=' + timestamp;
        var signature = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(CryptoJS.HmacSHA1(paramUri, secretKey)));

        this.unblock();

        var response = Meteor.http.call('GET', 'https://796.com/oauth/token?appid=' + appId + '&timestamp=' + timestamp + '&apikey=' + apiKey + '&sig=' + signature, {});
        var body = JSON.parse(response.content);

        if (body.errno != 0)
            throw new Meteor.Error(body.errno, body.msg);

        accessToken = unescape(body.data.access_token);

        return body.data;
    },
    refreshToken: function(token) {
        accessToken = token;
    },
    logout: function() {
        accessToken = null;
        return true;
    },
    cancelOrder: function(id, direction) {
        Meteor.http.call('POST', 'https://796.com/v1/weeklyfutures/cancel_order', {params: {bs: direction, no: id, access_token: accessToken}}, function(error, result) {
            if (error) return;
            var body = JSON.parse(result.content);

            if (body.errno != 0) 
                throw new Meteor.Error(body.errno, body.msg);
        });
    },
    openPosition: function(direction, price, qty, times) {
        var params;
        if (direction == 'buy') {
            params = {
                times: times,
                buy_num: qty,
                buy_price: price,
                access_token: accessToken
            }
        }
        else {
            params = {
                times: times,
                sell_num: qty,
                sell_price: price,
                access_token: accessToken
            }
        }

        Meteor.http.call('POST', 'https://796.com/v1/weeklyfutures/open_' + direction, {params: params}, function(error, result) {
            if (error) return;
            var body = JSON.parse(result.content);

            console.log(body);

            if (body.errno != 0) 
                throw new Meteor.Error(body.errno, body.msg);
        });
    }
});
