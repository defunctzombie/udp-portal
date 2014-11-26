# udp-portal

tunnel UDP traffic over TCP

## CLI

```
udp-portal server udp://239.5.5.5:4005 tcp://localhost:8000
udp-portal client tcp://hostname:8080 udp://239.5.5.5:4005
```

## API

### Server

```js
var portal = require('udp-portal');

var server = portal.server('udp://239.5.5.5:4005');
server.listen(function() {
    server.address().port;
});
```

### Client

The client API is can connect to the udp-portal server as well as replay udp packets.

To just connect and listen for forwarded udp messages.

```js
var client = portal.client('tcp://localhost:port');
client.on('message', function(msg) {
    client.close();
});
```

Alternatively, you can have the client replay messages back out to a UDP address/port.

```js
var client = portal.client('tcp://localhost:port', 'udp://239.6.6.6:4005');
```

## License

MIT
