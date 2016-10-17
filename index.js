var awsLogger = require('aws-logger');

const DEFAULT_ERROR_MESSAGE = 'internal server error';

const isCustomError = (err) => typeof err === 'string';

const normalizeError = (err) => {
  if (err == null || isCustomError(err)) {
    return err;
  }

  awsLogger.error('Lambda rejected with error', err)
  awsLogger.error('Stack', err.stack)

  return DEFAULT_ERROR_MESSAGE;
}

const UnhandledExceptionHandler = (handlerFn) => (event, context, callback) => {
  console.log('Start UnhandledExceptionHandler decorator')
  const decoratedContext = Object.assign({}, context, {
    fail: (err) => context.fail(normalizeError(err)),
    done: (err, data) => context.done(normalizeError(err), data)
  })

  const decoratedCallback = (err, data) => callback(normalizeError(err), data)

  try {
    return handlerFn(event, decoratedContext, decoratedCallback)
  } catch (error) {
    awsLogger.error('Unhandled exception catched', error)
    awsLogger.error('Stack', error.stack)
    callback(DEFAULT_ERROR_MESSAGE)
  }
}

UnhandledExceptionHandler.DEFAULT_ERROR_MESSAGE = DEFAULT_ERROR_MESSAGE;

module.exports = UnhandledExceptionHandler
