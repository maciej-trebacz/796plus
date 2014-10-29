Router.configure({
	layoutTemplate: 'layout'
});

Router.map(function() {
	this.route('futures', {path: '/'});

	this.route('transactions', {path: '/transactions'});
});