//PLUGIN FuR GRAPH
const FARBEN = ["blue", "red", "yellow", "purple", "green", "orange", "pink", "brown", "white"]
const MOUSE_OVER = true;
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const DOMAIN_PATH = "https://www.heptagon.network/";

var FONT_SIZE_ZOOM_FACTOR = 1.1; //depends on UI Max Zoom (*1 equals)
var FONT_SIZE_LEVEL_FACTOR = 1;
var FONT_SIZE_LEVEL_EXP_FACTOR = 2.2 - 0.4;
var RADIUS_LEVEL_FACTOR = 2.6;
var RADIUS_VALUE = 30;

class Line {
    constructor (point_a, point_b, strength, visual) {
        this.point_a = point_a;
        this.point_b = point_b;
        this.point_a.callbacks.push (this.callback.bind(this));
        this.point_b.callbacks.push (this.callback.bind(this));
        this.strength = strength;
        this.color = "white";
        this.visual = visual;
        this.svg = visual.svg;
        this.create_html ();
    }

    get x1 () {
        return this.point_a.x;
    }
    get y1 () {
        return this.point_a.y;
    }
    get x2 () {
        return this.point_b.x;
    }
    get y2 () {
        return this.point_b.y;
    }

    callback () {
        this.update_html ();
        console.log ("callback");
    }
    
    create_html () {
        this.html = document.createElementNS(SVG_NAMESPACE, 'line');
        this.html.setAttribute("x1",this.x1+"%");
        this.html.setAttribute("y1",this.y1+"%");
        this.html.setAttribute("x2",this.x2+"%");
        this.html.setAttribute("y2",this.y2+"%");
        this.html.style.stroke = this.color;
        this.html.style.strokeOpacity = 0.1 + Math.random ()*0.4;
        this.html.style.strokeWidth = this.strength*2;
        this.svg.appendChild(this.html);
    }

    update_html () {
        this.html.setAttribute("x1",this.x1+"%");
        this.html.setAttribute("y1",this.y1+"%");
        this.html.setAttribute("x2",this.x2+"%");
        this.html.setAttribute("y2",this.y2+"%"); 

        if (this.point_a.visibility && this.point_b.visibility) {
            this.show ();
        }else {
            this.hide ();
        }
    }

    show () {
        this.html.style.visibility = 'visible';
    }

    hide () {
        this.html.style.visibility = 'hidden';

    }

}

class Point {
    constructor (x, y, node, visual, color, shadow_color) {
        this._x = x;
        this._y = y;
        this.node = node;
        this.visual = visual;
        this.container=visual.container;
        this.html;
        
        this.is_control = false;
        this.is_toggle = false;

        this._color = color ? color : "white";
        this._backgroundColor = "black";
        this._boxShadowColor = shadow_color ? shadow_color : [255, 255, 255];
        this._fontSize;

        this._opacity = 1;
        this._boxShadowOpacity;
        this.defaultBoxShadowOpacity = 1;

        this.is_playing = false;
        this.mouse_over_aktiv = true;

        this.audio_node;
        this.audio_buffer;
        this.audio;

        this.start_time; this.end_time; this.playing_duration;
        this._visibility = true;
        this._url = "";
        this.update_content ();
        this.create_html ();
        this.create_observer ();
        this.callbacks = [];
    }

    get boxShadowColor () {
        return this._boxShadowColor;
    }

    set boxShadowColor (val) {
        this._boxShadowColor = val;
        this.update_html_boxshadow(val);
    }   

    get boxShadowOpacity () {
        return this._boxShadowOpacity;
    }

    set boxShadowOpacity (val) {
        this._boxShadowOpacity = val;
        this.update_html_boxshadow(val);
    }


    get opacity () {
        return this._opacity;
    }

    set opacity (val) {
        this._opacity = val;
        this.html.style.opacity = val;
    }

    get color () {
        return this._color;
    }

    set color (val) {
        this._color = val;
        this.html.style.color = val;
        this.html.style.borderColor = val;
    }

    get backgroundColor () {
        return this._backgroundColor;
    }

    set backgroundColor (val) {
        this._backgroundColor = val;
        this.html.style.background = val;
    }

    set fontSize (val) {
        this._fontSize = val;
        this.html.style.fontSize = val + "%";
    }

