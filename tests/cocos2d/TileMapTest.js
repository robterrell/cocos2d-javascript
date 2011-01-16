var util = require('util'),
    Texture2D = require('cocos2d/Texture2D').Texture2D,
    cocos = require('cocos2d'),
    nodes = cocos.nodes,
    actions = cocos.actions,
    geo = require('geometry'),
    ccp = geo.ccp;

var sceneIdx = -1;
var transitions = [
    "TMXOrthoTest2"
];


var kTagTileMap = 1;

function nextAction() {
    sceneIdx++;
    sceneIdx = sceneIdx % transitions.length;

    var r = transitions[sceneIdx];
    var c = eval('(' + r + ')');
    return c;
}
function backAction() {
    sceneIdx--;
    if (sceneIdx < 0) {
        sceneIdx += transitions.length;
    }

    var r = transitions[sceneIdx];
    var c = eval('(' + r + ')');
    return c;
}
function restartAction() {
    var r = transitions[sceneIdx];
    var c = eval('(' + r + ')');
    return c;
}

var TileDemo = nodes.Layer.extend({
    title: 'No title',
    subtitle: null,

    init: function() {
        @super;

        this.set('isMouseEnabled', true);

        var s = cocos.Director.get('sharedDirector').get('winSize');

        var label = nodes.Label.create({string: this.get('title'), fontName: 'Arial', fontSize: 26});
        this.addChild({child: label, z:1});
        label.set('position', ccp(s.width / 2, s.height - 50));


        var subtitle = this.get('subtitle');
        if (subtitle) {
            var l = nodes.Label.create({string:subtitle, fontName: "Thonburi", fontSize: 16});
            this.addChild({child: l, z:1});
            l.set('position', ccp(s.width/2, s.height - 80));
        }


        var item1 = nodes.MenuItemImage.create({normalImage:__dirname + "/resources/b1.png", selectedImage:__dirname + "/resources/b2.png", callback:util.callback(this, 'backCallback')});
        var item2 = nodes.MenuItemImage.create({normalImage:__dirname + "/resources/r1.png", selectedImage:__dirname + "/resources/r2.png", callback:util.callback(this, 'restartCallback')});
        var item3 = nodes.MenuItemImage.create({normalImage:__dirname + "/resources/f1.png", selectedImage:__dirname + "/resources/f2.png", callback:util.callback(this, 'nextCallback')});

        var menu = nodes.Menu.create({items: [item1, item2, item3]});

        menu.set('position', ccp(0,0));
        item1.set('position', ccp(s.width /2 -100, 30));
        item2.set('position', ccp(s.width /2,      30));
        item3.set('position', ccp(s.width /2 +100, 30));
        this.addChild({child: menu, z:1});
    },

    mouseDragged: function(event) {
        var node = this.getChild({tag: kTagTileMap});
        var currentPos = node.get('position');
        node.set('position', geo.ccpAdd(currentPos, ccp(event.deltaX, event.deltaY)));
        return true;
    },

    restartCallback: function() {
        var director = cocos.Director.get('sharedDirector');

        var scene = nodes.Scene.create();
        scene.addChild({child: restartAction().create()});

        director.replaceScene(scene);
    },

    backCallback: function() {
        var director = cocos.Director.get('sharedDirector');

        var scene = nodes.Scene.create();
        scene.addChild({child: backAction().create()});

        director.replaceScene(scene);
    },

    nextCallback: function() {
        var director = cocos.Director.get('sharedDirector');

        var scene = nodes.Scene.create();
        scene.addChild({child: nextAction().create()});

        director.replaceScene(scene);
    }
});


var TMXOrthoTest2 = TileDemo.extend({
    title: 'Tile Map Test',
    subtitle: 'drag screen',

    init: function() {
        @super;

        var map = nodes.TMXTiledMap.create({file: __dirname + "/resources/TileMaps/orthogonal-test1.tmx"});
        this.addChild({child: map, z: 0, tag: kTagTileMap});

        var s = cocos.Director.get('sharedDirector').get('winSize');

        map.runAction(actions.ScaleBy.create({duration: 2, scale: 0.5}));
    }
});

// Initialise test
var director = cocos.Director.get('sharedDirector');

director.attachInView(document.getElementById('cocos2d-tests'));
director.set('displayFPS', true);

var scene = nodes.Scene.create();
scene.addChild({child: nextAction().create()});

director.runWithScene(scene);
