lastPrice = 0;

Meteor.subscribe('tickerdata');
Meteor.subscribe('trades');
Meteor.subscribe('bids');
Meteor.subscribe('asks');
Meteor.subscribe('orders');
Meteor.subscribe('positions');
Meteor.subscribe('balances');
Meteor.subscribe('transactions');

pendingRequests = [];
processing = false;
makeRequest = function() {
    pendingRequests.push({call: Array.prototype.slice.apply(arguments), tries: 0, running: false, complete: false});
    processRequests();
};

processRequests = function() {
    if (processing) return;
    processing = true;
    for (key in pendingRequests) {
        var request = pendingRequests[key];
        if (!request.running) {
            request.running = true;
            request.tries++;

            var args = request.call.slice(0, -1);
            var callback = request.call[request.call.length - 1];
            args.push(function(error, result) {
                if (error) {
                    if (tries < 4) {
                        request.running = false;
                    }
                    else {
                        throwError(error);
                    }
                }
                else {
                    request.complete = true;
                    console.log(result);
                    callback(error, result);
                }
            });
            Meteor.call.apply(null, args);
        }
    }
    processing = false;
}
