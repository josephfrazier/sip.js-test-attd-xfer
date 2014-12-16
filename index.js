global.SIP = require('sip.js');
global.authFactory = require('sip.js-auth-onsip')(SIP);

var password = prompt('password');
global.uris = {
  "referer": prompt('referer'),
  "referee": prompt('referee'),
  "referTarget": prompt('referTarget')
};

var streamPromise = SIP.WebRTC.isSupported() && SIP.WebRTC.getUserMedia({audio: true});

streamPromise.then(function (stream) {
  global.referer = buildUA(uris.referer);
  referer.on('registered', function () {

    global.referee = buildUA(uris.referee);
    referee.on('registered', function () {

      global.referTarget = buildUA(uris.referTarget);
      referTarget.on('registered', function () {

        invite(referer, uris.referee).on('accepted', function () {
          var refereeSession = this;
          invite(referer, uris.referTarget).on('accepted', function () {
            var targetSession = this;
            refereeSession.off('refer');
            refereeSession.refer(targetSession);
          })
        })
      });
    });
  });

  function buildUA (uri) {
    return new SIP.UA({
      traceSip: true,
      uri: uri,
      //replaces: SIP.C.supported.UNSUPPORTED,
      authenticationFactory: authFactory(uri, password)
    })
    .on('invite', function (session) {
      console.trace('XXX accepting', session);
      session.accept({
        media: {
          stream: stream
        }
      });

      session.on('refer', session.followRefer(function (newSession) {
        console.trace('XXX followed refer to', newSession);
      }));

      session.on('terminated', function () {
        console.trace("XXX TERMINATED", this);
      });
    })
  }

  function invite(from, to) {
    return from.invite(to, {
      media: {
        stream: stream
      }
    });
  }

  global.invite = invite;
});

global.stop = function () {
  referer.stop();
  referee.stop();
  referTarget.stop();
}
