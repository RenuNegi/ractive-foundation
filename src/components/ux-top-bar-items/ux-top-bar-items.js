Ractive.extend({
	template: Ractive.defaults.templates['ux-top-bar-items'],
	isolated: true,
	data: {
		getTopBarItemCssClass: function (item) {
			var classes = [];
			if (item.active) {
				classes.push('active');
			}
			if (item.hasForm) {
				classes.push('has-form');
			}
			if (item.items && item.items.length > 0) {
				// Note: not-click needed for focus/hover with html class=js. Silly.
				classes.push('has-dropdown not-click');
			}
			return classes.join(' ');
		}
	}
});
