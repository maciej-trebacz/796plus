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