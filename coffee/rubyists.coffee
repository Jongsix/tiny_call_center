p = -> window.console?.debug?(arguments ...)

class Rubyists
  @formatInterval:  (start) ->
    total = parseInt((Date.now() - start) / 1000, 10)
    [hours, rest] = @divmod(total, 60 * 60)
    [minutes, seconds] = @divmod(rest, 60)
    @sprintTime(hours, minutes, seconds)

  @sprintTime:  ->
    parts = for arg in arguments
      num = parseInt(arg, 10)
      if num < 10 then '0' + num else num
    parts.join(":")

  @divmod: (num1, num2) ->
    [num1 / num2, num1 % num2]

window.Rubyists = Rubyists

class Socket
  constructor: (@options) ->
    @webSocket = if "MozWebSocket" of window then MozWebSocket else WebSocket
    @connected = false
    @tags = {}
    @frames = {}
    @callbacks = {}
    @connect()

  connect: () ->
    @reconnector = setInterval((=> @reconnect()), 1000)

  reconnect: () ->
    return if @connected

    p "Opening WebSocket to #{@options.server}"
    @socket = new @webSocket(@options.server)

    @socket.onmessage = (messageEvent) =>
      # p 'message', messageEvent.data
      @onmessage(arguments ...)

    @socket.onerror = =>
      p 'error', arguments ...
      @onerror(arguments ...)

    @socket.onopen = =>
      p "Opened WebSocket to #{@options.server}"
      @connected = true
      @onopen()

    @socket.onclose = =>
      p "Closed WebSocket to #{@options.server}"
      @connected = false
      @onclose()

  onopen: ->

  onmessage: (messageEvent) ->
    parsed = JSON.parse(messageEvent.data)
    handler = @tags[parsed.tag]
    handler?(parsed)

  onclose: ->

  onerror: (error) ->

  tag: (name, callback) ->
    @frames[name] = 0
    @callbacks[name] = {all: callback}

    @[name] = (go, args) =>
      frame = (@frames[name] += 1)
      @callbacks[name][frame] = {success: args?.success, error: args?.error}
      msg = {tag: name, frame: frame, go: go, body: {}}
      for key, value of args
        msg.body[key] = value unless key == 'success' || key == 'error'
      delete msg.body if Object.keys(msg.body).length < 1
      @send(JSON.stringify(msg))

    @listen name, (msg) =>
      if cb = @callbacks[name][msg.frame]
        if msg.error?
          return cb.error?(msg.error)
        else if msg.body?
          return cb.success?(msg.body)
      @callbacks[name].all?(msg)

  listen: (tag, callback) ->
    @tags[tag] = callback

  send: ->
    @socket.send(arguments ...)
    null

window.Rubyists.Socket = Socket

class BackboneWebSocket
  constructor: (@options) ->
    @frame = 0
    @callbacks = {}
    @socket = new Socket(server: @options.server)
    @socket.listen 'backbone', =>
      @backboneRecv(arguments ...)
    @socket.onopen = => @options.onopen?(arguments ...)

  listen: (tag, callback) ->
    @socket.listen tag, callback

  send: ->
    @socket.send(arguments ...)
    null

  say: (msg) ->
    @socket.send(JSON.stringify(msg))

  backboneRecv: (msg) ->
    p 'backboneRecv', arguments ...
    if callback = @callbacks[msg.frame]
      delete @callbacks[msg.frame]
      if body = msg.ok
        callback(body, true)
      else if error = msg.error
        callback(error, false)

  backboneSend: (msg, callback) ->
    @frame += 1
    packet = {tag: 'backbone', frame: @frame, body: msg}
    @callbacks[@frame] = callback if callback?
    json = JSON.stringify(packet)
    p 'send', json
    @socket.send(json)

  backboneRequest: (given) ->
    @backboneSend given.data, (response, status) ->
      if status == true
        given.success?(response)
      else
        given.error?(response)

  backboneSync: (method, model, options, changedAttributes) ->
    @["backboneSync#{model.url}"](method, model, options, changedAttributes)

  sync: ->
    => @backboneSync(arguments ...)

  backboneSyncAgent: (method, model, options, changedAttributes) ->
    data = {method: method, url: model.url, id: model.id}

    if method == 'update'
      data.attributes = changedAttributes
    else
      data.attributes = model

    if data.attributes == false
      switch method
        when 'update'
          options.success?(model.attributes)
        when 'delete'
          options.success?(id: model.id)
        when 'create'
          options.success?(id: model.id)
        when 'read'
          options.success?(model.attributes)
    else
      @backboneRequest(
        data: data,
        success: options.success,
        error: options.error
      )

  # we never, ever, need syncing for this, all updates are pushed from the
  # server, so we gotta fake successful sync
  backboneSyncCall: (method, model, options, changedAttributes) ->
    p 'Call', method, model.id, model.attributes
    switch method
      when 'update'
        options.success?(model.attributes)
      when 'delete'
        options.success?(id: model.id)
      when 'create'
        options.success?(id: model.id)
      when 'read'
        options.success?(model.attributes)

window.Rubyists.BackboneWebSocket = BackboneWebSocket
