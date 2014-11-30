var EventEmitter = require('events').EventEmitter;
var net = require('net');
var dgram = require('dgram');
var url = require('url');

module.exports = function(uri, rebroadcast_uri) {
    var ee = new EventEmitter();

    uri = url.parse(uri);

    var client = net.connect(uri.port, uri.hostname);

    client.on('connect', function() {
        console.log('connected to ' + url.format(uri));
    });

    client.on('close', function() {
        console.error('connection to ' + url.format(uri) + ' lost, reconnecting');
        setTimeout(function() {
            client.connect(uri.port, uri.hostname);
        }, 1000);
    })

    client.on('error', function(err) {
        ee.emit('error', err);
    });

    var current_buff = undefined;
    var current_size = 0;
    var current_offset = 0;

    client.on('data', function(chunk) {

        var read_offset = 0;

        while (read_offset < chunk.length) {

            if (!current_buff) {
                var msg_size = chunk.readUInt16BE(read_offset);
                current_buff = new Buffer(msg_size);
                current_size = msg_size;
                current_offset = 0;
                read_offset += 2;

                // let next loop iteration read the chunk
                continue;
            }

            // we already have a working buffer
            var remaining_read = current_size - current_offset;
            var read_bytes = Math.min(remaining_read, chunk.length - read_offset);
            chunk.copy(current_buff, current_offset, read_offset, read_offset + read_bytes);
            current_offset += read_bytes;
            read_offset += read_bytes;

            if (current_offset < current_size) {
                continue;
            }

            ee.emit('message', current_buff);

            current_buff = undefined;
            current_size = 0;
            current_offset = 0;
        }
    });

    ee.close = function(done) {
        client.once('end', done);
        ee.removeAllListeners();
        client.end();
    };

    if (!rebroadcast_uri) {
        return ee;
    }

    rebroadcast_uri = url.parse(rebroadcast_uri);

    var port = rebroadcast_uri.port;
    var ip = rebroadcast_uri.hostname;

    var udp = dgram.createSocket('udp4');

    udp.bind(rebroadcast_uri.port, function(err) {
        if (err) {
            return ee.emit('error', err);
        }

        udp.addMembership(ip);
    });

    var out_queue = [];

    ee.on('message', function(buff) {
        if (out_queue.length > 0) {
            return out_queue.push(buff);
        }

        flush_queue(buff);
    });

    function flush_queue(buff) {
        if (!buff) {
            return;
        }

        udp.send(buff, 0, buff.length, port, ip, function(err) {
            if (err) {
                return ee.emit('error', err);
            }

            setImmediate(flush_queue, out_queue.shift());
        });
    }

    return ee;
};
