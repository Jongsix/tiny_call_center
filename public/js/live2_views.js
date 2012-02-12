(function() {

  Serenade.view('queueList', "ul#queues.dropdown-menu\n  - collection @queues\n      li\n        a[href=\"#\" event:click=showQueue!] @name");

  Serenade.view('agent', "div.agent.span2[event:change:status=change! event:dblclick=details!]\n  span.extension @extension\n  span.username @username\n  span.state @state\n  span.status @status\n  span.time-since-status-change @timeSinceStatusChange\n  span.queue @queue\n  span[class=@queue]\n  span.calls\n    - collection @calls\n      .name-and-number @display_cid\n      .duration @duration\n  span.more-calls @moreCalls");

  Serenade.view('agentCall', "tr\n  td @display_cid\n  td @createdTime\n  td @queue\n  td\n    a[event:click=calltap!]\n      i.icon-headphones");

  Serenade.view('agentDetail', ".modal\n  .modal-header\n    a.close[data-dismiss=\"modal\"] \"x\"\n    h3 @username \" - \" @id\n  .modal-body\n    ul.nav.nav-tabs\n      li\n        a[data-toggle=\"tab\" href=\"#agentDetailCalls\"] \"Calls\"\n      li\n        a[data-toggle=\"tab\" href=\"#agentDetailOverview\"] \"Overview\"\n      li\n        a[data-toggle=\"tab\" href=\"#agentDetailStatusLog\"] \"Status Log\"\n      li\n        a[data-toggle=\"tab\" href=\"#agentDetailStateLog\"] \"State Log\"\n      li\n        a[data-toggle=\"tab\" href=\"#agentDetailCallHistory\"] \"Call History\"\n    .tab-content\n      #agentDetailCalls.tab-pane\n        table\n          thead\n            tr\n              th \"CID\"\n              th \"Time\"\n              th \"Queue\"\n              th \"&nbsp;\"\n          tbody\n            - collection @calls\n              - view \"agentCall\"\n      #agentDetailOverview.tab-pane\n        h2 \"Status\"\n        .btn-group[data-toggle=\"buttons-radio\"]\n          button.btn.status-available[event:click=statusAvailable] \"Available\"\n          button.btn.status-available-on-demand[event:click=statusAvailableOnDemand] \"Available (On Demand)\"\n          button.btn.status-on-break[event:click=statusOnBreak] \"On Break\"\n          button.btn.status-logged-out[event:click=statusLoggedOut] \"Logged Out\"\n\n        h2 \"State\"\n        .btn-group[data-toggle=\"buttons-radio\"]\n          button.btn.state-waiting[event:click=stateWaiting] \"Ready\"\n          button.btn.state-idle[event:click=stateIdle] \"Wrap Up\"\n      #agentDetailStatusLog.tab-pane\n        \"Loading Status Log...\"\n      #agentDetailStateLog.tab-pane\n        \"Loading State Log...\"\n      #agentDetailCallHistory.tab-pane\n        \"Loading Call History...\"");

  Serenade.view('agentStatusLog', "table\n  thead\n    tr\n      th \"Status\"\n      th \"Time\"\n  tbody\n    - collection @statuses\n    tr\n      td @new_status\n      td @created_at");

  Serenade.view('agentStateLog', "table\n  thead\n    tr\n      th \"State\"\n      th \"Time\"\n  tbody\n    - collection @states\n    tr\n      td @new_state\n      td @created_at");

  Serenade.view('agentCallLog', "table\n  thead\n    th \"Time\"\n    th \"CID #\"\n    th \"CID Name\"\n    th \"To\"\n    th \"Context\"\n    th \"Dur\"\n    th \"Bill\"\n  tbody\n    - collection @calls\n      tr\n        td @time\n        td @cid_number\n        td @cid_name\n        td @to\n        td @context\n        td @duration\n        td @bill_sec");

}).call(this);
