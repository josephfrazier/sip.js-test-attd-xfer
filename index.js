global.SIP = require('sip.js');
global.authFactory = require('sip.js-auth-onsip')(SIP);

var password = prompt('password');
global.uris = {
  "referer": prompt('referer'),
  "referee": false,
  "referTarget": false,
};

var streamPromise = SIP.WebRTC.isSupported() && SIP.WebRTC.getUserMedia({audio: true});

streamPromise.then(function (stream) {
  global.referer = buildUA(uris.referer, stream);
  referer.on('registered', function () {

    global.referee = buildUA(uris.referee, stream);
    referee.on('connected', function () {

      global.referTarget = buildUA(uris.referTarget, stream);
      referTarget.on('connected', function () {

        invite(referee, uris.referer, stream);
        referer.once('invite', function (session) {
          session.accept({media: {stream: stream}}).on('accepted', function () {
            var refereeSession = this;

            invite(referTarget, uris.referer, stream)
            referer.once('invite', function (session) {
              session.accept({media: {stream: stream}}).on('accepted', function () {
                var targetSession = this;
                refereeSession.off('refer');
                refereeSession.refer(targetSession);
              });
            });
          });
        });
      });
    });
  });
});

  function buildUA (uri, stream) {
    var options = {
      //replaces: SIP.C.supported.UNSUPPORTED,
      traceSip: true
    };
    if (uri) {
      options.uri = uri;
      options.authenticationFactory = authFactory(uri, password);
    }
    return new SIP.UA(options);
  }

  function invite(from, to, stream) {
    var session = from.invite(to, {
      media: {
        stream: stream
      }
    });

    session.on('refer', session.followRefer(function (newSession) {
      console.trace('XXX followed refer to', newSession);
    }));
  }

global.stop = function () {
  referer.stop();
  referee.stop();
  referTarget.stop();
}