    get fontSize () {
        return this._fontSize;
    }

    get visibility () {
        return this._visibility;
    }

    set visibility (val) {
        if (val == true) {
            this.show ();
        }else {
            this.hide ();
        }
    } 

    get id () {
        return this.node.id;
    }

    get url () {
        return this._url;
    }

    set url (val) {
        this._url = val;
        this.update_content ();
        this.set_html_text ();
    }

    get is_link () {
        if (this.url != "") {
            return true;
        }else {
            return false;
        }
    }
    
    set x (value) {
        this.change_position (value, this._y);
    }

    set y (value) {
        this.change_position (this._x, value);
    }

    get x () {
        return this._x;
    }
    get y () {
        return this._y;
    }

    get file_extension () {
        return this.url.substr (this.url.lastIndexOf ("."));
    }

    get typ () {
        var ext = this.file_extension;
        if (ext == ".mp3" || ext == ".wav") {
            return "audio";
        }else if (ext == ".jpg" || ext == ".gif" || ext==".png" || ext==".jpeg") {
            return "image";
        }else if (ext == ".mp4") {
            return "video";
        }else if (ext == ".txt") {
            return "text";
        }else if (ext == ".html") {
            return "html"
        }
        else {
            return "node"
        }
    }

    get absolute_position () {
        var pos = $(this.html).offset();
        return pos;
    }

    get relative_level () {
        return this.node.level - this.visual.start_level;
    }

    get relative_path () {
        var path = this.url.substring (DOMAIN_PATH.length - 1);
        return path;
    }

    change_position (newX, newY) {
        this._x = newX; this._y = newY;
        this.update_html_position ();
    }

    update_html_position () {
        this.html.style.top = this._y+"%"; 
        this.html.style.left = this._x+"%";
    }

    create_html () {
        this.create_html_element();
        this.update_html_position ();
        this.set_html_text();
        this.set_html_style ();
        this.create_event_listeners();
        this.container.appendChild (this.html);
    };

    create_html_element() {
        var h = this.node.level + 1;
        this.html = document.createElement("h" + h);
        this.html.setAttribute("id", this.node.id);
    }

    set_html_style () {
        this.init_html_font();
        this.init_html_colors();
        this.set_html_opacities();
        this.set_html_box(this.fontSize, this.node.level);
    }

    init_html_font() {
        this.fontSize = 111 / (Math.pow(FONT_SIZE_LEVEL_EXP_FACTOR, this.relative_level) * FONT_SIZE_LEVEL_FACTOR);
        this.html.style.fontWeight = "normal";
    }

    init_html_colors() {
        this.color = this._color;
        this.backgroundColor = this._backgroundColor;
        this.boxShadowColor = this._boxShadowColor;
    }

    set_html_opacities() {
        this.opacity = 1 - (this.relative_level - 1) * 0.6 + Math.random() * 0.3;
        this.defaultBoxShadowOpacity = 0.2 - 0.01 * this.relative_level;
        this.boxShadowOpacity = this.defaultBoxShadowOpacity;
    }

    set_html_box(fontSize, level) {
        var margin = 0;
        var padding = fontSize/900;
        this.html.style.cursor = "pointer";
        this.html.style.zIndex = -level;
        this.html.style.padding = padding + "%";
        this.html.style.margin = margin + "%";
        this.html.style.position = "absolute";
        this.html.style.transform = "translate(-50%, -50%)";
        this.html.style.webkitTransform = "translate(-50%, -50%)";
        this.html.style.border = "solid 1px";
    }

    set_html_text() {
        if (this.is_link) {
            this.html.innerHTML = "<u>" + this.node.name + "</u>";
            this.html.style.cursor = "pointer";
        } else {
            this.html.innerHTML = this.node.name;
        }
    }

    update_html_boxshadow() {
        var r = this.boxShadowColor[0] * this.boxShadowOpacity;
        var g = this.boxShadowColor[1] * this.boxShadowOpacity;
        var b = this.boxShadowColor[2] * this.boxShadowOpacity;
        this.html.style.boxShadow = "rgb(" + r + ", " + g + ", " + b + ") 0px 0px 50px 5px";
    }

