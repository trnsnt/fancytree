/*!
 * jquery.fancytree.filter.js
 *
 * Remove or highlight tree nodes, based on a filter.
 * (Extension module for jquery.fancytree.js: https://github.com/mar10/fancytree/)
 *
 * Copyright (c) 2014, Martin Wendt (http://wwWendt.de)
 *
 * Released under the MIT license
 * https://github.com/mar10/fancytree/wiki/LicenseInfo
 *
 * @version @VERSION
 * @date @DATE
 */

;(function($, window, document, undefined) {

"use strict";


/*******************************************************************************
 * Private functions and variables
 */

function _escapeRegex(str){
	/*jshint regexdash:true */
	return (str + "").replace(/([.?*+\^\$\[\]\\(){}|-])/g, "\\$1");
}

//Check if the node has a matching parent, and if it is the case set its parents visible.
function _keepChildrenBehavior(node){
	//For each leaf of the tree we will check if there is a matching parent
	//We loop over the parent to find a matching one
	node.visitParents(function(p){
		//We found one
		if(p.match){
			//We set hide = false to all the parent and itself
			node.visitParents(function(p2){
				if(p2.match){
					//A matching node, we can exit, all its parents are already done
					return false;
				}
				else{
					p2.hide = false;
					//Used only to apply a css
					p2.childSubMatch = true;
				}
			}, true);
			//A matching node, we can exit
			return false;
		}
	});
}

/* EXT-TABLE: Show/hide all rows that are structural descendants of `parent`. */
// function setChildRowVisibility(parent, flag) {
// 	parent.visit(function(node){
// 		var tr = node.tr;
// 		if(tr){
// 			tr.style.display = flag ? "" : "none";
// 		}
// 		node.debug(flag ? "SHOW" : "HIDE");
// 		if(!node.expanded){
// 			return "skip";
// 		}
// 	});
// }

/**
 * [ext-filter] Dimm or hide nodes.
 *
 * @param {function | string} filter
 * @returns {integer} count
 * @alias Fancytree#applyFilter
 * @requires jquery.fancytree.filter.js
 */
$.ui.fancytree._FancytreeClass.prototype.applyFilter = function(filter){
	var match, re,
		count = 0,
		leavesOnly = this.options.filter.leavesOnly,
		keepChildren = this.options.filter.keepChildren;

	// Default to 'match title substring (not case sensitive)'
	if(typeof filter === "string"){
		match = _escapeRegex(filter); // make sure a '.' is treated literally
		re = new RegExp(".*" + match + ".*", "i");
		filter = function(node){
			return !!re.exec(node.title);
		};
	}

	this.enableFilter = true;
	this.$div.addClass("fancytree-ext-filter");
	if( this.options.filter.mode === "hide"){
		this.$div.addClass("fancytree-ext-filter-hide");
	} else {
		this.$div.addClass("fancytree-ext-filter-dimm");
	}
	// Reset current filter
	this.visit(function(node){
		node.hide = true;
		delete node.match;
		delete node.subMatch;
		delete node.childSubMatch;
	});
	// Adjust node.hide, .match, .subMatch flags
	this.visit(function(node){
		if ((!leavesOnly || node.children == null) && filter(node)) {
			count++;
			node.hide = false;
			node.match = true;
			node.visitParents(function(p){
				p.hide = false;
				p.subMatch = true;
			});
		}
		//We want to keep children
		//To avoid useless work we do it for leaf node only
		else if(keepChildren && node.children == null){
			_keepChildrenBehavior(node);
		}
	});
	// Redraw
	this.render();
	return count;
};

/**
 * [ext-filter] Reset the filter.
 *
 * @alias Fancytree#applyFilter
 * @requires jquery.fancytree.filter.js
 */
$.ui.fancytree._FancytreeClass.prototype.clearFilter = function(){
	this.visit(function(node){
		delete node.hide;
		delete node.match;
		delete node.subMatch;
		delete node.childSubMatch;
	});
	this.enableFilter = false;
	this.$div.removeClass("fancytree-ext-filter fancytree-ext-filter-dimm fancytree-ext-filter-hide");
	this.render();
};


/*******************************************************************************
 * Extension code
 */
$.ui.fancytree.registerExtension({
	name: "filter",
	version: "0.0.2",
	// Default options for this extension.
	options: {
		mode: "dimm",
		leavesOnly: false,
		keepChildren: false
	},
	// Override virtual methods for this extension.
	// `this`       : is this extension object
	// `this._base` : the Fancytree instance
	// `this._super`: the virtual function that was overriden (member of prev. extension or Fancytree)
	treeInit: function(ctx){
		this._super(ctx);
		// ctx.tree.filter = false;
	},
	treeDestroy: function(ctx){
		this._super(ctx);
	},
	nodeRenderStatus: function(ctx) {
		// Set classes for current status
		var res,
			node = ctx.node,
			tree = ctx.tree,
			$span = $(node[tree.statusClassPropName]);

		res = this._super(ctx);

		if(!$span.length){
			return res; // nothing to do, if node was not yet rendered
		}
		if(!tree.enableFilter){
			return res;
		}
		$span.toggleClass("fancytree-match", !!node.match);
		$span.toggleClass("fancytree-submatch", !!node.subMatch);
		$span.toggleClass("fancytree-submatch", !!node.childSubMatch);
		$span.toggleClass("fancytree-hide", !!node.hide);

		// if(opts.filter.mode === "hide"){
		// 	// visible = !!(node.match || node.subMatch);
		// 	visible = !node.hide;
		// 	node.debug(node.title + ": visible=" + visible);
		// 	if( node.li ) {
		// 		$(node.li).toggle(visible);
		// 	} else if( node.tr ) {
		// 		// Show/hide all rows that are structural descendants of `parent`
		// 		$(node.tr).toggle(visible);
		// 		// if( !visible ) {
		// 		// 	setChildRowVisibility(node, visible);
		// 		// }
		// 	}
		// }
		return res;
	}
});
}(jQuery, window, document));
