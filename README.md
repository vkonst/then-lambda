# AWS Lambda as chained ".then" steps
> A tiny module to write an AWS Lambda handler as execution steps chained by ".then"

## Why?
A Lambda handler often runs a number of consequent asynchronous computational steps.

Javascript's Promise API provides a nice way to chain them by ".then" calls.

Moreover, the "middleware" behaviour (like the one in express.js) may easily be incorporated in the "chain", making the code cleaner and simpler.

## Usage
As an example, consider a "web-hook" handler that, against a http(s) request, decrypts the data with AWS.KMS service, then queries some DB, then publishes a message on a queue with the AWS.IoT, and finally responds to the original http(s) request whether the data has been published.
<br/>Instead of being a "callback hell", the code may be as clean as:
```javascript
let ThenContext = require('../thenContext');

exports.handler = (event, context, callback) => {
    let thenCtx = new ThenContext(event, context, callback);
    thenCtx.promisify()
        .then(kmsDecrypt)
        .then(queryDBase)
        .then(publishIotMsg)
        .then(thenCtx.finalize)
        .catch(thenCtx.finalize);
};
```
Every ".then" function is passed with "thenContext" object and is expected to return the same object to the next function in the chain - ether directly or via the Promise resolving to it:   
```javascript
function publishIotMsg(thenCtx) {
    let device = thenCtx.config.device;
    let topic = thenCtx.config.topic;
    let msg = thenCtx.msg;

    return (new Publisher(device))
        .publish(topic, msg)
        .then(() => { return thenCtx });
}
```
Alternatively, any ".then" function may stop further processing and cause the request to be immediately responded like this:
```javascript
function kmsDecrypt(thenCtx) {
    // ...
    if (!isAuthorized) return Promise.reject("Unauthorized");
}
```
## API

### ThenContext(event, context, callback)
Returns "thenContext" object
### "thenContext" object
#### properties:
* __event, ctx, cb__ - event, context and callback the AWS Lambda function is called with 
* __config__ - (undefined by default) custom configuration/params
* __res__ - (empty object by default) response to pass to the "callback"
#### methods:
* __promisify()__
 <br/>returns itself as the immediately resolved promise
* __finilize(thenCtxOrError)__
 <br/>logs, prepares the response and invokes the "callback" with the response prepared.
 <br/>`thenCtxOrError` defines the arguments the 'callback' will be called with as follows.

* If __finilize__ is called with itself, null/undefined, or empty string, the 'callback' is invoked with "ok" response:
```javascript
thenCtx.finilize();     // alternatively: thenCtx.finilize(thenCtx);

// providing thenCtx.res.body is not defined, will result in:
callback(null, {
    headers: {'Content-Type': 'application/json'},
    body: '{"result":"Ok"}',
    statusCode: '200'
});
```
* If __thenCtx.res.body__ is defined, it will be passed to the 'callback':
```javascript
thenCtx.res.body = '{"device-status": "ONLINE"}';               // mandatory, non-empty
thenCtx.res.headers = {'Content-Type': 'application/json'};     // optional, 'text/plain' by default
thenCtx.res.statusCode = '202';                                 // optional, '200' by default 

thenCtx.finalize();     // alternatively: thenCtx.finilize(thenCtx);

// will result in:
callback(null, {
    headers: {'Content-Type': 'application/json'},
    body: '{"device-status": "ONLINE"}',
    statusCode: '202'
});
```

* Otherwise, 'callback' is invoked with 'error' response: 
```javascript
thenCtx.finalize(new Error('Unauthorized'));

// no matter if thenCtx.res.body is defined or not, will result in:
callback(null, {
    headers: {'Content-Type': 'text/plain'},
    body: 'Unauthorized',
    statusCode: '400'
});
```

## Tests
`npm test`

## License
ISC © Vadim Konstantinov
