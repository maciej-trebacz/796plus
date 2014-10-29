Template.transactions.helpers({
    transactions: function() {
        Meteor.call('transactions');
        return Transactions.find({}, {sort: {create_time: -1}});
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
    },
    profitLossChart: function() {
        var transactions = Transactions.find({loss_profit: {$ne: 0}}, {sort: {create_time: 1}}).fetch();
        var data = [];
        var lastValue = 0;

        transactions.forEach(function(t) {
            lastValue += parseFloat(t.loss_profit);
            data.push([t.create_time * 1000, lastValue]);
        });

        console.log(data);

        return {
            chart: {
                type: 'spline'
            },
            title: {
                text: 'Profit/Loss Chart'
            },
            xAxis: {
                type: 'datetime',
                dateTimeLabelFormats: { // don't display the dummy year
                    month: '%e. %b',
                    year: '%b'
                },
                title: {
                    text: 'Date'
                }
            },
            yAxis: {
                title: {
                    text: 'BTC'
                }
            },
            tooltip: {
                headerFormat: '<b>{series.name}</b><br>',
                pointFormat: '{point.x:%e. %b %H:%M}: {point.y:.8f} BTC'
            },

            series: [{
                name: 'Profit/Loss (BTC)',
                data: data
            }]
        };
    }
});