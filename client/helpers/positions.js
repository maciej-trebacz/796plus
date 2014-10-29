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