    create_event_listeners() {
        this.html.addEventListener('mouseover', this.mouse_over.bind(this));
        this.html.addEventListener('mouseleave', this.mouse_leave.bind(this));
        this.html.addEventListener('click', this.click.bind(this));
    }

    click () {
        if (this.typ == "video" || this.typ == "image" || this.typ == "text" || this.typ == "html") {
            this.open_content_page();
        }else if (this.typ == "audio" || this.is_control == true) {
            this.toggle_play();
        }else {
            this.open_as_start_node();
        }
    }

    open_as_start_node() {
        this.visual.create_from_graph(this.visual.graph, this.node);
        window.history.pushState(null, null, "?sub=" + this.id);
    }

    toggle_play() {
        this.mouse_over_aktiv == false;
        if (this.is_playing == true) {
            this.stop();
        } else {
            this.play();
        }
    }

    open_content_page() {
        var frame_parameter = this.id + this.file_extension;
        window.open("https://www.heptagon.network/Graph/c?=" + frame_parameter, "_self");
    }

    mouse_leave () {
        this.mouse_over_aktiv = true;
        if (this.is_toggle == false) {
            this.stop ();
        }
    }    
    
    mouse_over () {
        if (this.mouse_over_aktiv==true && MOUSE_OVER) {
            this.play ();
        }
    }

    update_content () {
        if (this.typ == "audio") {
            this.load_audio_buffer ()
            //this.audio_source = this.visual.audio_context.createMediaElementSource (audio);
            //this.audio_source.connect (this.visual.audio_context.destination)
            this.is_toggle = true;
            this.backgroundColor = "rgb(71, 31, 31)";
        }else if (this.node.name == RECORD_COMMAND || this.node.name == PAUSE_COMMAND) {
            this.is_toggle = true;
            this.is_control = true;
        }else if (this.node.name == PAUSE_COMMAND || this.node.name == RESET_COMMAND) {
            this.is_control = true;
        }
    }

    load_audio_buffer () {
        var audioCtx = this.visual.audioContext;
        var request = new XMLHttpRequest();
        console.log ("path: " + this.relative_path);
        request.open('GET', this.relative_path, true);
        request.responseType = 'arraybuffer';
        request.onload = function() {
            var audioData = request.response;  
            audioCtx.decodeAudioData(audioData, function(buffer) {
                this.audio_buffer = buffer;
                console.log ("buffer loaded");
            }.bind (this),        
            function(e){ console.log("Error with decoding audio data" + e.err); });
        }.bind (this);
      
        request.send();
    }

    create_observer (callback) {
        var _callback = this.callback.bind (this);
        let observer = new MutationObserver(_callback);
        let observerOptions = {
            childList: false,
            attributes: true,
            characterData: false,
            subtree: false,
            attributeFilter: ['style', 'offsetTop', 'offsetLeft'],
            attributeOldValue: false,
            characterDataOldValue: false
        };
        observer.observe(this.html, observerOptions);
        return observer;
    }
    
    callback (mutations) {
        var style = mutations[0].target.attributes.style.nodeValue;
        var id = mutations[0].target.attributes.id.nodeValue;
        if (style != null && id != null) {
            var left = this.html.style.left.toString ();
            var top = this.html.style.top.toString ();
            this._x = parseFloat (left.substr (0, left.length - 1));
            this._y = parseFloat (top.substr (0, top.length - 1));
            this.callbacks.forEach (c => {
                c ();
            })
        }    
    }

    play () {
        if (this.is_playing == false) {
            this.is_playing = true;
            this.set_playing_style();
            if (this.typ == "audio") {
                this.play_audio();
            }
            this.start_time = new Date ();
            this.visual.fire_callbacks_point_play (this);
        }
    }

    set_playing_style() {
        this.html.style.backgroundColor = "white";
        this.boxShadowOpacity = 0.3;
        this.html.style.color = "black";
        this.html.style.opacity = 1;
    }

    remove_playing_style() {
        this.html.style.backgroundColor = this.backgroundColor;
        this.html.style.color = this.color;
        this.html.style.opacity = this.opacity;
        this.boxShadowOpacity = this.defaultBoxShadowOpacity;
    }

