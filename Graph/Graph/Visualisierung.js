//PLUGIN FuR GRAPH
const FARBEN = ["blue", "red", "yellow", "purple", "green", "orange", "pink", "brown", "white"]
const MOUSE_OVER = true;
const CONTROL_NAMES = ["record", "play", "pause", "reset", "seqr", "bang", "loop", "perm", "pendel", "dev"];
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";



var FONT_SIZE_ZOOM_FACTOR = 1.1; //depends on UI Max Zoom (*1 equals)
var FONT_SIZE_LEVEL_FACTOR = 1;
var RADIUS_VALUE = 30;
var SHADOW_OPACITY = 1;

var AudioContext = window.AudioContext || (window).webkitAudioContext;

class Line {
    constructor (point_a, point_b, strength, visual) {
        this.point_a = point_a;
        this.point_b = point_b;
        this.point_a.callbacks.push (this.callback.bind(this));
        this.point_b.callbacks.push (this.callback.bind(this));
        this.strength = strength;
        this._color = "white";
        this.opacity = 0.1 + Math.random ()*0.4;
        this.visual = visual;
        this.svg = visual.line_svg;
        this.create_html ();
    }

    get color () {
        return this._color;
    }

    set color (val) {
        this._color = val;
        this.html.style.stroke = val;
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
    }

    reverse () {
        var x;
        x = this.point_a;
        this.point_a = this.point_b;
        this.point_b = x;
    }
    
    create_html () {
        this.html = document.createElementNS(SVG_NAMESPACE, 'line');
        this.html.setAttribute("x1",this.x1+"%");
        this.html.setAttribute("y1",this.y1+"%");
        this.html.setAttribute("x2",this.x2+"%");
        this.html.setAttribute("y2",this.y2+"%");
        this.html.style.stroke = this.color;
        this.html.style.strokeOpacity = this.opacity;
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
        this.init_point(x, y, node, visual, color, shadow_color);
    }

    init_point(x, y, node, visual, color, shadow_color) {
        this._x = x;
        this._y = y;
        this.node = node;
        this.type = "point"
        this.visual = visual;
        this.container = visual.point_container;
        this.html;


        this._color = color ? color : this.visual.default_point_color;
        this._backgroundColor = this.visual.default_point_background_color;
        this._boxShadowColor = shadow_color ? shadow_color : this.visual.default_point_shadow_color;
        this._fontSize;

        this._opacity = 1;
        this._boxShadowOpacity = SHADOW_OPACITY;
        this.defaultBoxShadowOpacity = SHADOW_OPACITY;

        this.is_toggle = false;
        this._is_active = false;
        this.mouseOverEnabled = true;
        this.prevent_mouse_over_flag = false;

        this._visibility = true;
        this._url = "";

        this.create_html();
        this.create_observer();
        this.callbacks = [];
    }

