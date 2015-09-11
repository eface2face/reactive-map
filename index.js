module.exports = function(Meteor) {
var Tracker = Meteor.Tracker

require("object.observe")


function setMap(value, observer)
{
	this._map.forEach(function(value)
	{
		Object.unobserve(value, observer)
	})

	this._map = new Map(value)
	this._dep.changed()
}


function ReactiveMap(map)
{
	// called without `new`
	if (!(this instanceof ReactiveMap))
		return new ReactiveMap(map);

	this._map = (map instanceof Map) ? map : new Map(map)
	this._dep = new Tracker.Dependency


	var observer = this._dep.changed.bind(this._dep)

	if(map)
		map.forEach(function(value)
		{
			Object.observe(value, observer)
		})


	// Entries (globally)

	this.assign = function(collection, iteratee)
	{
		var map = collection.map(function(entry)
		{
			return [entry[iteratee], entry]
		})
		setMap.call(this, map, observer)

		collection.forEach(function(item)
		{
			Object.observe(item, observer)
		})
	};

	this.clear = setMap.bind(this, [], observer)


	// Entries

	this.set = function(key, item) {
		if(this._map.get(key) !== item)
		{
			this._map.set(key, item)
			Object.observe(item, observer)

			this._dep.changed()
		}
	};

	this.delete = function(key)
	{
		Object.unobserve(this._map.get(key), observer)
		this._map.delete(key)

		this._dep.changed()
	};
};


Object.defineProperty(ReactiveMap, 'length', {enumerable: true, value: 0})

Object.defineProperty(ReactiveMap.prototype, 'size',
{
	enumerable: true,
	get: function()
	{
		if (Tracker.active) this._dep.depend();

		return this._map.size
	}
})

ReactiveMap.prototype.values = function()
{
	if(Tracker.active) this._dep.depend()

	var result = []

	var it = this._map.values()
	var itValue
	while((itValue = it.next()) && !itValue.done)
		result.push(itValue.value)

	return result
}


// Proxied methods

var methodNames = ['forEach', 'get', 'has', 'keys']
methodNames.forEach(function(methodName)
{
	ReactiveMap.prototype[methodName] = function() {
		if (Tracker.active) this._dep.depend();

		return this._map[methodName].apply(this._map, arguments)
	};
})


return ReactiveMap
}
