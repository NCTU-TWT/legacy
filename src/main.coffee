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
            
            if not @attributes.waveform
                @value = undefined
            
        update: ->
            if @attributes.waveform 
                @value = @value.slice -40       
            
        addValue: (val) ->
        
        
            if @attributes.waveform
                @value.push 
                    time: Date.now()
                    value: val
            else
                @value = Math.round(val * 10 ) / 10
                
        
            
    class Records extends Backbone.Collection
        model: Record
        
    class Meter extends Backbone.View
    
        
        width       : 200
        height      : 200
    
        model: Record
    
        initialize: ->
            @id = @model.get 'name'
    
    
        render: ->
                
                
                
            
        plot: ->
            @model.update()
            
            name = @model.get 'name'
            
            
            if name is 'Temperature'
                value = Math.round(@model.value) / 100
                unit = '°C'
            else
                value = @model.value
                unit = '%'
            
            
            
            $('.content', @$el).text "#{ value }#{ unit }"
            
            
            
            
            
            
            
            
            
            
            
    class Thermometer extends Backbone.View
    
        initialize: ->
            console.log 'hot'
    
        render: ->
        
        
            @paper = Raphael "thermometer", 150, 320
            
            @circle = @paper.circle 120, 280, 15
            @circle.attr
                fill            : 'rgb(180, 60, 60)'
                'stroke-width'  : 0
                
            @bar = @paper.path 'M 0 0'
            @bar.attr
                stroke: 'rgb(180, 60, 60)'
                'stroke-width': 10
                'stroke-linecap': 'round'
    
        plot: ->
            @model.update()
            
            
    
            value = Math.round( (@model.value/10) ) / 10
            
            if not isNaN(value)
                @bar.attr
                    path: "M 120 280 L 120 #{ 270 - value*8 }"
                    
                    
                # digits
                $('#thermometer-value').text "#{ value }°C" 
        
    class Hydrometer extends Backbone.View
        render: ->
    
        plot: ->
            @model.update()
    
            value = Math.round( @model.value * 10 ) / 10
            
            if not isNaN(value)
                # digits
                $('#hydrometer-value').text "#{ value }%" 
        
        
        
    
                
    class Wave extends Backbone.View
            
        width       : 830
        height      : 150
    
        model: Record
        
        
        render: ->
        
            name = @model.get 'name'
            
                
            @paper = Raphael "#{ name }", @width, @height
            @path = @paper.path 'M 0 0'
            @path.attr
                stroke: 'rgb(200, 200, 200)'
                'stroke-width': 5
            
            lowerThreshold = @height * ( 1 - @model.get('lowerThreshold') / (@model.get('upperBound') - @model.get('lowerBound')))
            
            upperThreshold = @height * ( 1 - @model.get('upperThreshold') / (@model.get('upperBound') - @model.get('lowerBound')))
            
            @lowerThreshold = @paper.path "M 0 #{ lowerThreshold }L#{ @width } #{ lowerThreshold }"
            @lowerThreshold.attr
                stroke: 'rgba(80, 30, 30, 0.5)'
                'stroke-width': 2
                
            @upperThreshold = @paper.path "M 0 #{ upperThreshold }L#{ @width } #{ upperThreshold }"
            @upperThreshold.attr
                stroke: 'rgba(80, 30, 30, 0.5)'
                'stroke-width': 2
            
            
            return @el
            
        plot: =>
            @model.update()
            
            # digits
            name = @model.get 'name'
            value = Math.round(@model.value[@model.value.length-1].value * 10) / 10
            $('#' + name).parent().children().children('.value').text "#{value} #{@model.get 'unit'}"
    
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
        
    
    class Phone extends Backbone.View
    
        
        initialize: ->
        
            socket.on 'phone', (phoneNumber) =>
                
            
                @phoneNumber = phoneNumber
                $('#edit input').val phoneNumber
                
                
                @render()
                
            $('#edit-button').click ->
                $('#number').hide()
                $('#edit').show()
                $('#edit input').focus().select()
            
            $('#edit form').submit =>
                
                @phoneNumber = $('#edit input').val()
            
                console.log @phoneNumber
            
                $('#edit').hide()
                $('#number span').text @phoneNumber
                $('#number').show()
                
                socket.emit('phone', @phoneNumber);
                
                return false
                
            $('#sms-button').click ->
                socket.emit('sms-test');
                
        render: ->
            $('#number span').text @phoneNumber
                
                
    
    class App extends Backbone.View
    
        chart   : {}
    
        el      : $ '#container' 
    
        initialize: ->
    
            
            socket.on 'boo', ->
                console.log 'boo'
                                
            
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
                        
                        
                    if data.name is 'Temperature'
                        @chart[data.name] = new Thermometer
                            model: (@collection.where { name: data.name })[0]
                        @chart[data.name].render()
                        
                    if data.name is 'Humidity'
                        @chart[data.name] = new Hydrometer
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
            
        phone = new Phone
            
