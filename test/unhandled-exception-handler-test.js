const expect = require('chai').expect;
const rewire = require('rewire');
const decorator = rewire('../index');

const originalAwsLogger = decorator.__get__('awsLogger');

describe('Unhandled exception handler decorator', function() {
  /*
   * prepare console spy
   */
  let fakeLogger;
  beforeEach(() => {
    fakeLogger = {
      error: function() {
        fakeLogger.args = arguments;
      }
    };
    decorator.__set__('awsLogger', fakeLogger)
  });
  afterEach(() => {
    decorator.__set__('awsLogger', originalAwsLogger)
  });
  /*
   * prepare invocation fake context
   */
  let executeHandler;

  beforeEach(() => {
     let testCallback;
     const finish = (err, data) => {
       setTimeout(() => testCallback(err,data))
     };
     const fakeContext = {
       succeed: (data) => finish(null,data),
       fail: (error) => finish(error),
       done: finish
     };
     executeHandler = (handler, callback) => {
       if (!callback) {
         throw new Error('no callback defined!')
       }
       testCallback = callback;
       decorator(handler)({},fakeContext, finish)
     }
   });

  context('when decorated handler explodes with an unhandled exception', () => {
    const verifyHandlerErrorsLoggedAndHidden = (handlerToDecorate, done) => {
      const verifyErrorsAreHiddenAndLogged = (err, success) => {
        expect(err).to.equal(decorator.DEFAULT_ERROR_MESSAGE);
        expect(fakeLogger.args).not.to.be.undefined;
        done()
      };

      executeHandler(handlerToDecorate, verifyErrorsAreHiddenAndLogged)
    };

    it('should hide thrown errors and log them', (done) => {
      const handlerThatThrows = (event,ctx,cb) => { throw new Error('some unhandled error') };
      verifyHandlerErrorsLoggedAndHidden(handlerThatThrows, done)
    });

    it('should hide callback non-string errors and log them', (done) => {
      const handlerThatRejectsWithAnError_cbStyle = (event,ctx,cb) => { cb(new Error('some unhandled error')) };
      verifyHandlerErrorsLoggedAndHidden(handlerThatRejectsWithAnError_cbStyle, done)
    });

    it('should hide context.fail non-string errors and log them', (done) => {
      const handlerThatRejectsWithAnError_ctxFailStyle = (event,ctx,cb) => { ctx.fail(new Error('some unhandled error')) };
      verifyHandlerErrorsLoggedAndHidden(handlerThatRejectsWithAnError_ctxFailStyle, done)
    });

    it('should hide context.done non-string errors and log them', (done) => {
      const handlerThatRejectsWithAnError_ctxDoneStyle = (event,ctx,cb) => { ctx.done(new Error('some unhandled error')) };
      verifyHandlerErrorsLoggedAndHidden(handlerThatRejectsWithAnError_ctxDoneStyle, done)
    })
  });

  context('when decorated handler rejects with custom error messages', () => {
    const SomeCustomErrorMsg = decorator.DEFAULT_ERROR_MESSAGE + "my custom message!";
    const verifyHandlerErrorIsPassedThroughUnlogged = (handlerToDecorate, expectedError, done) => {
      const verifyErrorHasBeenPassedThrough = (err, success) => {
        expect(err).to.equal(expectedError);
        expect(fakeLogger.args).to.be.undefined;
        done()
      };

      executeHandler(handlerToDecorate, verifyErrorHasBeenPassedThrough)
    };

    it('should pass callback string errors without doing anything', (done) => {
      const handlerThatRejectsWithCustomerErrorMessage_CbStyle = (event,ctx,cb) => { cb(SomeCustomErrorMsg) };
      verifyHandlerErrorIsPassedThroughUnlogged(handlerThatRejectsWithCustomerErrorMessage_CbStyle, SomeCustomErrorMsg, done)
    });

    it('should pass context.fail string errors without doing anything', (done) => {
      const handlerThatRejectsWithCustomerErrorMessage_CtxFailStyle = (event,ctx,cb) => { ctx.fail(SomeCustomErrorMsg) };
      verifyHandlerErrorIsPassedThroughUnlogged(handlerThatRejectsWithCustomerErrorMessage_CtxFailStyle, SomeCustomErrorMsg, done)
    });

    it('should pass context.done string errors without doing anything', (done) => {
      const handlerThatRejectsWithCustomerErrorMessage_CtxDoneStyle = (event,ctx,cb) => { ctx.done(SomeCustomErrorMsg) };
      verifyHandlerErrorIsPassedThroughUnlogged(handlerThatRejectsWithCustomerErrorMessage_CtxDoneStyle, SomeCustomErrorMsg, done)
    })
  })
});
