/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var each = require('../lib/each');
var invariant = require('invariant');
var Immutable = require('immutable');
var ObjectOrientedStore = require('./ObjectOrientedStore.es6');

/**
 * A Flux Store which is strict on Immutability
 */
class ImmutableStore extends ObjectOrientedStore {

	/**
	 * Returns true if item is an immutable OR a primitive val
	 *
	 * @param {...} item
	 * @return {boolean}
	 */
	static checkImmutable (item) {
		return item instanceof Immutable.Iterable || !(item instanceof Object);
	}

    /**
	 * @param {object} options
	 * @param {function} options.init - this fn should set up initial state and
	 *	also be used to call `bindActions`
	 * @param {object} [options.private] - object of private functions, usually
	 *	modifiers. Not every store will need this!
	 * @param {object} options.public - object of public functions, usually
	 *	accessors
	 * @param {string} options.displayName - a human readable name, used for
	 *	debugging
	 */
	constructor (options) {
		invariant(
			options,
			'Cannot create FluxThis Stores without arguments'
		);

		// Wrap methods with immutability checkers before creating the OOStore
		var parentOptions = {
			displayName: options.displayName,
			init: null,
			public: {},
			private: options.private
		};


		if (options.init) {
			parentOptions.init = initOverride(options);
		}

		if (options.public) {
			each(options.public, (key, fn) => {
				parentOptions.public[key] = publicOverride(key, fn);
			});
		}

		super(parentOptions);
	}

	toString () {
		return `[ImmutableStore ${this.displayName}]`;
	}
}

/**
 * Returns a wrapper initialize method to impose Immutable
 * restrictions on the Store.
 *
 * @param {object} options
 * @returns {Function}
 */
function initOverride(options) {
	return function () {
		options.init.call(this);

		each(this, (key, member) => {
			invariant(
				ImmutableStore.checkImmutable(member),
				'non-immutable, non-primitive `%s` was added to an ' +
				'ImmutableStore during `init`',
				key
			);
		});
	};
}

/**
 * Returns a wrapper public method to impose Immutable
 * restrictions on the Store.
 *
 * @param {string} key
 * @param {Function} fn
 * @returns {Function}
 */
function publicOverride(key, fn) {
	return function () {
		var result = fn.apply(this, arguments);

		invariant(
			ImmutableStore.checkImmutable(result),
			'public method `%s` attempted to return a ' +
			'non-immutable, non-primitive value. All accessors ' +
			'must return immutable or primitive values to ' +
			'prevent errors from mutation of objects',
			key
		);

		return result;
	};
}
ImmutableStore.Immutable = Immutable;

export default ImmutableStore;
