Template.futures.helpers({
    tickChart: function() {
        var transactions = Trades.find({}, {sort: {date: 1}, limit: 100}).fetch();
        var data = [];

        transactions.forEach(function(t) {
            data.push([parseFloat(t.price)]);
        });

        console.log(data);

        return {
            chart: {
                type: 'spline'
            },
            title: {
                text: 'Tick Chart'
            },
            xAxis: {
                //type: 'datetime',
                // dateTimeLabelFormats: { // don't display the dummy year
                //     month: '%e. %b',
                //     year: '%b'
                // },
                // title: {
                //     text: 'Date'
                // }
            },
            yAxis: {
                title: {
                    text: 'Price ($)'
                }
            },
            tooltip: {
                headerFormat: '<b>{series.name}</b><br>',
                pointFormat: '${point.y:.2f}'
            },

            series: [{
                name: 'Price ($)',
                data: data
            }]
        };
    }
});