'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _keymirror = require('keymirror');

var _keymirror2 = _interopRequireDefault(_keymirror);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _jsonp = require('jsonp');

var _jsonp2 = _interopRequireDefault(_jsonp);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _PlayButton = require('./Play-Button');

var _PlayButton2 = _interopRequireDefault(_PlayButton);

var _Spinner = require('./Spinner');

var _Spinner2 = _interopRequireDefault(_Spinner);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var debug = (0, _debug2.default)('vimeo:player');
var noop = function noop() {};
var playerEvents = (0, _keymirror2.default)({
  cueChange: null,
  ended: null,
  loaded: null,
  pause: null,
  play: null,
  progress: null,
  seeked: null,
  textTrackChange: null,
  timeUpdate: null,
  volumeChange: null
});

var defaults = Object.keys(playerEvents).concat(['ready']).reduce(function (defaults, event) {
  defaults['on' + capitalize(event)] = noop;
  return defaults;
}, {});
defaults.className = 'vimeo';
defaults.playerOptions = { autoplay: 1 };
defaults.autoplay = false;

function capitalize() {
  var str = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';

  return str.charAt(0).toUpperCase() + str.substring(1);
}

function getFuncForEvent(event, props) {
  return props['on' + capitalize(event)] || function () {};
}

function post(method, value, player, playerOrigin) {
  try {
    player.contentWindow.postMessage({ method: method, value: value }, playerOrigin);
  } catch (err) {
    return err;
  }
  return null;
}

