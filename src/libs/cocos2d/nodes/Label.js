var util = require('util'),
    console = require('system').console,
    Director = require('../Director').Director,
    Node = require('./Node').Node,
    ccp = require('geometry').ccp;

var Label = Node.extend(/** @lends cocos.nodes.Label# */{
    string:   '',
    fontName: 'Helvetica',
    fontSize: 16,
    fontColor: 'white',

    /**
     * Renders a simple text label
     *
     * @constructs
     * @extends cocos.nodes.Node
     *
     * @opt {String} [string=""] The text string to draw
     * @opt {Float} [fontSize=16] The size of the font
     * @opt {String} [fontName="Helvetica"] The name of the font to use
     * @opt {String} [fontColor="white"] The color of the text
     */
    init: function(opts) {
        @super;

        util.each('fontSize fontName fontColor string'.w(), util.callback(this, function(name) {
            // Set property on init
            if (opts[name]) {
                this.set(name, opts[name]);
            }

            // Update content size
            this._updateLabelContentSize();
        }));
    },

    /** 
     * String of the font name and size to use in a format &lt;canvas&gt; understands
     *
     * @getter font
     * @type String
     */
    get_font: function(key) {
        return this.get('fontSize') + 'px ' + this.get('fontName');
    },

    draw: function(context) {
        context.save();

        // Flip Y axis
        context.scale(1, -1);
        context.translate(0, -this.get('fontSize'));

        context.fillStyle = this.get('fontColor');
        context.font = this.get('font');
        context.textBaseline = 'top';
        if (context.fillText) {
            context.fillText(this.get('string'), 0, 0);
        } else if (context.mozDrawText) {
            context.mozDrawText(this.get('string'));
        }
        context.restore();
    },

    /**
     * @private
     */
    _updateLabelContentSize: function() {
        var ctx = Director.get('sharedDirector').get('context');
        var size = {width: 0, height: this.get('fontSize')};

        var prevFont = ctx.font;
        ctx.font = this.get('font');

        if (ctx.measureText) {
            var txtSize = ctx.measureText(this.get('string'));
            size.width = txtSize.width;
        } else if (ctx.mozMeasureText) {
            size.width = ctx.mozMeasureText(this.get('string'));
        }

        ctx.font = prevFont;

        this.set('contentSize', size);
    }
});

module.exports.Label = Label;
