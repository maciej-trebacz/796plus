Template.ticker.helpers({
    ticker: function () {
        return TickerData.findOne();
    }
});

TickerData.find({}).observe({
    added: function(post) {
        lastPrice = post.last;
    },
    changed: function(post) {
        lastPrice = post.last;
    }
});