var REFRESH_INTERVAL = 2500;

Meteor.setInterval(function () { 
    if (ServerSession.get('accessToken') != null) {
        // Orders
        Meteor.http.call('GET', 'https://796.com/v1/weeklyfutures/orders?access_token=' + encodeURIComponent(ServerSession.get('accessToken')), {}, function(error, result) {
            if (error) return;
            var body = JSON.parse(result.content);

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
        Meteor.http.call('GET', 'https://796.com/v1/weeklyfutures/position?access_token=' + encodeURIComponent(ServerSession.get('accessToken')), {}, function(error, result) {
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
        Meteor.http.call('GET', 'https://796.com/v1/user/get_balance?access_token=' + encodeURIComponent(ServerSession.get('accessToken')), {}, function(error, result) {
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
