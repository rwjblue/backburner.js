import Backburner from "backburner";

module("safari bug");

test("Prevent Safari double finally in run", function() {
  expect(1);

  var bb = new Backburner(['one']),
      count = 0,
      realEnd = Backburner.prototype.end;

  Backburner.prototype.end = function() {
    count++;
    equal(count, 1, 'end is called only once');
    realEnd.call(this);
  };

  try {
    bb.run(function() {
      bb.defer('one', function() {
        // If we throw from here, it'll be a throw from
        // the `finally` in `.run()`, thus invoking Safari's
        // bizarre double-finally bug. Without the proper guards,
        // this causes .end() to be run twice in Safari 6.0.2.
        throw 'from defer';
      });
    });
  }
  catch(e) { }

  Backburner.prototype.end = realEnd;
});

test("Prevent Safari double finally in end", function() {
  expect(1);

  var count = 0;

  var bb = new Backburner(['one'], {
        onEnd: function() {
          count++;
          equal(count, 1, 'onEnd is called only once');
          throw 'from onEnd';
        }
      });

  try {
    bb.run(function() {
      // No-op
    });
  }
  catch(e) { }
});
