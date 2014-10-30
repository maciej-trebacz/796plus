Template.orderForm.events({
    'click .submit-order': function(e) {
        e.preventDefault();

        var direction = e.currentTarget.id;
        var qty = $('#order-form').find('#qty').val();
        var margin = $('#order-form').find('#margin').val();
        var price = $('#order-form').find('#price').val();

        makeRequest('openPosition', direction, price, qty, margin, function(error, result) {
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
            $(e.currentTarget).val((btc * times).toFixed(8));
        }
    }
});
