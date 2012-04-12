(function() {
  var __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  require.config({
    paths: {
      jquery: 'lib/jquery-1.7.1.min',
      io: 'lib/socket.io.min.amd',
      raphael: 'lib/raphael-min',
      underscore: 'lib/underscore-min.amd',
      backbone: 'lib/backbone-min.amd',
      hogan: 'lib/hogan-1.0.5.min.amd'
    }
  });

  require(['hogan', 'jquery', 'raphael', 'io', 'underscore', 'backbone'], function(hogan) {
    var App, EE, Hydrometer, Record, Records, Thermometer, Wave, socket;
    EE = _.extend({}, Backbone.Events);
    socket = io.connect();
    Record = (function(_super) {

      __extends(Record, _super);

      function Record() {
        Record.__super__.constructor.apply(this, arguments);
      }

      Record.prototype.value = [0];

      Record.prototype.defaults = {
        name: [],
        unit: '',
        waveform: true,
        upperBound: 1,
        lowerBound: -1,
        upperThreshold: 1,
        lowerThreshold: -1,
        reference: 0
      };

      Record.prototype.initialize = function() {
        console.log('new record');
        if (!this.attributes.waveform) return this.value = void 0;
      };

      Record.prototype.update = function() {
        if (this.attributes.waveform) return this.value = this.value.slice(-20);
      };

      Record.prototype.addValue = function(val) {
        if (this.attributes.waveform) {
          return this.value.push({
            time: Date.now(),
            value: val
          });
        } else {
          return this.value = Math.round(val * 10) / 10;
        }
      };

      return Record;

    })(Backbone.Model);
    Records = (function(_super) {

      __extends(Records, _super);

      function Records() {
        Records.__super__.constructor.apply(this, arguments);
      }

      Records.prototype.model = Record;

      return Records;

    })(Backbone.Collection);
    Hydrometer = (function(_super) {

      __extends(Hydrometer, _super);

      function Hydrometer() {
        Hydrometer.__super__.constructor.apply(this, arguments);
      }

      Hydrometer.prototype.tagName = 'section';

      Hydrometer.prototype.id = 'hydrometer';

      Hydrometer.prototype.template = hogan.compile($('#hydrometer-template').html());

      Hydrometer.prototype.width = 200;

      Hydrometer.prototype.height = 200;

      Hydrometer.prototype.model = Record;

      Hydrometer.prototype.render = function() {
        return $('#hydrometer .caption').text(this.model.get('name'));
      };

      Hydrometer.prototype.plot = function() {
        this.model.update();
        return $('#hydrometer .content').text("" + this.model.value + "%");
      };

      return Hydrometer;

    })(Backbone.View);
    Thermometer = (function(_super) {

      __extends(Thermometer, _super);

      function Thermometer() {
        Thermometer.__super__.constructor.apply(this, arguments);
      }

      Thermometer.prototype.tagName = 'section';

      Thermometer.prototype.id = 'thermometer';

      Thermometer.prototype.template = hogan.compile($('#thermometer-template').html());

      Thermometer.prototype.width = 200;

      Thermometer.prototype.height = 200;

      Thermometer.prototype.model = Record;

      Thermometer.prototype.render = function() {
        return $('#thermometer .caption').text(this.model.get('name'));
      };

      Thermometer.prototype.plot = function() {
        this.model.update();
        console.log(this.model);
        return $('#thermometer .content').text("" + this.model.value + "°C");
      };

      return Thermometer;

    })(Backbone.View);
    Wave = (function(_super) {

      __extends(Wave, _super);

      function Wave() {
        this.plot = __bind(this.plot, this);
        Wave.__super__.constructor.apply(this, arguments);
      }

      Wave.prototype.tagName = 'section';

      Wave.prototype.className = 'wave';

      Wave.prototype.template = hogan.compile($('#wave-template').html());

      Wave.prototype.width = 700;

      Wave.prototype.height = 150;

      Wave.prototype.model = Record;

      Wave.prototype.render = function() {
        var name;
        name = this.model.get('name');
        this.$el.html(this.template.render({
          name: name
        }));
        $('#wave').append(this.el);
        this.paper = Raphael("" + name, this.width, this.height);
        this.path = this.paper.path('M 0 0');
        this.path.attr({
          stroke: 'rgb(200, 200, 200)',
          'stroke-width': 5
        });
        return this.el;
      };

      Wave.prototype.plot = function() {
        var lowerBound, path, point, points, upperBound, value, x, y, _i, _j, _len, _len2, _ref;
        this.model.update();
        value = Math.round(this.model.value[this.model.value.length - 1].value * 10) / 10;
        $('.value', this.$el).text("" + value + " " + (this.model.get('unit')));
        points = [];
        upperBound = this.model.get('upperBound');
        lowerBound = this.model.get('lowerBound');
        _ref = this.model.value;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          value = _ref[_i];
          x = this.width + 100 - (Date.now() - value.time) / 10;
          y = this.height - (value.value - lowerBound) * this.height / (upperBound - lowerBound);
          if (isNaN(x) || isNaN(y)) continue;
          points.push({
            x: x,
            y: y
          });
        }
        if (points.length > 2) {
          path = "M" + points[0].x + " " + points[0].y + " R";
          for (_j = 0, _len2 = points.length; _j < _len2; _j++) {
            point = points[_j];
            path += " " + point.x + " " + point.y;
          }
          return this.path.attr({
            path: path
          });
        }
      };

      return Wave;

    })(Backbone.View);
    App = (function(_super) {

      __extends(App, _super);

      function App() {
        App.__super__.constructor.apply(this, arguments);
      }

      App.prototype.chart = {};

      App.prototype.el = $('#container');

      App.prototype.initialize = function() {
        var _this = this;
        socket.on('data#v0.1', function(data) {
          var matched;
          matched = _this.collection.where({
            name: data.name
          });
          if (matched.length === 0) {
            if (data.waveform === "false") data.waveform = false;
            _this.collection.add(data);
            if (data.waveform) {
              _this.chart[data.name] = new Wave({
                model: (_this.collection.where({
                  name: data.name
                }))[0]
              });
              return _this.chart[data.name].render();
            } else {
              if (data.name === "Humidity") {
                _this.chart[data.name] = new Hydrometer({
                  model: (_this.collection.where({
                    name: data.name
                  }))[0]
                });
                _this.chart[data.name].render();
              }
              if (data.name === "Temperature") {
                _this.chart[data.name] = new Thermometer({
                  model: (_this.collection.where({
                    name: data.name
                  }))[0]
                });
                return _this.chart[data.name].render();
              }
            }
          } else {
            return matched[0].addValue(data.value);
          }
        });
        return setInterval(function() {
          return _this.plot();
        }, 30);
      };

      App.prototype.plot = function() {
        var chart, name, _ref, _results;
        _ref = this.chart;
        _results = [];
        for (name in _ref) {
          chart = _ref[name];
          _results.push(chart.plot());
        }
        return _results;
      };

      return App;

    })(Backbone.View);
    return $(function() {
      var app;
      return app = new App({
        collection: new Records
      });
    });
  });

}).call(this);
