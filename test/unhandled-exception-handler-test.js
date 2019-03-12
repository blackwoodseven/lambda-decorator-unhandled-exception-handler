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

  /*
   * helper functions to check whether error are hidden or not
   */
  const verifyHandlerErrorsLoggedAndHidden = (handlerToDecorate, done) => {
    const verifyErrorsAreHiddenAndLogged = (err, success) => {
      expect(err).to.equal(decorator.DEFAULT_ERROR_MESSAGE);
      expect(fakeLogger.args).not.to.be.undefined;
      done()
    };

    executeHandler(handlerToDecorate, verifyErrorsAreHiddenAndLogged)
  };

  const verifyHandlerErrorIsPassedThroughUnlogged = (handlerToDecorate, expectedError, done) => {
    const verifyErrorHasBeenPassedThrough = (err, success) => {
      expect(err).to.equal(expectedError);
      expect(fakeLogger.args).to.be.undefined;
      done()
    };

    executeHandler(handlerToDecorate, verifyErrorHasBeenPassedThrough)
  };

  const verifyDecoratorHidesError = (error, msg) => {
    it(`should hide callback ${msg} and log them`, (done) => {
      const handlerThatRejects_cbStyle = (event,ctx,cb) => { cb(error) };
      verifyHandlerErrorsLoggedAndHidden(handlerThatRejects_cbStyle, done)
    });

    it(`should hide context.fail ${msg} and log them`, (done) => {
      const handlerThatRejects_ctxFailStyle = (event,ctx,cb) => { ctx.fail(error) };
      verifyHandlerErrorsLoggedAndHidden(handlerThatRejects_ctxFailStyle, done)
    });

    it(`should hide context.done ${msg} and log them`, (done) => {
      const handlerThatRejects_ctxDoneStyle = (event,ctx,cb) => { ctx.done(error) };
      verifyHandlerErrorsLoggedAndHidden(handlerThatRejects_ctxDoneStyle, done)
    })
  };

  const verifyDecoratorPassThroughError = (error, msg) => {
    it(`should pass callback  ${msg} without doing anything`, (done) => {
      const handlerThatRejects_CbStyle = (event,ctx,cb) => { cb(error) };
      verifyHandlerErrorIsPassedThroughUnlogged(handlerThatRejects_CbStyle, error, done)
    });

    it(`should pass context.fail ${msg} without doing anything`, (done) => {
      const handlerThatRejects_CtxFailStyle = (event,ctx,cb) => { ctx.fail(error) };
      verifyHandlerErrorIsPassedThroughUnlogged(handlerThatRejects_CtxFailStyle, error, done)
    });

    it(`should pass context.done ${msg} without doing anything`, (done) => {
      const handlerThatRejects_CtxDoneStyle = (event,ctx,cb) => { ctx.done(error) };
      verifyHandlerErrorIsPassedThroughUnlogged(handlerThatRejects_CtxDoneStyle, error, done)
    })
  };

  /*
   * Hiding actual Errors
   */
  context('when decorated handler explodes with an unhandled exception', () => {
    it('should hide thrown errors and log them', (done) => {
      const handlerThatThrows = (event,ctx,cb) => { throw new Error('some unhandled error') };
      verifyHandlerErrorsLoggedAndHidden(handlerThatThrows, done)
    });

    verifyDecoratorHidesError(new Error('some unhandled error'), "exceptions");
  });

  context('when decorated handler rejects with custom error messages', () => {
    verifyDecoratorPassThroughError(decorator.DEFAULT_ERROR_MESSAGE + "my custom message!", "string errors")
  });

  // context('when decorated handler rejects with custom error object', () => {
  //   const SomeCustomErrorObject = { errorMsg: decorator.DEFAULT_ERROR_MESSAGE + "my custom message!", customError: true };
  //   const verifyHandlerErrorIsPassedThroughUnlogged = (handlerToDecorate, expectedError, done) => {
  //     const verifyErrorHasBeenPassedThrough = (err, success) => {
  //       expect(err).to.equal(expectedError);
  //       expect(fakeLogger.args).to.be.undefined;
  //       done()
  //     };
  //
  //     executeHandler(handlerToDecorate, verifyErrorHasBeenPassedThrough)
  //   };
  //
  //   it('should pass callback string errors without doing anything', (done) => {
  //     const handlerThatRejectsWithCustomerErrorMessage_CbStyle = (event,ctx,cb) => { cb(SomeCustomErrorMsg) };
  //     verifyHandlerErrorIsPassedThroughUnlogged(handlerThatRejectsWithCustomerErrorMessage_CbStyle, SomeCustomErrorMsg, done)
  //   });
  //
  //   it('should pass context.fail string errors without doing anything', (done) => {
  //     const handlerThatRejectsWithCustomerErrorMessage_CtxFailStyle = (event,ctx,cb) => { ctx.fail(SomeCustomErrorMsg) };
  //     verifyHandlerErrorIsPassedThroughUnlogged(handlerThatRejectsWithCustomerErrorMessage_CtxFailStyle, SomeCustomErrorMsg, done)
  //   });
  //
  //   it('should pass context.done string errors without doing anything', (done) => {
  //     const handlerThatRejectsWithCustomerErrorMessage_CtxDoneStyle = (event,ctx,cb) => { ctx.done(SomeCustomErrorMsg) };
  //     verifyHandlerErrorIsPassedThroughUnlogged(handlerThatRejectsWithCustomerErrorMessage_CtxDoneStyle, SomeCustomErrorMsg, done)
  //   })
  // });
});
