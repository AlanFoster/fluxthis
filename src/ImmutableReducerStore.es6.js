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

const each = require('../lib/each.es6');
const invariant = require('invariant');
const ImmutableStore = require('./ImmutableStore.es6');

class ImmutableReducerStore extends ImmutableStore {

  constructor(options) {
    const parentOptions = Object.assign({}, options);

    if (options.init) {
      parentOptions.init = function init() {
        options.init.call(this);

        const defaultState = this.defaultState;
        const keys = Object.keys(this);

        const hasOneImmutableDefaultStateProperty = (
          ImmutableStore.checkImmutable(defaultState) &&
          'defaultState' in this &&
          keys.length === 1
        );

        invariant(
          hasOneImmutableDefaultStateProperty,
          'An ImmutableReducerStore must provide only an Immutable `defaultState` property ' +
          'during `init`. Instead found the keys `%s`.',
          keys.join()
        );

        this.state = this.defaultState;
        delete this.defaultState;
      };
    }

    if (options.private) {
      each(options.private, (key, fn) => {
        parentOptions.private[key] = function privateMethod() {
          const previousState = this.state;
          const result = fn.apply(this, [previousState, ...arguments]);

          invariant(
            ImmutableStore.checkImmutable(result),
            'non-immutable, non-primitive state was returned from an' +
            'ImmutableReducerStore private method `%s`',
            key
          );

          const keys = Object.keys(this);
          invariant(
            'state' in this && keys.length === 1,
            'ImmutableReducerStore private method `%s` attempted to ' +
            'assign additional state properties `%s`. ' +
            'Instead a reducer should always return the new state.',
            key, keys.join()
          );

          invariant(
            previousState === this.state,
            'ImmutableReducerStore private method `%s` attempted to directly manipulate ' +
            'the store state. Instead return the new state',
            key
          );

          this.state = result;

          return result;
        };
      });
    }

    super(parentOptions);
  }

  toString() {
    return `[ImmutableReducerStore ${this.displayName}]`;
  }
}

export default ImmutableReducerStore;
