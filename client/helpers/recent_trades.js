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