lastPrice = 0;

Meteor.subscribe('tickerdata');
Meteor.subscribe('trades');
Meteor.subscribe('bids');
Meteor.subscribe('asks');
Meteor.subscribe('orders');
Meteor.subscribe('positions');
Meteor.subscribe('balances');
Meteor.subscribe('transactions');

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
    orders: function() {
        return Orders.find();
    },
    formatStatus: function() {
        switch (this.status) {
            case 'not': return '<span class="label label-warning">In Queue</label>'; break;
            case 'done': return '<span class="label label-success">Completed</label>'; break;
            case 'wait': return '<span class="label label-info">Waiting</label>'; break;
        }
    },
    formatType: function() {
        if (this.type == 'kai') 
            return 'Open';
        else
            return 'Close';
    }
});

Template.orders.events({
    'click .cancel-order': function(e) {
        e.preventDefault();

        Meteor.call('cancelOrder', $(e.currentTarget).data('id'), $(e.currentTarget).data('direction'), function(error, result) {
            if (error)
                throwError(error);

            else
                showNotification("Order cancel request sent."); 
        });
    }
});

Template.orderForm.events({
    'click .submit-order': function(e) {
        e.preventDefault();

        var direction = e.currentTarget.id;
        var qty = $('#order-form').find('#qty').val();
        var margin = $('#order-form').find('#margin').val();
        var price = $('#order-form').find('#price').val();

        Meteor.call('openPosition', direction, price, qty, margin, function(error, result) {
            if (error)
                throwError(error);
            
            else
                showNotification("New position opened at " + price + "."); 
        });
    },
    'keyup #qty': function(e) {
        var margin = $('#margin').val();
        var times = 0;
        var btc = Balances.findOne().futures_wallet.btc;

        switch (margin) {
            case '5': times = 20; break;
            case '10': times = 10; break;
            case '20': times = 5; break;
        }

        if ($(e.currentTarget).val() > btc * times) {
            $(e.currentTarget).val(btc * times);
        }
    }
});

Template.positions.helpers({
    positions: function() {
        return Positions.find();
    },
    isTypeSell: function() {
        return this.bs == "sell";
    },
    isPLNegative: function() {
        return this.yk < 0;
    }
});

Template.positions.events({
    'click .offset': function(e) {
        e.preventDefault();

        var direction = $(e.currentTarget).data('direction');
        var qty = $(e.currentTarget).parent().parent().find('.qty').val();
        var margin = $(e.currentTarget).data('margin');
        var price = $(e.currentTarget).parent().parent().find('.price').val();

        Meteor.call('closePosition', direction, price, qty, margin, function(error, result) {
            if (error)
                throwError(error);       
            else
                showNotification("Position offset created at " + price + "."); 
        });
    },
    'click .btn-paste-price': function(e) {
        e.preventDefault();

        $(e.currentTarget).parent().find('input').val(lastPrice);
    }
});

Template.recentTrades.helpers({
    trades: function() {
        return Trades.find({}, {sort: {date: -1}});
    }
});

Template.trade.helpers({
    formatDate: function(date) {
        var dateObj = new Date(date * 1000);
        return dateObj.format('H:i:s');
    }
});

Template.layout.helpers({
    currentUser: function() {
        return Session.get('username');
    },
    balances: function() {
        return Balances.findOne();
    }
});

Template.layout.events({
    'click #logout': function(e) {
        e.preventDefault();

        Meteor.call('logout');
        Session.set('username', null);
    },
    // Resizing chart
    'click .full-chart': function(e) {
        e.preventDefault();

        $('#col-chart').removeClass('col-md-8').addClass('col-md-12');
        $('#col-chart').find('.chart').width('100%').height(467);
        $('#col-chart').find('iframe').attr('width', 1314).attr('height', 500);
        $('#col-order-form').removeClass('col-md-4').addClass('col-md-12');
        $(e.currentTarget).removeClass('full-chart').addClass('small-chart').html('<span class="glyphicon glyphicon-resize-small"></span>');
    },
    'click .small-chart': function(e) {
        e.preventDefault();

        $('#col-chart').removeClass('col-md-12').addClass('col-md-8');
        $('#col-chart').find('.chart').width(750).height(367);
        $('#col-chart').find('iframe').attr('width', 1151).attr('height', 400);
        $('#col-order-form').removeClass('col-md-12').addClass('col-md-4');
        $(e.currentTarget).removeClass('small-chart').addClass('full-chart').html('<span class="glyphicon glyphicon-resize-full"></span>');
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

Template.transactions.helpers({
    transactions: function() {
        Meteor.call('transactions');
        return Transactions.find();
    },
    formatType: function() {
        if (this.type == 'kai') 
            return 'Open';
        else
            return 'Close';
    },
    formatDate: function() {
        var dateObj = new Date(this.create_time * 1000);
        return dateObj.format('m-d H:i:s');
    },
    isNegative: function(number) {
        return number < 0;
    },
    isPLZero: function() {
        return this.loss_profit == 0;
    },
    isFeeZero: function() {
        return this.fee == 0;
    },
    formatDescription: function() {
        switch (this.description) {
            case 'FT004': return 'Cancelled';
            case 'FT005': return 'Completed';
            case 'FT006': return 'Order?';
            case 'FT007': return 'Settlement';
            case 'FT008': return 'Margin Call';
        }
    },
    PLSum: function() {
        var sum = 0;
        Transactions.find().map(function(t) {
            sum += parseFloat(t.loss_profit);
        });

        return sum.toFixed(8);
    }
});

Template.errors.helpers({
    errors: function() {
        return Errors.find();
    },
    notifications: function() {
        return Notifications.find();
    }
});

Template.error.rendered = function() {
  var error = this.data;
  Meteor.setTimeout(function () {
    Errors.remove(error._id);
  }, 5000);
};

Template.notification.rendered = function() {
  var notification = this.data;
  Meteor.setTimeout(function () {
    Notifications.remove(notification._id);
  }, 5000);
};

TickerData.find({}).observe({
    added: function(post) {
        lastPrice = post.last;
    },
    changed: function(post) {
        lastPrice = post.last;
    }
});

Trades.find({}).observe({
    added: function(trade) {
        //console.log("TRADE: " + trade);
        document.title = "796+ | " + trade.price;
        if (trade.type == "sell") {
            $('#last-price').removeClass('higher');
            $('#last-price').addClass('lower');
        }
        else {
            $('#last-price').removeClass('lower');
            $('#last-price').addClass('higher');
        }
    }
});

throwError = function(message) {
    Errors.insert({message: message})
}

showNotification = function(message) {
    Notifications.insert({message: message});
}