var Vimeo = function (_Component) {
  _inherits(Vimeo, _Component);

  function Vimeo(props) {
    _classCallCheck(this, Vimeo);

    var _this = _possibleConstructorReturn(this, (Vimeo.__proto__ || Object.getPrototypeOf(Vimeo)).call(this, props));

    _this.state = {
      imageLoaded: false,
      playerOrigin: '*',
      showingVideo: props.autoplay,
      thumb: null
    };
    _this.addMessageListener = _this.addMessageListener.bind(_this);
    _this.onError = _this.onError.bind(_this);
    _this.onMessage = _this.onMessage.bind(_this);
    _this.onReady = _this.onReady.bind(_this);
    _this.playVideo = _this.playVideo.bind(_this);
    _this.getIframeUrl = _this.getIframeUrl.bind(_this);
    _this.getIframeUrlQuery = _this.getIframeUrlQuery.bind(_this);
    _this.fetchVimeoData = _this.fetchVimeoData.bind(_this);
    _this.renderIframe = _this.renderIframe.bind(_this);
    _this.renderImage = _this.renderImage.bind(_this);
    return _this;
  }

  _createClass(Vimeo, [{
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      if (nextProps.videoId !== this.props.videoId) {
        this.setState({
          thumb: null,
          imageLoaded: false,
          showingVideo: false
        });
      }
    }
  }, {
    key: 'componentDidMount',
    value: function componentDidMount() {
      this.fetchVimeoData();
    }
  }, {
    key: 'componentDidUpdate',
    value: function componentDidUpdate() {
      this.fetchVimeoData();
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      var _context;

      var removeEventListener = typeof window !== 'undefined' ? (_context = window).removeEventListener.bind(_context) : noop;

      removeEventListener('message', this.onMessage);
    }
  }, {
    key: 'addMessageListener',
    value: function addMessageListener() {
      var _context2;

      var addEventListener = typeof window !== 'undefined' ? (_context2 = window).addEventListener.bind(_context2) : noop;

      addEventListener('message', this.onMessage);
    }
  }, {
    key: 'onError',
    value: function onError(err) {
      if (this.props.onError) {
        this.props.onError(err);
      }
      throw err;
    }
  }, {
    key: 'onMessage',
    value: function onMessage(_ref) {
      var origin = _ref.origin,
          data = _ref.data;
      var onReady = this.props.onReady;
      var playerOrigin = this.state.playerOrigin;


      if (playerOrigin === '*') {
        this.setState({
          playerOrigin: origin
        });
      }

      // Handle messages from the vimeo player only
      if (!/^https?:\/\/player.vimeo.com/.test(origin)) {
        return false;
      }

      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (err) {
          debug('error parsing message', err);
          data = { event: '' };
        }
      }

      if (data.event === 'ready') {
        var player = this.refs.player;

        debug('player ready');
        this.onReady(player, playerOrigin === '*' ? origin : playerOrigin);
        return onReady(data);
      }
      if (!data.event) {
        // we get messages when the first event callbacks are added to the frame
        return;
      }
      debug('firing event: ', data.event);
      getFuncForEvent(data.event, this.props)(data);
    }
  }, {
    key: 'onReady',
    value: function onReady(player, playerOrigin) {
      var _this2 = this;

      Object.keys(playerEvents).forEach(function (event) {
        var err = post('addEventListener', event.toLowerCase(), player, playerOrigin);
        if (err) {
          _this2.onError(err);
        }
      });
    }
  }, {
    key: 'playVideo',
    value: function playVideo(e) {
      e.preventDefault();
      this.setState({ showingVideo: true });
    }
  }, {
    key: 'getIframeUrl',
    value: function getIframeUrl() {
      var videoId = this.props.videoId;

      var query = this.getIframeUrlQuery();
      return '//player.vimeo.com/video/' + videoId + '?' + query;
    }
  }, {
    key: 'getIframeUrlQuery',
    value: function getIframeUrlQuery() {
      var _this3 = this;

      var str = [];
      Object.keys(this.props.playerOptions).forEach(function (key) {
        str.push(key + '=' + _this3.props.playerOptions[key]);
      });

      return str.join('&');
    }
  }, {
    key: 'fetchVimeoData',
    value: function fetchVimeoData() {
      var _this4 = this;

      if (this.state.imageLoaded) {
        return;
      }
      var id = this.props.videoId;

      (0, _jsonp2.default)('https://vimeo.com/api/v2/video/' + id + '.json', {
        prefix: 'vimeo'
      }, function (err, res) {
        if (err) {
          debug('jsonp err: ', err.message);
          _this4.onError(err);
        }
        debug('jsonp response', res);
        _this4.setState({
          thumb: res[0].thumbnail_large,
          imageLoaded: true
        });
      });
    }
  }, {
    key: 'renderImage',
    value: function renderImage() {
      if (this.state.showingVideo || !this.state.imageLoaded) {
        return;
      }

      var style = {
        backgroundImage: 'url(' + this.state.thumb + ')',
        display: !this.state.showingVideo ? 'block' : 'none',
        height: '100%',
        width: '100%'
      };

      var playButton = this.props.playButton ? (0, _react.cloneElement)(this.props.playButton, { onClick: this.playVideo }) : _react2.default.createElement(_PlayButton2.default, { onClick: this.playVideo });

      return _react2.default.createElement(
        'div',
        {
          className: 'vimeo-image',
          style: style },
        playButton
      );
    }
  }, {
    key: 'renderIframe',
    value: function renderIframe() {
      if (!this.state.showingVideo) {
        return;
      }

      this.addMessageListener();

      var embedVideoStyle = {
        display: this.state.showingVideo ? 'block' : 'none',
        height: '100%',
        width: '100%'
      };

      return _react2.default.createElement(
        'div',
        {
          className: 'vimeo-embed',
          style: embedVideoStyle },
        _react2.default.createElement('iframe', {
          frameBorder: '0',
          ref: 'player',
          src: this.getIframeUrl() })
      );
    }
  }, {
    key: 'renderLoading',
    value: function renderLoading(imageLoaded, loadingElement) {
      if (imageLoaded) {
        return;
      }
      if (loadingElement) {
        return loadingElement;
      }
      return _react2.default.createElement(_Spinner2.default, null);
    }
  }, {
    key: 'render',
    value: function render() {
      return _react2.default.createElement(
        'div',
        { className: this.props.className },
        this.renderLoading(this.state.imageLoaded, this.props.loading),
        this.renderImage(),
        this.renderIframe()
      );
    }
  }]);

  return Vimeo;
}(_react.Component);

exports.default = Vimeo;


Vimeo.defaultProps = defaults;

Vimeo.propTypes = {
  autoplay: _propTypes2.default.bool,
  className: _propTypes2.default.string,
  loading: _propTypes2.default.element,
  playButton: _propTypes2.default.node,
  playerOptions: _propTypes2.default.object,
  videoId: _propTypes2.default.string.isRequired,

  // event callbacks
  onCueChange: _propTypes2.default.func,
  onEnded: _propTypes2.default.func,
  onError: _propTypes2.default.func,
  onLoaded: _propTypes2.default.func,
  onPause: _propTypes2.default.func,
  onPlay: _propTypes2.default.func,
  onProgress: _propTypes2.default.func,
  onReady: _propTypes2.default.func,
  onSeeked: _propTypes2.default.func,
  onTextTrackChanged: _propTypes2.default.func,
  onTimeUpdate: _propTypes2.default.func,
  onVolumeChange: _propTypes2.default.func
};
module.exports = exports['default'];