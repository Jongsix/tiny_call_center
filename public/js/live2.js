(function() {
  var Agent, AgentCallController, AgentCallLogController, AgentController, AgentDetailController, AgentStateLogController, AgentStatusLogController, Agents, Call, Queue, QueueController, divmod, formatInterval, initializeIsotope, isotopeRoot, p, queueToClass, searchToQuery, socket, sprintTime, statusOrStateToClass,
    __slice = Array.prototype.slice,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  p = function() {
    var _ref;
    return (_ref = window.console) != null ? typeof _ref.debug === "function" ? _ref.debug.apply(_ref, arguments) : void 0 : void 0;
  };

  socket = null;

  isotopeRoot = null;

  searchToQuery = function(raw) {
    var part, query, _i, _len, _ref;
    if (/^[,\s]*$/.test(raw)) {
      $('#agents').isotope({
        filter: '*'
      });
      return false;
    }
    query = [];
    _ref = raw.split(/\s*,\s*/g);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      part = _ref[_i];
      part = part.replace(/'/, '');
      query.push(":contains('" + part + "')");
    }
    return query.join(", ");
  };

  statusOrStateToClass = function(prefix, str) {
    if (!str) return;
    return prefix + str.toLowerCase().replace(/\W+/g, "-").replace(/^-+|-+$/g, "");
  };

  queueToClass = function(queue) {
    if (!queue) return;
    return queue.toLowerCase().replace(/\W+/g, '_').replace(/^_+|_+$/g, "");
  };

  formatInterval = function(start) {
    var hours, minutes, rest, seconds, total, _ref, _ref2;
    total = parseInt((Date.now() - start) / 1000, 10);
    _ref = divmod(total, 60 * 60), hours = _ref[0], rest = _ref[1];
    _ref2 = divmod(rest, 60), minutes = _ref2[0], seconds = _ref2[1];
    return sprintTime(hours, minutes, seconds);
  };

  sprintTime = function() {
    var arg, num, parts;
    parts = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = arguments.length; _i < _len; _i++) {
        arg = arguments[_i];
        num = parseInt(arg, 10);
        if (num < 10) {
          _results.push('0' + num);
        } else {
          _results.push(num);
        }
      }
      return _results;
    }).apply(this, arguments);
    return parts.join(":");
  };

  divmod = function(num1, num2) {
    return [num1 / num2, num1 % num2];
  };

  initializeIsotope = function(elt) {
    $('#sort-agents a').click(function(event) {
      var sorter;
      sorter = $(event.target).attr('href').replace(/^#/, "");
      p(sorter);
      elt.isotope({
        sortBy: sorter
      });
      return false;
    });
    return elt.isotope({
      itemSelector: '.agent',
      layoutMode: 'fitRows',
      getSortData: {
        username: function(e) {
          return e.find('.username').text();
        },
        extension: function(e) {
          return e.find('.extension').text();
        },
        status: function(e) {
          var extension, order, s;
          s = e.find('.status').text();
          order = (function() {
            switch (s) {
              case 'Available':
                return 0.7;
              case 'Available (On Demand)':
                return 0.8;
              case 'On Break':
                return 0.9;
              case 'Logged Out':
                return 1.0;
            }
          })();
          extension = e.find('.extension').text();
          return parseFloat("" + order + extension);
        },
        idle: function(e) {
          var min, sec, _ref;
          _ref = e.find('.time-since-status-change').text().split(':'), min = _ref[0], sec = _ref[1];
          return ((parseInt(min, 10) * 60) + parseInt(sec, 10)) * -1;
        }
      },
      sortBy: 'status'
    });
  };

  Serenade.Helpers.liStatus = function(klass, name, status) {
    var a;
    a = $('<a href="#"/>').text(name);
    if (status === name) a.addClass('active');
    p(a);
    return a.get(0);
  };

  AgentCallController = (function() {

    function AgentCallController() {}

    AgentCallController.prototype.calltap = function() {
      p.apply(null, ['calltap'].concat(__slice.call(arguments)));
      return p(this);
    };

    return AgentCallController;

  })();

  Serenade.controller('agentCall', AgentCallController);

  AgentStatusLogController = (function() {

    function AgentStatusLogController() {}

    return AgentStatusLogController;

  })();

  Serenade.controller('agentStatusLog', AgentStatusLogController);

  AgentStateLogController = (function() {

    function AgentStateLogController() {}

    return AgentStateLogController;

  })();

  Serenade.controller('agentStateLog', AgentStateLogController);

  AgentCallLogController = (function() {

    function AgentCallLogController() {}

    return AgentCallLogController;

  })();

  Serenade.controller('agentCallLog', AgentCallLogController);

  AgentController = (function() {

    function AgentController() {}

    AgentController.prototype.details = function() {
      var view,
        _this = this;
      if (this.model.agent != null) this.model = this.model.agent;
      view = $(Serenade.render('agentDetail', this.model));
      view.on('shown', function() {
        var stateClass, statusClass;
        statusClass = statusOrStateToClass('status-', _this.model.status);
        stateClass = statusOrStateToClass('state-', _this.model.state);
        return $("button." + statusClass + ", button." + stateClass, view).button('reset').button('toggle');
      });
      view.on('hidden', function() {
        return view.remove();
      });
      view.modal('show');
      $('.nav-tabs a:first', view).tab('show');
      $('a[href="#agentDetailStatusLog"]').on('shown', function() {
        return socket.live('agent_status_log', {
          agent: _this.model.id,
          success: function(logs) {
            return $('#agentDetailStatusLog').html(Serenade.render('agentStatusLog', {
              statuses: new Serenade.Collection(logs)
            }));
          }
        });
      });
      $('a[href="#agentDetailStateLog"]').on('shown', function() {
        return socket.live('agent_state_log', {
          agent: _this.model.id,
          success: function(logs) {
            return $('#agentDetailStateLog').html(Serenade.render('agentStateLog', {
              states: new Serenade.Collection(logs)
            }));
          }
        });
      });
      return $('a[href="#agentDetailCallHistory"]').on('shown', function() {
        return socket.live('agent_call_log', {
          agent: _this.model.id,
          success: function(logs) {
            return $('#agentDetailCallLog').html(Serenade.render('agentCallLog', {
              calls: new Serenade.Collection(logs)
            }));
          }
        });
      });
    };

    return AgentController;

  })();

  Serenade.controller('agent', AgentController);

  AgentDetailController = (function() {

    function AgentDetailController() {}

    AgentDetailController.prototype.statusAvailable = function(event) {
      return this.submitStatus('Available', $(event.target));
    };

    AgentDetailController.prototype.statusAvailableOnDemand = function(event) {
      return this.submitStatus('Available (On Demand)', $(event.target));
    };

    AgentDetailController.prototype.statusOnBreak = function(event) {
      return this.submitStatus('On Break', $(event.target));
    };

    AgentDetailController.prototype.statusLoggedOut = function(event) {
      return this.submitStatus('Logged Out', $(event.target));
    };

    AgentDetailController.prototype.stateWaiting = function(event) {
      return this.submitState('Waiting', $(event.target));
    };

    AgentDetailController.prototype.stateIdle = function(event) {
      return this.submitState('Idle', $(event.target));
    };

    AgentDetailController.prototype.submitStatus = function(name, button) {
      button.button('loading');
      return socket.live('agent_status', {
        agent: this.model.id,
        status: name,
        success: function() {
          return button.button('reset').button('toggle');
        }
      });
    };

    AgentDetailController.prototype.submitState = function(name, button) {
      button.button('loading');
      return socket.live('agent_state', {
        agent: this.model.id,
        state: name,
        success: function() {
          return button.button('reset').button('toggle');
        }
      });
    };

    return AgentDetailController;

  })();

  Serenade.controller('agentDetail', AgentDetailController);

  QueueController = (function() {

    function QueueController() {}

    QueueController.prototype.showQueue = function(event) {
      var queue,
        _this = this;
      queue = $(event.target).text();
      return socket.live('queue_agents', {
        queue: queue,
        success: function(msg) {
          var id, tier, _i, _len;
          for (_i = 0, _len = msg.length; _i < _len; _i++) {
            tier = msg[_i];
            id = tier.agent.split("-")[0];
            new Agent({
              id: id,
              queue: tier.queue,
              state: tier.state
            });
          }
          return isotopeRoot.isotope({
            filter: "." + queueToClass(queue)
          });
        }
      });
    };

    return QueueController;

  })();

  Serenade.controller('queueList', QueueController);

  Call = (function(_super) {

    __extends(Call, _super);

    Call.property('display_cid');

    Call.property('created_epoch');

    Call.belongsTo('agent', {
      as: (function() {
        return Agent;
      })
    });

    Call.property('createdTime', {
      get: (function() {
        return (new Date(this.created)).toLocaleString();
      }),
      dependsOn: ['created']
    });

    Call.property('created', {
      get: (function() {
        return this.created_epoch * 1000;
      }),
      dependsOn: ['created_epoch']
    });

    function Call() {
      if (!Call.__super__.constructor.apply(this, arguments)) {
        this.initialize.apply(this, arguments);
      }
    }

    Call.prototype.initialize = function() {
      var _this = this;
      return this.timer = setInterval((function() {
        return _this.set('duration', formatInterval(_this.created));
      }), 1000);
    };

    return Call;

  })(Serenade.Model);

  Agents = new Serenade.Collection([]);

  Agent = (function(_super) {

    __extends(Agent, _super);

    Agent.property('extension');

    Agent.property('username');

    Agent.property('state');

    Agent.property('status');

    Agent.property('timeSinceStatusChange');

    Agent.property('queue');

    Agent.hasMany('calls', {
      as: (function() {
        return Call;
      })
    });

    Agent.property('statusClass', {
      get: (function() {
        return statusOrStateToClass('status-', this.status);
      }),
      dependsOn: ['status']
    });

    Agent.property('queueClass', {
      get: (function() {
        return queueToClass(this.queue);
      }),
      dependsOn: ['queue']
    });

    function Agent() {
      if (!Agent.__super__.constructor.apply(this, arguments)) {
        this.initialize.apply(this, arguments);
      }
    }

    Agent.prototype.initialize = function() {
      var jtag,
        _this = this;
      if (!this.id) p(this);
      jtag = $(Serenade.render('agent', this));
      jtag.addClass(this.statusClass);
      $('#agents').isotope('insert', jtag);
      this.bind('change:queue', function(value) {
        return jtag.addClass(value);
      });
      return this.bind('change:statusClass', function(value) {
        var klass, _i, _len, _ref;
        _ref = jtag.attr('class').split(' ');
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          klass = _ref[_i];
          if (/^status-/.test(klass)) jtag.removeClass(klass);
        }
        return jtag.addClass(value);
      });
    };

    return Agent;

  })(Serenade.Model);

  Queue = (function(_super) {

    __extends(Queue, _super);

    function Queue() {
      Queue.__super__.constructor.apply(this, arguments);
    }

    Queue.property('name', {
      serialize: true
    });

    return Queue;

  })(Serenade.Model);

  $(function() {
    var server,
      _this = this;
    isotopeRoot = $('#agents');
    initializeIsotope(isotopeRoot);
    $('#show-all-queues').on('click', function() {
      return isotopeRoot.isotope({
        filter: "*"
      });
    });
    $('.navbar-search').on('submit', function(event) {
      return false;
    });
    $('#search').on('input', function(event) {
      var term;
      term = searchToQuery($(event.target).val());
      isotopeRoot.isotope({
        filter: term
      });
      return false;
    });
    $('#search').on('keyup', function(event) {
      if (event.keyCode === 13) return event.preventDefault();
    });
    server = $('#server').text();
    socket = new Rubyists.Socket({
      server: server
    });
    return socket.onopen = function() {
      socket.tag('live', function() {
        return p.apply(null, ['live'].concat(__slice.call(arguments)));
      });
      socket.tag('live:Agent', function(msg) {
        return new Agent(msg.body);
      });
      socket.tag('live:Call:create', function(msg) {
        var call;
        p('live:Call:create', msg);
        call = new Call(msg.body);
        return call.agent.calls.push(call);
      });
      socket.tag('live:Call:update', function(msg) {
        var call;
        p('live:Call:update', msg);
        return call = new Call(msg.body);
      });
      socket.tag('live:Call:delete', function(msg) {
        var agent, call, calls, pendingDeletion, toDelete, toDeleteId, _i, _len, _results;
        p('live:Call:delete', msg);
        toDelete = new Call(msg.body);
        toDeleteId = toDelete.id;
        if (!(agent = toDelete.agent)) return;
        calls = agent.calls;
        pendingDeletion = [];
        calls.forEach(function(call, index) {
          if (toDeleteId === call.id) return pendingDeletion.push(call);
        });
        _results = [];
        for (_i = 0, _len = pendingDeletion.length; _i < _len; _i++) {
          call = pendingDeletion[_i];
          _results.push(calls["delete"](call));
        }
        return _results;
      });
      return socket.live('subscribe', {
        name: $('#agent_name').text(),
        success: function() {
          var _this = this;
          socket.live('queues', {
            success: function(msg) {
              var queues;
              queues = new Serenade.Collection(msg.queues);
              return $('#queues').replaceWith(Serenade.render('queueList', {
                queues: queues
              }));
            }
          });
          return socket.live('agents', {
            success: function(msg) {
              var agentMsg, _i, _len, _ref, _results;
              _ref = msg.agents;
              _results = [];
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                agentMsg = _ref[_i];
                _results.push(new Agent(agentMsg));
              }
              return _results;
            }
          });
        }
      });
    };
  });

}).call(this);
