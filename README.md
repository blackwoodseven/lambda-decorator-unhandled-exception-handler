# unhandled-exception-handler-decorator
AWS Lambda decorator to hide errors and unhandled exception from caller.

## Usage
In order to use the logger, first you need to add it to your dependencies with:
```bash
npm install --save git+ssh://git@github.com/blackwoodseven/lambda-decorator-unhandled-exception-handler.git#v1.0.1
```
Note that you should specify which version you need by indicating the git tag after the hash.

This decorator uses the [aws-logger](https://github.com/blackwoodseven/aws-logger) to log catched errors, so you'll probably like to use the [lambda-decorator-aws-logger-decorator](https://github.com/blackwoodseven/lambda-decorator-aws-logger) so it is initialized with the environment defined by the [lambda-decorator-set-environment-decorator](https://github.com/blackwoodseven/lambda-decorator-set-environment).

All placed together, it looks like:
```js
const handler = require('./handler')
const setEnvironmentDecorator = require('lambda-decorator-set-environment-decorator')
const awsLoggerDecorator = require('lambda-decorator-aws-logger')
const unhandledExceptionHandlerDecorator = require('lambda-decorator-unhandled-exception-handler')

exports.handler =
  setEnvironmentDecorator(
      awsLoggerDecorator(
        unhandledExceptionHandlerDecorator(
          handler
        )
      )
  )
```
