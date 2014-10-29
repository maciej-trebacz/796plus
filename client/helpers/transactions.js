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