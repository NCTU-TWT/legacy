(function() {
  var __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  define(['jquery', 'underscore', 'backbone', 'hogan'], function() {
    var Collection, CollectionView, Model, View, hogan;
    hogan = require('hogan');
    Model = (function(_super) {

      __extends(Model, _super);

      function Model() {
        Model.__super__.constructor.apply(this, arguments);
      }

      Model.prototype.defaults = {
        name: 'Anonymous',
        selected: false,
        watching: false
      };

      return Model;

    })(Backbone.Model);
    Collection = (function(_super) {

      __extends(Collection, _super);

      function Collection() {
        Collection.__super__.constructor.apply(this, arguments);
      }

      Collection.prototype.model = Model;

      Collection.prototype.initialize = function() {};

      return Collection;

    })(Backbone.Collection);
    View = (function(_super) {

      __extends(View, _super);

      function View() {
        View.__super__.constructor.apply(this, arguments);
      }

      View.prototype.template = hogan.compile($('#project-template').html());

      View.prototype.tagName = 'li';

      View.prototype.className = 'project';

      View.prototype.events = {
        'click': 'select',
        'click .watch': 'watch',
        'click .open': 'open',
        'click .build': 'build'
      };

      View.prototype.initialize = function(param) {
        var _this = this;
        this.root = param.root;
        this.model.on('change:selected', function(model, selected) {
          if (selected) {
            _this.$el.addClass('selected');
            console.log('render');
            return _this.root.parent.view.config.$el.append(_this.root.parent.view.config.view.watch.render());
          } else {
            _this.$el.removeClass('selected');
            console.log('remove');
            return _this.root.parent.view.config.view.watch.remove();
          }
        });
        return this.model.on('change:watching', function(model, watching) {
          if (watching) {
            return _this.$el.addClass('watching');
          } else {
            return _this.$el.removeClass('watching');
          }
        });
      };

      View.prototype.render = function() {
        this.$el.html(this.template.render({
          name: this.model.get('name')
        }));
        this.delegateEvents();
        return this.el;
      };

      View.prototype.select = function() {
        this.model.set('selected', true);
        return false;
      };

      View.prototype.watch = function() {
        var watching;
        watching = this.model.get('watching');
        this.model.set('watching', !watching);
        return false;
      };

      View.prototype.open = function() {
        return false;
      };

      View.prototype.build = function() {
        return false;
      };

      return View;

    })(Backbone.View);
    CollectionView = (function(_super) {

      __extends(CollectionView, _super);

      function CollectionView() {
        CollectionView.__super__.constructor.apply(this, arguments);
      }

      CollectionView.prototype.view = [];

      CollectionView.prototype.el = $('#projects');

      CollectionView.prototype.initialize = function(param) {
        var _this = this;
        this.parent = param.parent;
        this.collection.on('add', function(model) {
          var view;
          view = new View({
            root: _this,
            model: model
          });
          _this.$el.append(view.render());
          return _this.view.push(view);
        });
        return this.collection.on('change:selected', function(model, selected) {
          var selectedCID, selectedModels, _i, _len, _results;
          if (selected) {
            _this.parent.view.config.render();
            selectedCID = model.cid;
            selectedModels = _this.collection.where({
              selected: true
            });
            _results = [];
            for (_i = 0, _len = selectedModels.length; _i < _len; _i++) {
              model = selectedModels[_i];
              if (model.cid !== selectedCID) {
                _results.push(model.set('selected', false));
              } else {
                _results.push(void 0);
              }
            }
            return _results;
          }
        });
      };

      return CollectionView;

    })(Backbone.View);
    return {
      Model: Model,
      Collection: Collection,
      View: View,
      CollectionView: CollectionView
    };
  });

}).call(this);
