var REFRESH_INTERVAL = 1500;

TickerData = new Meteor.Collection('tickerdata');
Trades = new Meteor.Collection('trades');
Orderbook = new Meteor.Collection('orderbook');
Errors = new Mongo.Collection(null);

lastPrice = 0;

Date.prototype.formattedTime = function() {
    var hours = (this.getHours() < 10) ? "0" + this.getHours() : this.getHours();
    var minutes = (this.getMinutes() < 10) ? "0" + this.getMinutes() : this.getMinutes();
    var seconds = (this.getSeconds() < 10) ? "0" + this.getSeconds() : this.getSeconds();
    return hours + ":" + minutes + ":" + seconds;
}

if (Meteor.isClient) {
    Meteor.subscribe('tickerdata');
    Meteor.subscribe('trades');
    Meteor.subscribe('bids');
    Meteor.subscribe('asks');

    Template.ticker.helpers({
        ticker: function () {
            return TickerData.findOne();
        }
    });

    Template.orderbook.helpers({
        trades: function () {
            return Trades.find({}, {sort: {date: -1}});
        },
        orders: function () {
            var bids = Orderbook.find({type: 'bid'}, {sort: {price: -1}});
            var asks = Orderbook.find({type: 'ask'}, {sort: {price: 1}}).fetch();
            return {asks: asks, bids: bids};
        }
    });

    Template.trade.helpers({
        formatDate: function(date) {
            var dateObj = new Date(date * 1000);
            return dateObj.formattedTime();
        }
    });

    // Login
    Template.login.events({
        'submit form': function(e) {
            e.preventDefault();

            var login = {
                appId: $(e.target).find('[name=app_id]').val(),
                apiKey: $(e.target).find('[name=api_key]').val(),
                secretKey: $(e.target).find('[name=secret_key]').val()
            }

            Meteor.call('authorize', login.appId, login.apiKey, login.secretKey, function(error, result) {
                if (error) {
                    throwError(error);
                    return;
                }

                console.log(result);

                localStorage.setItem('appId', login.appId);
                localStorage.setItem('apiKey', login.apiKey);
                localStorage.setItem('secretKey', login.secretKey);
            });  
        }
    });

    Template.errors.helpers({
        errors: function() {
            return Errors.find();
        }
    });

    TickerData.find({}).observe({
        added: function(post) {
            lastPrice = post.last;
            document.title = "796+ | " + post.last;
        },
        changed: function(post) {
            if (lastPrice > post.last) {
                $('#last-price').removeClass('higher');
                $('#last-price').addClass('lower');
            }
            else {
                $('#last-price').removeClass('lower');
                $('#last-price').addClass('higher');
            }
            document.title = "796+ | " + post.last;
        }
    });

    throwError = function(message) {
        Errors.insert({message: message})
    }
}

if (Meteor.isServer) {
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

    Meteor.setInterval( function () { 
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

            console.log(appId);
            console.log(apiKey);
            console.log(secretKey);

            this.unblock();

            var response = Meteor.http.call('GET', 'https://796.com/oauth/token?appid=' + appId + '&timestamp=' + timestamp + '&apikey=' + apiKey + '&sig=' + signature, {});
            var body = JSON.parse(response.content);

            if (body.errno)
                throw new Meteor.Error(body.errno, body.msg);

            return body;
        }
    });
}