    play_audio() {
        //this.audio.play(0);
        this.arm_audio_node();
        this.audio_node.onended = this.stop.bind (this);
        this.audio_node.start ();
        //var stoptimer = setTimeout(this.stop_audio.bind(this), this.audio.duration - 1000); // execute timeout 5 seconds before end of playback
        //this.fade_in_audio (this.audio);
    }

    arm_audio_node() {
        this.audio_node = this.visual.audioContext.createBufferSource();
        this.audio_node.buffer = this.audio_buffer;
        this.audio_node.connect(this.visual.audioGainNode);
    }

    stop_audio() {
        //this.audio.pause();
        this.audio_node.stop();
        this.audio.currentTime = 0;
        //this.fade_out_audio (this.audio);
    }

    fade_out_audio (sound) {
        var fadeAudio = setInterval(function () {
            if ((sound.volume >= 0.1)) {
                sound.volume -= 0.05;
            }else {
                sound.pause();
                sound.currentTime = 0;
                clearInterval(fadeAudio);
            }
        }, 100);        
    }

    fade_in_audio (sound) {
        sound.volume = 0;
        var fadeAudio = setInterval(function () {
            if (sound.volume <= 0.9) {
                sound.volume += 0.05;
            }else {
                clearInterval(fadeAudio);
            }
        }, 100);        
    }


    stop () {
        if (this.is_playing == true) {
            this.is_playing = false;
            this.remove_playing_style();
            if (this.audio) {
                this.stop_audio();
            }
            this.end_time = new Date ();
            this.playing_duration = this.end_time - this.start_time;
            this.visual.fire_callbacks_point_stop (this, this.playing_duration);
        }
    }

    show () {
        this.html.style.visibility = "visible";
        this._visibility = true;
    }   

    hide () {
        this.html.style.visibility = "hidden";
        this._visibility = false;
    }

}

class Visual {
    
    constructor (master_container) {
        this.graph;

        this.points = [];
        this.lines = [];
        this.master_container = master_container; 
        this.container;
        this.svg;
        this.callbacks_point_play = [];
        this.callbacks_point_stop = [];

        this.audioContext = new AudioContext ();
        this.audioGainNode = this.audioContext.createGain ();
        this._audioVolume = false;

        this.default_font_size = 20;
        this._depth = 2;
        this.start_node;

        this.x_center = 50; 
        this.y_center = 50; 
        this.radius = RADIUS_VALUE;

        this.create_html ();
        this.init_audio ();
    }

    get start_level () {
        if (this.start_node) {
            return this.start_node.level
        }else {
            return 0;
        }
    }

    get font_size () {
        return this.container.style.fontSize;
    }

    set font_size (val) {
        this.container.style.fontSize = val;
    }

    get max_level () {
        return this.points.length;
    }

    get depth () {
        return this._depth;
    }

    set depth (val) {
        this._depth = val;
        this.reset ();
        this.create_from_graph (this.graph);
    }

    get audioVolume () {
        return this._audioVolume ();
    }

    set audioVolume (val) {
        this.audioGainNode.gain.setValueAtTime(val, this.audioContext.currentTime);
        this._audioVolume = val;
    }

    reset () {
        this.points = [];
        this.lines = [];
        this.svg.innerHTML = "";
        this.container.innerHTML = "";
    }

    on_zoom_change (zoom) {
        console.log ("On Zoom Change");
        /* var new_depth = 2+Math.round (zoom*this.max_level);
        if (new_depth != this.depth) {
            this.depth = new_depth;
        } */
        this.font_size = this.default_font_size + zoom*FONT_SIZE_ZOOM_FACTOR*100;
    };

    callback_create_from_graph = function () {};

    fire_callbacks_point_play (point) {
        this.callbacks_point_play.forEach (e => {
            e(point);
        })
    }

    fire_callbacks_point_stop (point, duration) {
        this.callbacks_point_stop.forEach (e => {
            e(point, duration);
        })
    }

    create_from_graph (g, start_node) {
        this.reset ();
        this.graph = g;
        if (start_node == null) {
            this.create_points_from_graph (g, this.depth);
        }else {
            this.create_points_from_start_node (g, start_node, this.depth);
        }
        this.create_lines_from_graph (g);
        this.callback_create_from_graph ();
    }

