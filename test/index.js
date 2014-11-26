var assert = require('assert');
var dgram = require('dgram');

var Server = require('../server');
var Client = require('../client');

var ip = '239.6.6.6';
var port = 1234;

var socket = undefined;

before('setup sending socket', function(done) {
    socket = dgram.createSocket('udp4');
    socket.bind(port, function() {
        socket.addMembership(ip);
        done();
    });
});

var tcp_port = undefined;
test('should setup server', function(done) {
    var server = Server('udp://239.6.6.6:1234')
    server.listen(0, function() {
        tcp_port = server.address().port;
        done();
    });
});

test('should setup client', function(done) {
    var client = Client('tcp://localhost:' + tcp_port);
    var expected = ['test', 'hello world'];
    client.on('message', function(msg) {
        var exp = expected.shift();
        assert.equal(msg, exp);

        if (expected.length == 0) {
            client.close(done);
        }
    });

    var buf = new Buffer('test')
    socket.send(buf, 0, buf.length, port, ip);
    var buf = new Buffer('hello world')
    socket.send(buf, 0, buf.length, port, ip);
});

test('should rebroadcast', function(done) {
    var client = Client('tcp://localhost:' + tcp_port, 'udp://239.7.7.7:7777');
    var messages = ['test', 'hello world'];

    var recv = dgram.createSocket('udp4');
    recv.bind(7777, function(err) {
        assert.ifError(err);
        recv.addMembership('239.7.7.7');
    });

    recv.on('message', function(msg) {
        var expected = messages.shift();
        assert.equal(msg, expected);

        if (messages.length == 0) {
            client.close(done);
        }
    });

    setTimeout(function() {
        messages.forEach(function(msg) {
            var buf = new Buffer(msg)
            socket.send(buf, 0, buf.length, port, ip);
        });
    }, 1000);
});
