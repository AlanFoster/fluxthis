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

var Store = require('../../src/ImmutableReducerStore.es6');
var ImmutableStore = require('../../src/ImmutableReducerStore.es6');
var Immutable = Store.Immutable;

describe('ImmutableReducerStore', function () {

  it('expose the ImmutableStore immutable constructor', function () {
    Immutable.should.eql(ImmutableStore.Immutable);
  });

  it('should throw an error when passed no arguments', function () {
    (function () {
      new Store();
    }).should.throw();
  });

  describe('during init', function () {
    var onlyOneDefaultImmutableStateError = /must provide only an Immutable `defaultState`/;

    var config;
    beforeEach(function () {
      config = {
        displayName: String(Math.random()),
        public: {},
        private: {}
      }
    });

    describe('when providing a store properties', function () {
      it('should throw an error', function () {
        config.init = function () {
        };

        (function () {
          new Store(config);
        }).should.throw(onlyOneDefaultImmutableStateError);
      });
    });

    describe('when not providing a `defaultState`', function () {
      it('should throw an error', function () {
        config.init = function () {
          this.prop = Immutable.Map();
        };

        (function () {
          new Store(config);
        }).should.throw(onlyOneDefaultImmutableStateError);
      });
    });

    describe('when providing a mutable `defaultState`', function () {
      it('should throw an error', function () {
        config.init = function () {
          this.defaultState = {};
        };

        (function () {
          new Store(config);
        }).should.throw(onlyOneDefaultImmutableStateError);
      });
    });

    describe('when attempting to set a non-immutable value', function () {
      it('should throw an error', function () {
        config.init = function () {
          this.prop = {};
        };

        (function () {
          new Store(config);
        }).should.throw(onlyOneDefaultImmutableStateError);
      });
    });

    describe('when attempting to set an immutable `defaultState`', function () {
      it('should not throw an error', function () {
        config.init = function () {
          this.defaultState = new Immutable.Map({a: 0});
        };

        (function () {
          new Store(config);
        }).should.not.throw();
      });
    });


    describe('when attempting to set a primitive value', function () {
      it('should not throw an error', function () {
        config.init = function () {
          this.defaultState = 'hi';
        };

        (function () {
          new Store(config);
        }).should.not.throw();
      });
    });

  });

  it('should throw an error if non-function set on public', function () {
    (function () {
      new Store({
        init: function() {

        },
        public: {
          foo: 'bar'
        }
      });
    }).should.throw();
  });

  it('should throw an error if non-function set on private', function () {
    (function () {
      new Store({
        init: function() {

        },
        private: {
          foo: 'bar'
        }
      });
    }).should.throw();
  });

  describe('after init', function () {
    var config;
    var privateAttribute = '1234abc';

    beforeEach(function () {
      config = {
        displayName: String(Math.random()),
        init: function () {
          this.defaultState = privateAttribute;
          this.bindActions('set_thing', this.setThing);
        },
        private: {
          setThing: function (state, thing) {
            return thing;
          }
        },
        public: {
          getThing: function () {
            return this.state;
          }
        }
      };
    });

    it('should throw an error when a reducer returns a non-immutable object', function () {
      var s = new Store(config);
      (function () {
        s.TestUtils.mockDispatch({
          type: 'set_thing',
          payload: {}
        });
      }).should.throw(/non-immutable, non-primitive state was returned/);
    });

    it('should throw an error when a reducer directly sets state', function () {
      config.private.setThing = function (state, thing) {
        this.state = thing;
        return this.state;
      };
      var s = new Store(config);
      (function () {
        s.TestUtils.mockDispatch({
          type: 'set_thing',
          payload: {}
        });
      }).should.throw(/non-immutable, non-primitive state was returned/);
    });

    describe('when an accessor returns a non-immutable', function () {
      it('should throw an error', function () {
        config.public.getBadThing = function () {
          return {};
        };
        var s = new Store(config);

        (function () {
          s.getBadThing();
        }).should.throw();
      });
    });

    describe('when an accessor returns an immutable', function () {
      it('should not throw an error', function () {
        config.public.getGoodThing = function () {
          return new Immutable.Map();
        };
        var s = new Store(config);

        (function () {
          s.getGoodThing();
        }).should.not.throw();
      });
    });
  });
});
