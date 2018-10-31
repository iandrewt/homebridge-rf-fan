var locks = require('locks');
var request = require('request');
var Service, Characteristic;

module.exports = function(homebridge) {
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;
	homebridge.registerAccessory('homebridge-rf-fan', 'RF-Fan', Fan);
};

function Fan(log, config) {
	this.log = log;

	this.host = config.host || 'localhost';
	this.port = config.port || 5000;
	this.name = config.name || 'Fan';
	this.manufacturer = config.manufacturer || 'Mercator';
	this.model = config.model || 'FRM98';
	this.serial = config.serial || '0000-0000';
	this.id = config.id || 1;

	this.state = {
		power: false,
		speed: 0,
	};

	this.mutex = locks.createMutex()
}

Fan.prototype.getRelays = function(value, callback) {
	request({
		url: 'http://' + this.host + ":" + this.port + '/fan/api/v1.0/status',
		method: 'GET',
		json: true,
		body: value
	}, function(error, response, body) {
		if (error) {
			callback(error);
		} else if (response.statusCode == 200) {
			callback(null, body);
		} else {
			callback(new Error('HTTP response ' + response.statusCode + ': ' + JSON.stringify(body)));
		}
	});
};

Fan.prototype.updateRelays = function(value, callback) {
	request({
		url: 'http://' + this.host + '/fan/api/v1.0/update',
		method: 'POST',
		json: true,
		body: value
	}, function(error, response, body) {
		if (error) {
			callback(error);
		} else if (response.statusCode == 200) {
			callback(null);
		} else {
			callback(new Error('HTTP response ' + response.statusCode + ': ' + JSON.stringify(body)));
		}
	});
};

Fan.prototype.getFanState = function(callback) {
	info = {"id": this.id}
	this.getRelays(info, (error, data) => {
		if (error) {
			callback(error);
		} else {
			var state = {}
			speed = data["speed"]
			if (speed == 7) {
				state.power = true;
				state.speed = 100;
			} else if (speed == 6) {
				state.power = true;
				state.speed = 86;
			} else if (speed == 5) {
				state.power = true;
				state.speed = 71;
			} else if (speed == 4) {
				state.power = true;
				state.speed = 57;
			} else if (speed == 3) {
				state.power = true;
				state.speed = 43;
			} else if (speed == 2) {
				state.power = true;
				state.speed = 29;
			} else if (speed == 1) {
				state.power = true;
				state.speed = 14;
			} else {
				state.power = false;
				state.speed = 0;
			}
			this.state = state;
			callback(null, state);
		}
	});
};

Fan.prototype.setFanState = function(state, callback) {
	var relay;
	if (state.power && state.speed > 86) {
		relay = 7;
	} else if (state.power && state.speed > 71) {
		relay = 6;
	} else if (state.power && state.speed > 57) {
		relay = 5;
	} else if (state.power && state.speed > 43) {
		relay = 4;
	} else if (state.power && state.speed > 29) {
		relay = 3;
	} else if (state.power && state.speed > 14) {
		relay = 2;
	} else if (state.power && state.speed > 0) {
		relay = 1;
	} else {
		relay = 0;
	}

	var update1 = {
	};
	update1["id"] = this.id;
	update1["speed"] = relay;

	var update2 = {
		1: false,
		2: false,
		3: false,
		4: false,
		5: false,
		6: false,
		7: false
	};

	if (relay) {
		delete update2[relay];
	}

	this.mutex.timedLock(5000, (error) => {
		if (error) {
			callback(error);
			return;
		}

		this.updateRelays(update1, (error) => {
			if (error) {
				this.mutex.unlock();
				callback(error);
				return;
			}

			this.updateRelays(update1, (error) => {
				this.mutex.unlock();
				callback(error);
				return;
			});
		});
	});
}

Fan.prototype.identify = function(callback) {
	this.log("Identify requested!");
	this.updateRelays({8: true}, (error) => {
		if (error) {
			callback(error);
			return;
		}
		setTimeout(() => {
			this.updateRelays({8: false}, callback);
		}, 500);
	});
};

Fan.prototype.getServices = function() {
	this.informationService = new Service.AccessoryInformation();
	informaitonService
	.setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
	.setCharacteristic(Characteristic.Model, this.model)
	.setCharacteristic(Characteristic.SerialNumber, this.serial)

	this.fanService = new Service.Fan();
	this.fanService.getCharacteristic(Characteristic.On)
	.on('get', this.getOn.bind(this))
	.on('set', this.setOn.bind(this));
	this.fanService.getCharacteristic(Characteristic.RotationSpeed)
	.setProps({
		minValue: 0,
		maxValue: 100,
		minStep: 1,
	})
	.on('get', this.getSpeed.bind(this))
	.on('set', this.setSpeed.bind(this));

	return [this.informationSerivce, this.fanService];
};

Fan.prototype.getOn = function(callback) {
	this.getFanState(function(error, state) {
		callback(null, state && state.power);
	});
};

Fan.prototype.setOn = function(value, callback) {
	if (this.state.power != value) {
		this.log('setting power to ' + value);
		this.state.power = value;
		this.setFanState(this.state, callback);
	} else {
		callback(null);
	}
};

Fan.prototype.getSpeed = function(callback) {
	this.getFanState(function(error, state) {
		callback(null, state && state.speed);
	});
};

Fan.prototype.setSpeed = function(value, callback) {
	if (this.state.speed != value) {
		this.log('setting speed to ' + value);
		this.state.speed = value;
		this.setFanState(this.state, callback);
	} else {
		callback(null);
	}
};
