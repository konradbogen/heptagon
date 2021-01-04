//@Work Klasse UI

var graph;
var parser;
var visual;
var daten;
var test;
//var default_entry = "Konstellation.Nadja\nKonstellation.Tim\nKonstellation.Felix\nKonstellation.Lukas\nKonstellation.Jannis\nKonstellation.Laurenz\nKonstellation.Konrad\n";
var default_entry = "agent.konradbogen\nagent.you\nagent.we\nverb.is\nverb.are\nquantity.a\nquantity.multiple\nquantity.the1221\nquantity.thefirst\nquantity.thelast\nnoun.visitor\nnoun.composer\nnoun.pirate\nnoun.cook\nnoun.observer\nnoun.speaker\nnoun.agent\nnoun.writer\nnoun.coder\nnoun.experientalist\nagent-verb\nverb-quantity\nquantity-noun\nagent-quantity\nnoun-agent\n>seq yellow agent-agent.konradbogen 12 agent.konrad-agent 12 agent-verb 12 verb-verb.is 12 verb.is-verb 12 verb-quantity 12 quantity-quantity.a 12 quantity.a-quantity 12 quantity-noun 12 noun-noun.composer 12\n>pac yellow\n>seq brown agent-agent.you 13 agent.you-agent 13 agent-verb 13 verb-verb.are 13 verb.are-verb 13 verb-quantity 13 quantity-quantity.the1221 13 quantity.the1221-quantity 13 quantity-noun 13\n>pac brown\n";
//var default_entry = "A\nA.L\nB\nC\nD\nE\nA-B\nB-D\nA-E\nE-C\nC-B\nE-B\nE-D\nD-A\n>seq lukas A-B 2 B-D 3\n>pac lukas";
//var default_entry = "schnipsel3-schnipsel4\nschnipsel4-schnipsel1\n>seq hallo schnipsel2-schnipsel3 50 schnipsel3-schnipsel4 80 schnipsel4-schnipsel1 110 schnipsel2-schnipsel3 130\n";

const test_mode = true;
const running_local = false;

function init () {
    files = new FileSystem ();
    var container = document.getElementsByClassName ("flexContainer") [0];
    visual = new Visual (container);
    //ui = new UI ();
    //visual = new Visual (ui.graphContainer)
    if (running_local == false) {
        files.lese_verzeichnis_aus (); 
    }
    var text = default_entry;
    entry_has_changed (text);
}

function test () {
    if (test_mode) {
        test = new Test (daten, parser, graph, visual);
        test.test ();
    }
}

function update_graph () {
    graph = new Graph ();
    parser.create_graph (graph);
    visual.create_from_graph (graph);
    visual.connect_with_file_system (files);
    pacs = new PACSystem (visual);
    parser.create_all_sequences (pacs);
    parser.create_all_pacs (pacs);
    pacs.show_all_sequences ();
}

$(document).ready(function (){
    init ();
    create_event_listeners();

});

function create_event_listeners() {
    create_submit_event_listener ();
    create_menu_event_listener ();
}

function entry_has_changed (eingabe) {
    document.getElementById ("input").innerHTML = eingabe;
    parser = new Parser ();
    parser.read_text (eingabe);
    update_graph ();
}

function create_submit_event_listener  () {
    document.getElementById("submit").addEventListener("click", function() {
        var val = $.trim($("textarea").val());
          parser.read_text (val);
          update_graph ();
      }, false);
      
}

function create_menu_event_listener  () {
    $(".button").click(function() {
        $(".inputcontainer").toggleClass("faderight");
      
        });
    
    
}

