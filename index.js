var _      = require('lodash')
var Meteor = require('meteor-core')(lodash)

require('meteor-tracker')(Meteor)
var Tracker = Meteor.Tracker

require("object.observe")


function ReactiveMap(map)
{
	// called without `new`
	if (!(this instanceof ReactiveMap))
		return new ReactiveMap(map);

	this._map = map || {};
	this._dep = new Tracker.Dependency;


	var observer = this._dep.changed.bind(this._dep)

	if(map)
		Object.keys(map).forEach(function(key)
		{
			Object.observe(map[key], observer)
		})


	function setMap(value)
	{
		var map = this._map
		Object.keys(map).forEach(function(key)
		{
			Object.unobserve(map[key], observer)
		})

		this._map = value
		this._dep.changed()
	}


	// Entries (globally)

	this.assign = function(collection, iteratee)
	{
		setMap(_.indexBy(collection, iteratee))

		collection.forEach(function(item)
		{
			Object.observe(item, observer)
		})
	};

	this.clear = setMap.bind(this, {})


	// Entries

	this.set = function(key, item) {
		if(this._map[key] !== item)
		{
			this._map[key] = item

			Object.observe(item, observer)

			this._dep.changed()
		}
	};

	this.delete = function(key)
	{
		Object.unobserve(this._map[key], observer)

		delete this._map[key]

		this._dep.changed()
	};
};


ReactiveMap.prototype.size = function() {
	return this.keys().length;
};

ReactiveMap.prototype.toString = function() {
	return 'ReactiveObject'+this._map.toSource()
};


// Entries

ReactiveMap.prototype.get = function(key) {
	if (Tracker.active) this._dep.depend();

	return this._map[key];
};

ReactiveMap.prototype.has = function(key) {
	return this.get(key) !== undefined;
};


// Access functions

['filter', 'keys', 'map', 'sortBy', 'values'].forEach(function(methodName)
{
	ReactiveMap.prototype[methodName] = function(value) {
		if (Tracker.active) this._dep.depend();

		return _[methodName](this._map, value);
	};
})


module.exports = ReactiveMap