    create_html () {
        this.container = document.createElement ("div");
        this.container.className = "graphNodes"; 
        this.svg = document.createElementNS (SVG_NAMESPACE, "svg");
        this.master_container.appendChild (this.svg);
        this.master_container.appendChild (this.container);
        this.font_size = this.default_font_size;
    }

    init_audio () {
        this.audioGainNode.connect (this.audioContext.destination);
        this.mute ();
    }

    create_points_from_graph (graph, depth) {
        var level_zero_nodes = graph.get_all_nodes_from_level (0);
        if (level_zero_nodes.length == 1) {
            this.create_points_from_start_node (graph, level_zero_nodes[0], this.x_center, this.y_center, this.radius, depth);
        }else {
            this.create_children_points_from_graph_node (graph,null, this.x_center, this.y_center, this.radius, depth);
        }
    }

    create_points_from_start_node (graph, start_node, depth) {
        this.start_node = start_node;
        this.create_point (this.x_center, this.y_center, start_node);
        this.create_children_points_from_graph_node (graph,start_node, this.x_center, this.y_center, this.radius, depth-1);
    }

    create_lines_from_graph (graph) {
        graph.edges.forEach(element => {
            this.create_line (element);
        });
    }


    create_children_points_from_graph_node (graph, parentnode, x_center, y_center, radius, remaining_depth) {
        var children = graph.get_children_nodes (parentnode);
        for (var i=0; i<children.length; i++) {
            var node = children [i];
            var winkel = i * (2*Math.PI / children.length) + Math.random () * 0.3;
            var { x, y } = this.convert_polar_into_cartesian_coordinates (x_center, y_center, radius, winkel);
            var color = parentnode ? parentnode.color : this.get_random_color ();
            this.create_point (x,y, node, "white")
            if (remaining_depth > 0) {
                this.create_children_points_from_graph_node(graph, node, x, y, radius/RADIUS_LEVEL_FACTOR, remaining_depth-1);
            }
        }
    }

    create_point (x,y, node, color) {
        var p = new Point (x,y, node, this, color);
        var level = node.level;
        if (!this.points[level]) {
            this.points[level] = [];
        }
        this.points[level].push (p);
    }

    create_line (edge) {
        var _points = this.find_points_from_graph_edge (edge);
        if (_points != null) {
            var line = new Line (_points [0], _points [1], 1, this);
            line.edge = edge;
            this.lines.push (line);
            return line;
        }else {
            return null;
        }
    }

    find_points_from_graph_edge (edge) {
        var id1 = edge.node_a.id;
        var id2 = edge.node_b.id;
        var point_a = this.find_point (id1);
        var point_b = this.find_point (id2);
        if (point_a != null && point_b != null) {
            return [point_a, point_b] 
        }else {
            return null;
        }
    }

    change_visibility_of_level (level, visibility) {
        if (this.points[level]){
            this.points[level].forEach (point => {
                point.visibility = visibility;
            });
        }
    }

    convert_polar_into_cartesian_coordinates (x_center, y_center, radius, winkel) {
        var x = x_center + radius * Math.cos(winkel);
        var y = y_center + radius * Math.sin(winkel);
        return { x, y };
    }

    find_point (id) {
            var level = Graph.get_node_level_from_id (id);
            if (this.points[level]) {
                for (var i = 0; i<this.points[level].length; i++) {
                    if (this.points[level][i].node.id == id) {
                        return this.points[level][i];
                    }
                }
            }
    }


    find_line (point_a_id, point_b_id) {
        for (var i = 0; i<this.lines.length; i++) {
            if (this.lines[i].point_a.id == point_a_id && this.lines[i].point_b.id == point_b_id) {
                return this.lines[i];
            }
        }
    }

    get_random_color () {
        var i = Math.round (Math.random () * FARBEN.length);
        return FARBEN [i];
    }

    add_urls_to_points (urls, ids) {
        for (var i = 0; i<ids.length; i++) {
            var point = this.find_point (ids [i]);
            if (point) {
                point.url = urls [i];
            }
        };
    }

    connect_with_file_system (file_system) {
        this.add_urls_to_points (file_system.urls, file_system.node_ids);
    }


    mute () {
        this.audioVolume = 0;
    }

    unmute () {
        this.audioVolume = 1;
    }

}


//339




