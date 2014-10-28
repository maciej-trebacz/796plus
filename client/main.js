lastPrice = 0;

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
    orders: function () {
        var bids = Orderbook.find({type: 'bid'}, {sort: {price: -1}});
        var asks = Orderbook.find({type: 'ask'}, {sort: {price: 1}}).fetch();
        return {asks: asks, bids: bids};
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
        console.log(Session.get('username'));
        return Session.get('username');
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
            if (error) {
                throwError(error);
                return;
            }

            // Save credentials
            localStorage.setItem('appId', login.appId);
            localStorage.setItem('apiKey', login.apiKey);
            localStorage.setItem('secretKey', login.secretKey);

            // Change %7 to |
            Session.set('accessToken', decodeURI(result.access_token));
            Session.set('username', result.username);

            console.log(Session.get('username'));
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