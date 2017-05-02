# AWS Lambda as chained ".then" steps
> A tiny module to write an AWS Lambda handler as execution steps chained by ".then"

## Why?
A Lambda handler often runs a number of consequent asynchronous computational steps.
Javascript's Promise API provides a nice way to chain them by ".then" calls.
Moreover, the "middleware" behaviour (like the one in express.js) may easily be incorporated in the "chain", making the code cleaner and simpler.

## Usage
As an example, consider a "web-hook" handler that, against an http(s) request, decrypts the data with AWS.KMS service, then queries some DB, then publishes a message on a queue with the AWS.IoT, and finally responds to the original http(s) request whether the data has been published.
Instead of being a "callback hell", the code may be as clean as:
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
Every ".then" function is passed "thenContext" object and is expected to return the same object to the next function in the chain - ether directly or via the Promise:   
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
Alternatively, any ".then" function may stop further processing and cause the request to be immediately responded like that:
```javascript
function kmsDecrypt(thenCtx) {
    // ...
    if (!isAuthorized) return Promise.reject("Unauthorized");
}
```
## API
### Properties of "thenContext" object:
* event, ctx, cb - event, context and callback the AWS Lambda function is called with 
* config: undefined - to share custom configuation / params between ".then" steps / modules
* res: {} - response to pass to the "callback" 
### Methods of "thenContext" object:
* promisify() - returns itself as the immediately resolved promise
* finilize(thenCtx, arguments) - log, prepare response and invoke "callback" with the response prepared

## Tests
`npm test`

## License
ISC © Vadim Konstantinov
