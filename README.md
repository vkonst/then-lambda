# AWS Lambda handler as chained ".then" execution steps
> A tiny module to write an AWS Lambda handler as execution steps chained by ".then"

## Why?
A Lambda handler often runs some consequent asynchronous computational steps.
Javascript's Promise API provides a nice way to chain them by ".then" calls.
Moreover, the "middleware" behaviour (like in "express.js") may easily be incorporated in the "chain", making the code cleaner and simpler.

## Usage
As an example, consider a "web-hook" handler that, against an http(s) request, decrypts the data with AWS.KMS service, then queries some DB, then publishes a message on a queue with the AWS.IoT, and finally responds to the original http(s) request whether the data has been published.
Instead of being a "callback hell", the code may be as clean as:

```javascript
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

Any one of steps above may either passes processed data to the next step in the chain or it may stops further processing and causes the request to be responded like that:
```javascript
function kmsDecrypt(thenCtx) {
    // ...
    if (!isAuthorized) return Promise.reject("Unauthorized");
}
```
## License

ICS © Andrew McLagan