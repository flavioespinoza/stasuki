$(function() {
  "use strict";
  function n(n) {
    function i() {
      if (bittrex && bittrex.version && bittrex.version.needsUpdate) {
        f();
        return
      }
      $.ajax({
        cache: !0,
        url: "/Content/version.txt",
        dataType: "json",
        success: function(n) {
          r(n)
        }
      })
    }
    function r(n) {
      $("#event-store").trigger({
        type: "data-query-version",
        serviceData: n
      })
    }
    function u(n) {
      t !== null && clearInterval(t);
      t = setInterval(function() {
        i()
      }, n)
    }
    function f() {
      t !== null && clearInterval(t)
    }
    var t = null;
    i();
    u(n)
  }
  n(6e4)
})