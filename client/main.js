lastPrice = 0;

Meteor.subscribe('tickerdata');
Meteor.subscribe('trades');
Meteor.subscribe('bids');
Meteor.subscribe('asks');
Meteor.subscribe('orders');
Meteor.subscribe('positions');
Meteor.subscribe('balances');

Template.ticker.helpers({
    ticker: function () {
        return TickerData.findOne();
    }
});

Template.orderbook.helpers({
    orders: function () {
        var bids = Orderbook.find({type: 'bid'}, {sort: {price: -1}});
        var asks = Orderbook.find({type: 'ask'}, {sort: {price: 1}});
        return {asks: asks, bids: bids};
    }
});

Template.orders.helpers({
    orders: function () {
        return Orders.find();
    }
});

Template.orders.events({
    'click .cancel-order': function(e) {
        e.preventDefault();

        Meteor.call('cancelOrder', $(e.target).data('id'), $(e.target).data('direction'));
    }
});

Template.orderForm.events({
    'click .submit-order': function(e) {
        e.preventDefault();

        var price;
        var direction = $(e.target).attr('id');
        var qty = $('#order-form').find('#qty').val();
        var times = $('#order-form').find('#times').val();

        if (direction == 'buy')
            price = $('#order-form').find('#buy-price').val();
        else
            price = $('#order-form').find('#sell-price').val();

        Meteor.call('openPosition', direction, price, qty, times);
    }
});

Template.positions.helpers({
    positions: function () {
        return Positions.find();
    },
    isTypeSell: function () {
        return this.bs == "sell";
    },
    isPLNegative: function () {
        return this.yk < 0;
    }
});

Template.recentTrades.helpers({
    trades: function () {
        return Trades.find({}, {sort: {date: -1}});
    }
});

Template.trade.helpers({
    formatDate: function(date) {
        var dateObj = new Date(date * 1000);
        return dateObj.formattedTime();
    }
});

Template.main.helpers({
    currentUser: function() {
        return Session.get('username');
    },
    balances: function() {
        return Balances.findOne();
    }
});

Template.main.events({
    'click #logout': function(e) {
        e.preventDefault();

        Meteor.call('logout');
        Session.set('username', null);
    }
    
});

Template.login.helpers({
    credentials: function() {
        return {
            id: localStorage.getItem('appId'),
            key: localStorage.getItem('apiKey'),
            secret: localStorage.getItem('secretKey'),
        }
    }
});

Template.login.events({
    'submit form': function(e) {
        e.preventDefault();

        var login = {
            appId: $(e.target).find('[name=app_id]').val(),
            apiKey: $(e.target).find('[name=api_key]').val(),
            secretKey: $(e.target).find('[name=secret_key]').val()
        }

        Meteor.call('authorize', login.appId, login.apiKey, login.secretKey, function(error, result) {
            // Save credentials
            localStorage.setItem('appId', login.appId);
            localStorage.setItem('apiKey', login.apiKey);
            localStorage.setItem('secretKey', login.secretKey);

            if (error) {
                throwError(error);
                return;
            }

            Session.set('username', result.username);
            Session.set('accessToken', unescape(result.access_token));
        });
    }
});

Template.errors.helpers({
    errors: function() {
        return Errors.find();
    }
});

Template.main.rendered = function() {
    var token = Session.get('accessToken');
    if (token)
        Meteor.call('refreshToken', token);
}

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
