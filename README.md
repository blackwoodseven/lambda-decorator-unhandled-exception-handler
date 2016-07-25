# unhandled-exception-handler-decorator
AWS Lambda decorator to hide errors and unhandled exception from caller.

## Usage
In order to use the logger, first you need to add it to your dependencies with:
```bash
npm install --save git+ssh://git@github.com/blackwoodseven/unhandled-exception-handler-decorator.git#v1.0.0
```
Note that you should specify which version you need by indicating the git tag after the hash.

This decorator uses the [aws-logger](https://github.com/blackwoodseven/aws-logger) to log catched errors, so you'll probably like to use the [aws-logger-decorator](https://github.com/blackwoodseven/aws-logger-decorator) so it is initialized with the environment defined by the [set-environment-decorator](https://github.com/blackwoodseven/set-environment-decorator).

All placed together, it looks like:
```js
const handler = require('./handler')
const setEnvironmentDecorator = require('set-environment-decorator')
const awsLoggerDecorator = require('aws-logger-decorator')
const unhandledExceptionHandlerDecorator = require('unhandled-exception-handler-decorator')

exports.handler =
  setEnvironmentDecorator(
      awsLoggerDecorator(
        unhandledExceptionHandlerDecorator(
          handler
        )
      )
  )
```
