(function() {
  var __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  define(['jquery', 'underscore', 'backbone', 'hogan'], function() {
    var View, hogan;
    hogan = require('hogan');
    View = (function(_super) {

      __extends(View, _super);

      function View() {
        View.__super__.constructor.apply(this, arguments);
      }

      View.prototype.template = hogan.compile($('#watch-template').html());

      View.prototype.tagName = 'section';

      View.prototype.id = 'watch';

      View.prototype.render = function() {
        this.$el.html(this.template.render());
        console.log(this.el);
        return this.el;
      };

      return View;

    })(Backbone.View);
    return {
      View: View
    };
  });

}).call(this);
