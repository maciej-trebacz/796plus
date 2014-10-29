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

throwError = function(message) {
    Errors.insert({message: message})
}

showNotification = function(message) {
    Notifications.insert({message: message});
}
