/* Parser.js
 * written by Colin Kuebler 2012
 * Part of LDT, dual licensed under GPLv3 and MIT
 * Generates a tokenizer from regular expressions for TextareaDecorator
 */

function Parser( rules, i ){
	/* INIT */
	var api = this;

	// variables used internally
	var i = i ? 'i' : '';
	var parseRE = null;

	api.add = function( rules ){
		var ruleSrc = [];
		for( var rule in rules ){
			var s = rules[rule].source;
			ruleSrc.push( '(?<' + rule + '>' + s + ')' ); // Named group
		}
		parseRE = new RegExp( ruleSrc.join('|'), 'g'+i );
	};

	api.findRule = function(match){
		for (let r in match.groups) { // Find named group that matched something
			const m = match.groups[r];
			if (m != undefined) {
				return [m, r];
			}
		} // Should always return as every character must be part of a token.
	},

	api.tokenize = function(input){
		let match;
		let result = [];
		while ((match = parseRE.exec(input)) !== null) {
			result.push( api.findRule(match) );
		}
		return result;
	};

	api.add( rules );

	return api;
};

