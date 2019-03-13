let awsLogger = require('aws-logger'); // cannot be const as it's overwritten for mocking in tests

const DEFAULT_ERROR_MESSAGE = 'internal server error';

const isCustomError = (err) => typeof err === 'string' || err.customError;

const normalizeError = (err) => {
  if (err == null || isCustomError(err)) {
    return err;
  }

  awsLogger.error('Lambda rejected with error', err);

  return DEFAULT_ERROR_MESSAGE;
};

const UnhandledExceptionHandler = (handlerFn) => (event, context, callback) => {
  awsLogger.log('Start UnhandledExceptionHandler decorator');
  console.dir({event, context, callback});
  const decoratedContext = Object.assign({}, context, {
    fail: (err) => context.fail(normalizeError(err)),
    done: (err, data) => context.done(normalizeError(err), data)
  });

  const decoratedCallback = (err, data) => {
    awsLogger.log("Normalising error:");
    console.dir(err);
    const normErr = normalizeError(err);
    console.dir(normErr);
    return callback(normErr, data)
  };

  try {
    const res =  handlerFn(event, decoratedContext, decoratedCallback);
    awsLogger.log("Finish UnhandledExceptionHandler decorator");
    console.dir(res);
    return res;
  } catch (error) {
    awsLogger.error('Unhandled exception caught', error);
    callback(DEFAULT_ERROR_MESSAGE)
  }
};

UnhandledExceptionHandler.DEFAULT_ERROR_MESSAGE = DEFAULT_ERROR_MESSAGE;

module.exports = UnhandledExceptionHandler;
