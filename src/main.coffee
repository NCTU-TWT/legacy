require.config
    paths:
        jquery: 'lib/jquery-1.7.1.min'
        io: 'lib/socket.io.min.amd'
        raphael: 'lib/raphael-min'
        underscore: 'lib/underscore-min.amd'
        backbone: 'lib/backbone-min.amd'
        hogan: 'lib/hogan-1.0.5.min.amd'
        
require [
    # third-party
    'hogan'
    'jquery'   
    'raphael'
    'io'
    'underscore'
    'backbone'
], (hogan) ->
    
    #
    #   socket.io & EE
    #
    
    EE = _.extend {}, Backbone.Events
    socket = io.connect()
    

        


    class Record extends Backbone.Model
        
        value: [0]
    
        defaults:
            name: []
            unit: '' 
            waveform: true
            upperBound: 1
            lowerBound: -1
            upperThreshold: 1
            lowerThreshold: -1
            reference: 0
            
        initialize: ->
            console.log 'new record'
            
            if not @attributes.waveform
                @value = undefined
            
        update: ->
            if @attributes.waveform 
                @value = @value.slice -20       
            
        addValue: (val) ->
        
        
            if @attributes.waveform
                @value.push 
                    time: Date.now()
                    value: val
            else
                @value = Math.round(val * 10 ) / 10
                
        
            
    class Records extends Backbone.Collection
        model: Record
        
    class Hydrometer extends Backbone.View
    
        tagName     : 'section'
        id          : 'hydrometer'
        template    : hogan.compile $('#hydrometer-template').html()
        
        width       : 200
        height      : 200
    
        model: Record
    
        render: ->
                
            $('#hydrometer .caption').text @model.get 'name'            
            #@$el.html @template.render()
            #$('#meter').append @el
                
            # @paper = Raphael 'hydrometer', @width, @height
            
            
        plot: ->
            @model.update()
            $('#hydrometer .content').text "#{ @model.value }%"
         
    class Thermometer extends Backbone.View
    
        tagName     : 'section'
        id          : 'thermometer'
        template    : hogan.compile $('#thermometer-template').html()
        
        width       : 200
        height      : 200
    
        model: Record
    
        render: ->
                
            $('#thermometer .caption').text @model.get 'name'     
            #@$el.html @template.render()
            #$('#meter').append @el
                
            # @paper = Raphael 'hydrometer', @width, @height
            
            
        plot: ->
            @model.update()
            console.log @model
            $('#thermometer .content').text "#{ @model.value }°C"
               
                
    class Wave extends Backbone.View
    
        tagName     : 'section'
        className   : 'wave'
        template    : hogan.compile $('#wave-template').html()
        
        width       : 700
        height      : 150
    
        model: Record
        
        
        render: ->
        
            name = @model.get 'name'
            
            @$el.html @template.render
                name: name
            
            $('#wave').append @el
                
                
            @paper = Raphael "#{ name }", @width, @height
            @path = @paper.path 'M 0 0'
            @path.attr
                stroke: 'rgb(200, 200, 200)'
                'stroke-width': 5
            
            return @el
            
        plot: =>
            @model.update()
            
            # digits
            value = Math.round(@model.value[@model.value.length-1].value * 10) / 10
            $('.value', @$el).text "#{value} #{@model.get 'unit'}"
    
            # wave                    
            points = []
            upperBound = @model.get 'upperBound'
            lowerBound = @model.get 'lowerBound'
            
            for value in @model.value            
            
                
                x = @width + 100 - (Date.now() - value.time)/ 10
                y = @height - (value.value - lowerBound) * @height / (upperBound - lowerBound)   
                
                continue if isNaN(x) or isNaN(y)
                    
                    
                points.push
                    x: x
                    y: y
            
            if points.length > 2
                path = "M#{points[0].x} #{points[0].y} R"  
                
                for point in points
                    path += " #{point.x} #{point.y}"            

                #console.log path
                
                
                @path.attr
                    path: path
        
    
    
    class App extends Backbone.View
    
        chart   : {}
    
        el      : $ '#container' 
    
        initialize: ->
        
        
            socket.on 'data#v0.1', (data) =>
            
                matched = @collection.where { name: data.name }
                
                if matched.length is 0
                
                  
                    if data.waveform is "false"
                        data.waveform = false
                
                    @collection.add data
                    
                    if data.waveform
                        @chart[data.name] = new Wave
                            model: (@collection.where { name: data.name })[0]
                    
                        @chart[data.name].render()
                    else
                        if data.name is "Humidity"                            
                            @chart[data.name] = new Hydrometer
                                model: (@collection.where { name: data.name })[0]
                            @chart[data.name].render()
                        if data.name is "Temperature"                            
                            @chart[data.name] = new Thermometer
                                model: (@collection.where { name: data.name })[0]
                            @chart[data.name].render()
                    
                else
                    matched[0].addValue data.value
                        
            
            setInterval =>
                @plot()
            , 30
        
        plot: ->            
            for name, chart of @chart
                chart.plot()
    $ ->
        app = new App
            collection: new Records
