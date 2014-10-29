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