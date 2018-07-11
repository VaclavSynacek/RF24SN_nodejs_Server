#!/usr/bin/env node

"use strict";
/*jslint node: true */

var winston = require('winston');
var util = require('util');
var url = require('url');
var _ = require('struct-fu');
var nrf = require('nrf');
var mqtt = require('mqtt');
var argv = require('yargs')
    .usage('Communication gateway between nRF24L01 network and MQTT broker.\nUsage: $0')
    .example('$0', 'run with the default configuration')
    .example('$0 -b mqtt://localhost:1883 -spi /dev/spidev0.0 -ce 25 -irq 24', 'run with all parameters specified')
	.alias('b', 'broker')
	.alias('?', 'help')
	.alias('v', 'verbose')
	.count('verbose')
	.describe('b', 'URL of the MQTT broker')
	.describe('spi', 'device file for the SPI interface')
	.describe('ce', 'GPIO pin for the CE')
	.describe('irq', 'GPIO pin for the IRQ')
    .default({ b : 'mqtt://localhost:1883', spi : '/dev/spidev0.0', ce: 25, irq: 24 })
    .argv;

var loggingLevels = ['warn', 'info', 'verbose', 'debug', 'silly'];
var loggingLevel = loggingLevels[argv.verbose];
var logger = new (winston.Logger)({
    transports: [new (winston.transports.Console)({ level: loggingLevel, colorize: true })]
  });  
winston.debug('logging level set to ' + loggingLevel);

var mqttUrl = url.parse(process.env.MQTT_BROKER_URL || argv.b);
var mqttAuth = (mqttUrl.auth || ':').split(':');

var mqttClient = mqtt.createClient(mqttUrl.port, mqttUrl.hostname, {
  username: mqttAuth[0],
  password: mqttAuth[1]
});



var messageStore = [];

mqttClient.subscribe('RF24SN/out/+/+');
mqttClient.on('message', function(topic, message) {
	logger.verbose('received MQTT message ' + util.inspect({topic: topic, message: message}));
	messageStore[topic] = parseFloat(message);
	logger.silly('now the messageStore contains ' + util.inspect(messageStore));
});



// when using node-nrf, the struct members come in oposite order than sent
// this took me some tome to figure out
var RawPacket = _.struct([
	_.float32("value"),		// the actual value of the measurement being transmitted
	_.uint8("sensorId"),	// sensor id (unique within a client node)
	_.uint8("nodeId"),		// client node id (unique within one RF24Star network));
	_.uint8("reserved"),	// not used
	_.uint8("packetType")	// 0=reserved, 1=publish, 2=puback, 3=request, 4=response
]); 

//the actual sending and recieving logic functions which are later called by nrf event handlers
var processPublishPacket = function(packet) {
		logger.info('publish packet received ' + util.inspect(packet) );
		packet.packetType = 2;
		setTimeout(function(){sendPacket(packet);}, 50);
		var topic = 'RF24SN/in/' + packet.nodeId.toString() + '/' + packet.sensorId.toString();
		var message = packet.value.toString();
		mqttClient.publish(topic, message);
		logger.debug('published MQTT message ' + util.inspect({topic: topic, message: message}) );
	};

var processRequestPacket = function(packet) {

		logger.info('request packet received ' + util.inspect(packet) );
		packet.packetType = 4;
		var topic = 'RF24SN/out/' + packet.nodeId.toString() + '/' + packet.sensorId.toString();
		packet.value = messageStore[topic];
		setTimeout(function(){sendPacket(packet);}, 50);
	};

var sendPacket = function(packet) {
		if (!replyPipes[packet.nodeId]) {
			logger.silly('opening new TX pipe for new client ' + packet.nodeId);
			replyPipes[packet.nodeId] = radio.openPipe('tx', 0xF0F0F0F000 + packet.nodeId, {
				size: RawPacket.size,
				autoAck: false
			});
			logger.silly('replyPipes now contain ' + util.inspect(replyPipes) );
		}
		replyPipes[packet.nodeId].write(RawPacket.bytesFromValue(packet));
	};

// nRF24l01 general initialization
var radio = nrf.connect(argv.spi, argv.ce, argv.irq);
radio.channel(0x4c).dataRate('1Mbps').crcBytes(2).autoRetransmit({
	count: 15,
	delay: 500
});

var listeningPipe;
var replyPipes = [];


//nRF24l01 listening handlers
radio.begin(function() {
	var listeningPipe = radio.openPipe('rx', 0xF0F0F0F000, {
		size: RawPacket.size,
		autoAck: false
	});

	listeningPipe.on('data', function(p) {
		var packet = RawPacket.valueFromBytes(p);

		// decide if the packet contains a value reported by client node or a request for a value
		if (packet.packetType == 1) processPublishPacket(packet);
		else if (packet.packetType == 3) processRequestPacket(packet);
		else logger.warn('wrong packet type received ' + util.inspect(packet) );
	});

	listeningPipe.on('error', function(err) {
		logger.err('got nrf error',  err);
	});
	
	logger.debug('radio initialized');
});



