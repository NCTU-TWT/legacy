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
    var App, EE, Hydrometer, Meter, Phone, Record, Records, Thermometer, Wave, socket;
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
        if (!this.attributes.waveform) return this.value = void 0;
      };

      Record.prototype.update = function() {
        if (this.attributes.waveform) return this.value = this.value.slice(-40);
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
    Meter = (function(_super) {

      __extends(Meter, _super);

      function Meter() {
        Meter.__super__.constructor.apply(this, arguments);
      }

      Meter.prototype.width = 200;

      Meter.prototype.height = 200;

      Meter.prototype.model = Record;

      Meter.prototype.initialize = function() {
        return this.id = this.model.get('name');
      };

      Meter.prototype.render = function() {};

      Meter.prototype.plot = function() {
        var name, unit, value;
        this.model.update();
        name = this.model.get('name');
        if (name === 'Temperature') {
          value = Math.round(this.model.value) / 100;
          unit = '°C';
        } else {
          value = this.model.value;
          unit = '%';
        }
        return $('.content', this.$el).text("" + value + unit);
      };

      return Meter;

    })(Backbone.View);
    Thermometer = (function(_super) {

      __extends(Thermometer, _super);

      function Thermometer() {
        Thermometer.__super__.constructor.apply(this, arguments);
      }

      Thermometer.prototype.initialize = function() {
        return console.log('hot');
      };

      Thermometer.prototype.render = function() {
        this.paper = Raphael("thermometer", 150, 320);
        this.circle = this.paper.circle(120, 280, 15);
        this.circle.attr({
          fill: 'rgb(180, 60, 60)',
          'stroke-width': 0
        });
        this.bar = this.paper.path('M 0 0');
        return this.bar.attr({
          stroke: 'rgb(180, 60, 60)',
          'stroke-width': 10,
          'stroke-linecap': 'round'
        });
      };

      Thermometer.prototype.plot = function() {
        var value;
        this.model.update();
        value = Math.round(this.model.value / 10) / 10;
        if (!isNaN(value)) {
          this.bar.attr({
            path: "M 120 280 L 120 " + (270 - value * 8)
          });
          return $('#thermometer-value').text("" + value + "°C");
        }
      };

      return Thermometer;

    })(Backbone.View);
    Hydrometer = (function(_super) {

      __extends(Hydrometer, _super);

      function Hydrometer() {
        Hydrometer.__super__.constructor.apply(this, arguments);
      }

      Hydrometer.prototype.render = function() {};

      Hydrometer.prototype.plot = function() {
        var value;
        this.model.update();
        value = Math.round(this.model.value * 10) / 10;
        if (!isNaN(value)) return $('#hydrometer-value').text("" + value + "%");
      };

      return Hydrometer;

    })(Backbone.View);
    Wave = (function(_super) {

      __extends(Wave, _super);

      function Wave() {
        this.plot = __bind(this.plot, this);
        Wave.__super__.constructor.apply(this, arguments);
      }

      Wave.prototype.width = 830;

      Wave.prototype.height = 150;

      Wave.prototype.model = Record;

      Wave.prototype.render = function() {
        var lowerThreshold, name, upperThreshold;
        name = this.model.get('name');
        this.paper = Raphael("" + name, this.width, this.height);
        this.path = this.paper.path('M 0 0');
        this.path.attr({
          stroke: 'rgb(200, 200, 200)',
          'stroke-width': 5
        });
        lowerThreshold = this.height * (1 - this.model.get('lowerThreshold') / (this.model.get('upperBound') - this.model.get('lowerBound')));
        upperThreshold = this.height * (1 - this.model.get('upperThreshold') / (this.model.get('upperBound') - this.model.get('lowerBound')));
        this.lowerThreshold = this.paper.path("M 0 " + lowerThreshold + "L" + this.width + " " + lowerThreshold);
        this.lowerThreshold.attr({
          stroke: 'rgba(80, 30, 30, 0.5)',
          'stroke-width': 2
        });
        this.upperThreshold = this.paper.path("M 0 " + upperThreshold + "L" + this.width + " " + upperThreshold);
        this.upperThreshold.attr({
          stroke: 'rgba(80, 30, 30, 0.5)',
          'stroke-width': 2
        });
        return this.el;
      };

      Wave.prototype.plot = function() {
        var lowerBound, name, path, point, points, upperBound, value, x, y, _i, _j, _len, _len2, _ref;
        this.model.update();
        name = this.model.get('name');
        value = Math.round(this.model.value[this.model.value.length - 1].value * 10) / 10;
<<<<<<< HEAD
        $('.value', this.$el).text("" + value);
=======
        $('#' + name).parent().children().children('.value').text("" + value + " " + (this.model.get('unit')));
>>>>>>> dev
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
    Phone = (function(_super) {

      __extends(Phone, _super);

      function Phone() {
        Phone.__super__.constructor.apply(this, arguments);
      }

      Phone.prototype.initialize = function() {
        var _this = this;
        socket.on('phone', function(phoneNumber) {
          _this.phoneNumber = phoneNumber;
          $('#edit input').val(phoneNumber);
          return _this.render();
        });
        $('#edit-button').click(function() {
          $('#number').hide();
          $('#edit').show();
          return $('#edit input').focus().select();
        });
        $('#edit form').submit(function() {
          _this.phoneNumber = $('#edit input').val();
          console.log(_this.phoneNumber);
          $('#edit').hide();
          $('#number span').text(_this.phoneNumber);
          $('#number').show();
          socket.emit('phone', _this.phoneNumber);
          return false;
        });
        return $('#sms-button').click(function() {
          return socket.emit('sms-test');
        });
      };

      Phone.prototype.render = function() {
        return $('#number span').text(this.phoneNumber);
      };

      return Phone;

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
        socket.on('boo', function() {
          return console.log('boo');
        });
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
              _this.chart[data.name].render();
            }
            if (data.name === 'Temperature') {
              _this.chart[data.name] = new Thermometer({
                model: (_this.collection.where({
                  name: data.name
                }))[0]
              });
              _this.chart[data.name].render();
            }
            if (data.name === 'Humidity') {
              _this.chart[data.name] = new Hydrometer({
                model: (_this.collection.where({
                  name: data.name
                }))[0]
              });
              return _this.chart[data.name].render();
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
      var app, phone;
      app = new App({
        collection: new Records
      });
      return phone = new Phone;
    });
  });

}).call(this);
