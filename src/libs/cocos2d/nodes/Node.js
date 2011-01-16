var util = require('util'),
    event = require('event'),
    Scheduler = require('../Scheduler').Scheduler,
    ActionManager = require('../ActionManager').ActionManager,
    geom = require('geometry'), ccp = geom.ccp;

var Node = BObject.extend(/** @lends cocos.nodes.Node# */{
    isCocosNode: true,
    visible: true,
    position: null,
    parent: null,
    tag: null,
    contentSize: null,
    zOrder: 0,
    anchorPoint: null,
    anchorPointInPixels: null,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    isRunning: false,
    isRelativeAnchorPoint: true,

    isTransformDirty: true,
    isInverseDirty: true,
    inverse: null,
    transformMatrix: null,

    /**
     * The child Nodes
     * @type {cocos.nodes.Node[]}
     */
    children: null,

    /**
     * The base class all visual elements extend from
     * @memberOf cocos.nodes
     * @constructs
     * @extends BObject
     */
    init: function() {
        this.set('contentSize', {width: 0, height: 0});
        this.anchorPoint = ccp(0.5, 0.5);
        this.anchorPointInPixels = ccp(0, 0);
        this.position = ccp(0,0);
        this.children = [];

        util.each(['scaleX', 'scaleY', 'rotation', 'position', 'anchorPoint', 'contentSize', 'isRelativeAnchorPoint'], util.callback(this, function(key) {
            event.addListener(this, key.toLowerCase() + '_changed', util.callback(this, this._dirtyTransform));
        }));
        event.addListener(this, 'anchorpoint_changed', util.callback(this, this._updateAnchorPointInPixels));
        event.addListener(this, 'contentsize_changed', util.callback(this, this._updateAnchorPointInPixels));
    },

    /**
     * Calculates the anchor point in pixels and updates the
     * anchorPointInPixels property
     * @private
     */
    _updateAnchorPointInPixels: function() {
        var ap = this.get('anchorPoint'),
            cs = this.get('contentSize');
        this.set('anchorPointInPixels', ccp(cs.width * ap.x, cs.height * ap.y));
    },

    /**
     * Add a child Node
     *
     * @opt {cocos.nodes.Node} child The child node to add
     * @opt {Integer} [z] Z Index for the child
     * @opt {Integer|String} [tag] A tag to reference the child with
     * @returns {cocos.nodes.Node} The node the child was added to. i.e. 'this'
     */
    addChild: function(opts) {
        if (opts.isCocosNode) {
            return arguments.callee.call(this, {child:opts});
        }

        var child = opts['child'],
            z = opts['z'],
            tag = opts['tag'];

        if (z == undefined) {
            z = child.get('zOrder');
        }

        //this.insertChild({child: child, z:z});
        var added = false;

        
        for (var i = 0, childLen = this.children.length; i < childLen; i++) {
            var c = this.children[i];
            if (c.zOrder > z) {
                added = true;
                this.children.splice(i, 0, child);
                break;
            }
        }

        if (!added) {
            this.children.push(child);
        }

        child.set('tag', tag);
        child.set('zOrder', z);
        child.set('parent', this);

        if (this.isRunning) {
            child.onEnter();
        }

        return this;
    },
    getChild: function(opts) {
        var tag = opts['tag'];

        for (var i = 0; i < this.children.length; i++) {
            if (this.children[i].tag == tag) {
                return this.children[i];
            }
        }

        return null;
    },

    removeChild: function(opts) {
        var child = opts.child,
            cleanup = opts.cleanup;

        if (!child) {
            return;
        }

        var children = this.get('children'),
            idx = children.indexOf(child);

        if (idx > -1) {
            this.detatchChild({child: child, cleanup: cleanup});
        }
    },

    detatchChild: function(opts) {
        var child = opts.child,
            cleanup = opts.cleanup;

        var children = this.get('children'),
            isRunning = this.get('isRunning'),
            idx = children.indexOf(child);

        if (isRunning) {
            child.onExit();
        }

        if (cleanup) {
            child.cleanup();
        }

        child.set('parent', null);
        children.splice(idx, 1);
    },

    reorderChild: function(opts) {
        var child = opts['child'],
            z     = opts['z'];

        var pos = this.children.indexOf(child);
        if (pos == -1) {
            throw "Node isn't a child of this node";
        }

        child.set('zOrder', z);

        // Remove child
        this.children.splice(pos, 1);

        // Add child back at correct location
        var added = false;
        for (var i = 0, childLen = this.children.length; i < childLen; i++) {
            var c = this.children[i];
            if (c.zOrder > z) {
                added = true;
                this.children.splice(i, 0, child);
                break;
            }
        }

        if (!added) {
            this.children.push(child);
        }
    },

    draw: function(context) {
        // All draw code goes here
    },

    /**
     * @getter scale
     * @type Float
     */
    get_scale: function() {
        if (this.scaleX != this.scaleY) {
            throw "scaleX and scaleY aren't identical"
        }

        return this.scaleX;
    },

    /**
     * @setter scale
     * @type Float
     */
    set_scale: function(val) {
        this.set('scaleX', val);
        this.set('scaleY', val);
    },

    scheduleUpdate: function(opts) {
        var opts = opts || {},
            priority = opts['priority'] || 0;

        Scheduler.get('sharedScheduler').scheduleUpdate({target: this, priority: priority, paused: !this.get('isRunning')});
    },

    /**
     * Triggered when the node is added to a scene
     *
     * @event
     */
    onEnter: function() {
        util.each(this.children, function(child) { child.onEnter(); });

        this.resumeSchedulerAndActions();
        this.set('isRunning', true);
    },

    /**
     * Triggered when the node is removed from a scene
     *
     * @event
     */
    onExit: function() {
        this.pauseSchedulerAndActions();
        this.set('isRunning', false);

        util.each(this.children, function(child) { child.onExit(); });
    },

    cleanup: function() {
        this.stopAllActions();
        this.unscheduleAllSelectors();
        util.each(this.children, function(child) { child.cleanup(); });
    },

    resumeSchedulerAndActions: function() {
        Scheduler.get('sharedScheduler').resumeTarget(this);
        ActionManager.get('sharedManager').resumeTarget(this);
    },
    pauseSchedulerAndActions: function() {
        Scheduler.get('sharedScheduler').pauseTarget(this);
        ActionManager.get('sharedManager').pauseTarget(this);
    },
    unscheduleAllSelectors: function() {
        Scheduler.get('sharedScheduler').unscheduleAllSelectorsForTarget(this);
    },
    stopAllActions: function() {
        ActionManager.get('sharedManager').removeAllActionsFromTarget(this);
    },

    visit: function(context) {
        if (!this.visible) {
            return;
        }

        context.save();

        this.transform(context);

        // Draw background nodes
        util.each(this.children, function(child, i) {
            if (child.zOrder < 0) {
                child.visit(context);
            }
        });

        this.draw(context);

        // Draw foreground nodes
        util.each(this.children, function(child, i) {
            if (child.zOrder >= 0) {
                child.visit(context);
            }
        });

        context.restore();
    },
    transform: function(context) {
        // Translate
        if (this.isRelativeAnchorPoint && (this.anchorPointInPixels.x != 0 || this.anchorPointInPixels != 0)) {
            context.translate(Math.round(-this.anchorPointInPixels.x), Math.round(-this.anchorPointInPixels.y));
        }

        if (this.anchorPointInPixels.x != 0 || this.anchorPointInPixels != 0) {
            context.translate(Math.round(this.position.x + this.anchorPointInPixels.x), Math.round(this.position.y + this.anchorPointInPixels.y));
        } else {
            context.translate(Math.round(this.position.x), Math.round(this.position.y));
        }

        // Rotate
        context.rotate(geom.degressToRadians(-this.get('rotation')));

        // Scale
        context.scale(this.scaleX, this.scaleY);
 
        if (this.anchorPointInPixels.x != 0 || this.anchorPointInPixels != 0) {
            context.translate(Math.round(-this.anchorPointInPixels.x), Math.round(-this.anchorPointInPixels.y));
        }
    },

    runAction: function(action) {
        ActionManager.get('sharedManager').addAction({action: action, target: this, paused: this.get('isRunning')});
    },

    nodeToParentTransform: function() {
        if (this.isTransformDirty) {
            this.transformMatrix = geom.affineTransformIdentity();

            if (!this.isRelativeAnchorPoint && !geom.pointEqualToPoint(this.anchorPointInPixels, ccp(0,0))) {
                this.transformMatrix = geom.affineTransformTranslate(this.transformMatrix, this.anchorPointInPixels.x, this.anchorPointInPixels.y);
            }
            
            if(!geom.pointEqualToPoint(this.position, ccp(0,0))) {
                this.transformMatrix = geom.affineTransformTranslate(this.transformMatrix, this.position.x, this.position.y);
            }

            if(this.rotation != 0) {
                this.transformMatrix = geom.affineTransformRotate(this.transformMatrix, -geom.degressToRadians(this.rotation));
            }
            if(!(this.scaleX == 1 && this.scaleY == 1)) {
                this.transformMatrix = geom.affineTransformScale(this.transformMatrix, this.scaleX, this.scaleY);
            }
            
            if(!geom.pointEqualToPoint(this.anchorPointInPixels, ccp(0,0))) {
                this.transformMatrix = geom.affineTransformTranslate(this.transformMatrix, -this.anchorPointInPixels.x, -this.anchorPointInPixels.y);
            }
            
            this.set('isTransformDirty', false);
                
        }

        return this.transformMatrix;
    },

    parentToNodeTransform: function() {
        // TODO
    },

    nodeToWorldTransform: function() {
        var t = this.nodeToParentTransform();

        var p;
        for (p = this.get('parent'); p; p = p.get('parent')) {
            t = geom.affineTransformConcat(t, p.nodeToParentTransform());
        }

        return t;
    },

    worldToNodeTransform: function() {
        return geom.affineTransformInvert(this.nodeToWorldTransform());
    },

    convertToNodeSpace: function(worldPoint) {
        return geom.pointApplyAffineTransform(worldPoint, this.worldToNodeTransform());
    },

    /**
     * @getter acceptsFirstResponder
     * @type Boolean
     */
    get_acceptsFirstResponder: function() {
        return false;
    },

    /**
     * @getter becomeFirstResponder
     * @type Boolean
     */
    get_becomeFirstResponder: function() {
        return true;
    },

    /**
     * @getter resignFirstResponder
     * @type Boolean
     */
    get_resignFirstResponder: function() {
        return true;
    },

    /**
     * @getter boundingBox
     * @type geometry.Rect
     */
    get_boundingBox: function() {
        var cs = this.get('contentSize');
        var rect = geom.rectMake(0, 0, cs.width, cs.height);
        return geom.rectApplyAffineTransform(rect, this.nodeToParentTransform());
    },

    /**
     * @private
     */
    _dirtyTransform: function() {
        this.set('isTransformDirty', true);
    }
});

module.exports.Node = Node;