    get children () {
        return this.visual.get_children_points (this.node.id);
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
        this.html.style.backgroundColor = val;
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

    get name_arguments () {
        var parts = this.node.name.split ("_");
        return parts;
    }

    get id () {
        return this.node.id;
    }

    get url () {
        return this._url;
    }

    set url (val) {
        this._url = val;
        this.on_update_url ();
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

    get absolute_position () {
        var pos = $(this.html).offset();
        return pos;
    }

    get relative_level () {
        return this.node.level - this.visual.start_level;
    }

    get relative_path () {
        var path = this.url.substring (this.visual.domain.length);
        return path;
    }

    get is_active () {
        return this._is_active;
    }

    set is_active (val) {
        this._is_active = val;
        if (val == false) {
            this.remove_active_style ();
        }else {
            this.set_active_style ();
        }
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
        this.fontSize = 111 / (Math.pow(this.visual.font_size_level_exp_factor, this.relative_level) * FONT_SIZE_LEVEL_FACTOR);
        this.html.style.fontWeight = "normal";
    }

    init_html_colors() {
        this.color = this._color;
        this.backgroundColor = this._backgroundColor;
        this.boxShadowColor = this._boxShadowColor;
    }

    set_html_opacities() {
        this.opacity = 1- ((this.relative_level - 1) * 0.6)* this.visual.opacity_level_factor + Math.random() * 0.3;
        this.defaultBoxShadowOpacity = 0.2 - 0.01 * this.relative_level;
        this.boxShadowOpacity = this.defaultBoxShadowOpacity;
    }

    set_html_box(fontSize, level) {
        var margin = 0;
        var padding = fontSize/900;
        this.html.style.cursor = "pointer";
        this.html.style.zIndex = 10-level;
        this.html.style.padding = padding + "%";
        this.html.style.margin = margin + "%";
        this.html.style.position = "absolute";
        this.html.style.transform = "translate(-50%, -50%)";
        this.html.style.webkitTransform = "translate(-50%, -50%)";
        this.html.style.border = "solid 1px";
    }

    set_html_text() {
        this.html.innerHTML = this.node.name;
    }

    update_html_boxshadow() {
        var r = this.boxShadowColor[0] ;
        var g = this.boxShadowColor[1];
        var b = this.boxShadowColor[2];
        this.html.style.boxShadow = "rgba(" + r + ", " + g + ", " + b + ", " + this.boxShadowOpacity + ") 0px 0px 50px 5px";
    }

    create_event_listeners() {
        this.html.addEventListener('mouseover', this.mouse_over.bind(this));
        this.html.addEventListener('mouseleave', this.mouse_leave.bind(this));
        this.html.addEventListener('click', this.click.bind(this));
    }

    click () {
        this.prevent_mouse_over_flag = true;
        this.on_click ();
    }

    on_click () {

    }

    mouse_leave () {
        if (this.mouseOverEnabled && this.prevent_mouse_over_flag == true) {
            this.prevent_mouse_over_flag = false;
            if (!this.is_toggle) {this.is_active = false;}
            this.on_mouse_leave();
        }
    }    

    on_mouse_leave () {

    };
    
    mouse_over () {
        if (this.mouseOverEnabled && !this.prevent_mouse_over_flag) {
            this.prevent_mouse_over_flag = true;
            if (!this.is_toggle) {this.is_active = true;}
            this.on_mouse_over ();
        }
    }

    on_mouse_over () {

    };

    on_update_url () {
    
    }

    play () {
        if (this.is_toggle) {
            this.is_active = !this.is_active;
        }else {
            this.is_active = true;
            if (!this.mouseOverEnabled) {setTimeout (function () {this.is_active = false}.bind (this), 100)};
        }
        this.start_time = new Date ();
        this.visual.fire_callbacks_point_play (this);
        //this.play_all_children ()
        this.on_play ();
    }

    stop () {
        this.stop_time = new Date ();
        //this.stop_all_children ();
        this.is_active = false;
        this.visual.fire_callbacks_point_stop (this);
        this.on_stop ();

    }

    play_all_children () {
        this.children.forEach (c => {
            c.play ();
        })
    }

    stop_all_children () {
        this.children.forEach (c => {
            c.stop ();
        })
    }

    on_play () {

    }

    on_stop () {

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

    set_active_style() {
        this.html.style.backgroundColor = this.visual.default_point_active_background_color;
        this.boxShadowOpacity = 0.3;
        this.html.style.color = this.visual.default_point_active_color;
        this.html.style.opacity = 1;
    }

    remove_active_style() {
        this.html.style.backgroundColor = this.backgroundColor;
        this.html.style.color = this.color;
        this.html.style.opacity = this.opacity;
        this.boxShadowOpacity = this.defaultBoxShadowOpacity;
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
        this.url_list = [];
        this.domain = "";
        this.points = [];
        this.lines = [];

        this.master_container = master_container; 
        this.point_container;
        this.line_svg;

        this.callbacks_point_play = [];
        this.callbacks_point_stop = [];
        this.callbacks_init_audio = [];
        
        this.domain;
        this.content_directory;

        this.audioContext;
        this.audioGainNode;
        this._audioVolume = 0;

        this.clickToOpen = true;
        this.frameEnabled = true;
        this.mouseOverEnabled = false;
        this.default_font_size = 20;
        this.opacity_level_factor = 0.3; //1
        this.radius_level_factor = 2.3; //2.8
        this.radius = RADIUS_VALUE;
        this.x_center = 50; 
        this.y_center = 50; 
        this.font_size_level_exp_factor = 1.2 //1.8
        this._depth = 4;

        this.start_node;
 
        this.create_html ();

        this.lightmode = false;

    }

    set lightmode (val) {
        if (val == true) {
            this.default_line_color = "black";
            this.default_point_color = "black";
            this.default_point_background_color = "rgb(232, 232, 232)";
            this.default_point_shadow_color = [0, 0, 0];
            this.default_point_active_background_color = "rgb(219, 219, 219)";
            this.default_point_active_color = "black";
            this.master_container.style.backgroundColor = "rgb(242, 242, 242)";
            this.master_container.parentElement.style.backgroundColor = "rgb(242, 242, 242)";
        }else {
            this.default_line_color = "rgb(240, 237, 230)";
            this.default_point_color = "rgb(245, 242, 240)";
            this.default_point_background_color = "rgb(30, 30, 30)";
            this.default_point_shadow_color = [255, 255, 255];
            this.default_point_active_background_color = "rgb(245, 242, 240)";
            this.default_point_active_color = "rgb(30, 30, 30)";
            this.master_container.style.backgroundColor = "rgb(18,18,18)";
            this.master_container.parentElement.style.backgroundColor = "rgb(18,18,18)";
        }
    }

    get start_level () {
        if (this.start_node) {
            return this.start_node.level
        }else {
            return 0;
        }
    }

    get font_size () {
        return this.point_container.style.fontSize;
    }

    set font_size (val) {
        this.point_container.style.fontSize = val;
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
        this.line_svg.innerHTML = " ";
        this.point_container.innerHTML = " ";
    }

    on_zoom_change (zoom) {
        /* var new_depth = 2+Math.round (zoom*this.max_level);
        if (new_depth != this.depth) {
            this.depth = new_depth;
        } */
        this.font_size = this.default_font_size + zoom*FONT_SIZE_ZOOM_FACTOR*100;
    };

    callback_create_from_graph () {

    };

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
        if (g) {
            this.reset ();
            this.graph = g;
            this.start_node = start_node;
            this.set_visual_parameters ();
            if (start_node == null) {
                this.create_points_from_graph (g, this.depth);
            }else {
                this.create_points_from_start_node (g, start_node, this.depth);
            }
            this.create_lines_from_graph (g);
            this.callback_create_from_graph ();
            this.on_init_audio ();
        }
    }

    set_visual_parameters () {
        if (this.graph.edges.length > 1500) {
            this._depth = 3; 
            this.opacity_level_factor = 1.4; 
            this.radius_level_factor = 2.5;
        }
        else if (this.graph.edges.length > 300) {
            this._depth = 3; 
            this.opacity_level_factor = 0.75; 
            this.radius_level_factor = 3.1;
        }else {
            this._depth = 4; 
            this.opacity_level_factor = 0.3; 
            this.radius_level_factor = 2.3;
        }
    }
    

    create_html () {
        this.point_container = document.createElement ("div");    
        this.point_container.className = "graphNodes"; 
        this.line_svg = document.createElementNS (SVG_NAMESPACE, "svg");
        this.master_container.appendChild (this.line_svg);
        this.master_container.appendChild (this.point_container);
        this.font_size = this.default_font_size;
    }

    init_audio () {
        this.audioContext = new AudioContext ();
        this.audioGainNode = this.audioContext.createGain ();
        this.audioGainNode.connect (this.audioContext.destination);
        this.audioVolume = 0;
        this.on_init_audio ();
    }

    on_init_audio () {
        if (this.audioContext) {
            this.callbacks_init_audio.forEach (e => {
                e();
            });
        }
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
        this.add_point (this.x_center, this.y_center, start_node);
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
            var winkel = i * (2*Math.PI / children.length) + Math.random () * 0.0;
            var { x, y } = this.convert_polar_into_cartesian_coordinates (x_center, y_center, radius, winkel);
            var color = parentnode ? parentnode.color : get_random_rgb_color ();
            this.add_point (x,y, node)
            if (remaining_depth > 0) {
                this.create_children_points_from_graph_node(graph, node, x, y, radius/this.radius_level_factor, remaining_depth-1);
            }
        }
    }

    add_point (x,y, node, color) {
        var p = this.create_point(node, x, y, color);
        var level = node.level;
        if (!this.points[level]) {
            this.points[level] = [];
        }
        this.points[level].push (p);
    }

    create_point(node, x, y, color) {
        var p;
        var url = this.url_list [node.id];
        var is_control_node = this.is_control_node(node);
        if (url && is_audio_url(url)) {
            p = new AudioPoint (x, y, node, this, color);
            p.url = url;
        } else if (url) {
            p = new FilePoint(x, y, node, this, color);
            p.url = url;
            p.file_extension = get_file_extension_from_url (url);
        } else if (is_control_node) { //array
            p = new ControlPoint (x, y, node, this, color);
        } else if (node.name == "_speaker") {
            p = new StreamIOPoint (x, y, node, this, color)
        } else if (node.name == "_auction") {
            p = new AuctionPoint  (x, y, node, this, color)
        } else if (node.name.startsWith ("_sing") || node.name.startsWith ("_listen") ) {
            p = new StreamPoint  (x, y, node, this, color)
        }
        else {
            p = new NodePoint (x, y, node, this, color)
        }
        return p;
    }

    is_control_node(node) {
        var is_control_node = false;
        CONTROL_NAMES.forEach (n => {
            if (node.name.startsWith ("_" + n)) {
                is_control_node = true;
            }
        });
        return is_control_node;
    }

    get_children_points (parentnode_id) {
        var parent_node = this.graph.find_node (parentnode_id);
        var children_points = [];
        parent_node.children.forEach (c => {
            var point = this.find_point (c.id);
            children_points.push (point);
        })
        return children_points;
    }

    create_line (edge) {
        var _points = this.find_points_from_graph_edge (edge);
        if (_points != null) {
            var line = new Line (_points [0], _points [1], 1, this);
            line.color = this.default_line_color;
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

    connect_with_file_system (filesystem) {
        for (var i = 0; i<filesystem.node_ids.length; i++) {
            this.url_list [filesystem.node_ids[i]] = filesystem.urls [i];
            this.domain = filesystem.get_own_domain ();
            this.content_directory = filesystem.content_directory;
        };
    }

    mute () {
        this.audioVolume = 0;
    }

    unmute () {
        this.audioVolume = 1;
    }
}

function get_random_rgb_color () {
    var val = [];
    for (var i = 0; i<3; i++) {
        val.push (Math.round (255 * Math.random ()));
    }
    return "rgb("+val[0]+", "+val[1]+", "+val[2]+")";
}

function get_file_extension_from_url (url) {
    if (url) {
        return url.substr (url.lastIndexOf ("."));
    }else {
        return null;
    }
}

function is_audio_url (url) {
    var ext = get_file_extension_from_url (url);
    if (ext == ".mp3" || ext == ".wav" || ext == ".flac") {
        return true; 
    }else {
        return false;
    }
}

//800




