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

        ServerSession.set('accessToken', unescape(body.data.access_token));

        return body.data;
    },
    logout: function() {
        ServerSession.set('accessToken', null);
        // Send call to 796 (delete token)
        return true;
    },
    cancelOrder: function(id, direction) {
        this.unblock();
        var response = Meteor.http.call('POST', 'https://796.com/v1/weeklyfutures/cancel_order', {params: {bs: direction, no: id, access_token: ServerSession.get('accessToken')}});
        var body = JSON.parse(response.content);

        if (body.errno != 0) 
            throw new Meteor.Error(body.errno, body.msg);

        Orders.remove({id: id});
    },
    openPosition: function(direction, price, qty, margin) {
        var params;
        if (direction == 'buy') {
            params = {
                times: margin,
                buy_num: qty,
                buy_price: price,
                access_token: ServerSession.get('accessToken')
            }
        }
        else if (direction == 'sell') {
            params = {
                times: margin,
                sell_num: qty,
                sell_price: price,
                access_token: ServerSession.get('accessToken')
            }
        }
        else {
            throw new Meteor.Error(0, 'Wrong direction.');
        }

        this.unblock();
        var response = Meteor.http.call('POST', 'https://796.com/v1/weeklyfutures/open_' + direction, {params: params});
        var body = JSON.parse(response.content);

        if (body.errno != 0) 
            throw new Meteor.Error(body.errno, body.msg);

        var item = body.data;
        Orders.insert({id: item.no, type: item.kp, direction: item.bs, price: item.price, qty: item.gnum, completed: item.cjnum, margin: item.bzj, status: item.state, updated: (new Date()).getTime() });
    },
    closePosition: function(direction, price, qty, margin) {
        var params = {
            times: margin,
            amount: qty,
            price: price,
            access_token: ServerSession.get('accessToken')
        }

        this.unblock();
        var response = Meteor.http.call('POST', 'https://796.com/v1/weeklyfutures/close_' + direction, {params: params});
        var body = JSON.parse(response.content);

        if (body.errno != 0) 
            throw new Meteor.Error(body.errno, body.msg);

        var item = body.data;
        Orders.insert({id: item.no, type: item.kp, direction: item.bs, price: item.price, qty: item.gnum, completed: item.cjnum, margin: item.bzj, status: item.state, updated: (new Date()).getTime() });
    },
    transactions: function() {
        var response = Meteor.http.call('GET', 'https://796.com/v1/weeklyfutures/records?access_token=' + encodeURIComponent(ServerSession.get('accessToken')));
        var body = JSON.parse(response.content);

        if (body.errno != 0) 
            throw new Meteor.Error(body.errno, body.msg);

        body.data.forEach(function(item) {
            var check = Transactions.findOne({create_time: item.create_time});
            if (! check)
                Transactions.insert({create_time: item.create_time, type: item.kp, direction: item.bs, price: item.price, qty: item.num, margin: item.bzj, loss_profit: item.yk, fee: item.fee, description: item.remark});
        });
    }
});
