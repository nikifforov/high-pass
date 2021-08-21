/**
 * Applies the :focus-visible polyfill at the given scope.
 * A scope in this case is either the top-level Document or a Shadow Root.
 *
 * @param {(Document|ShadowRoot)} scope
 * @see https://github.com/WICG/focus-visible
 */
 function applyFocusVisiblePolyfill(scope) {
  var hadKeyboardEvent = true;
  var hadFocusVisibleRecently = false;
  var hadFocusVisibleRecentlyTimeout = null;

  var inputTypesAllowlist = {
    text: true,
    search: true,
    url: true,
    tel: true,
    email: true,
    password: true,
    number: true,
    date: true,
    month: true,
    week: true,
    time: true,
    datetime: true,
    'datetime-local': true
  };

  /**
   * Helper function for legacy browsers and iframes which sometimes focus
   * elements like document, body, and non-interactive SVG.
   * @param {Element} el
   */
  function isValidFocusTarget(el) {
    if (
      el &&
      el !== document &&
      el.nodeName !== 'HTML' &&
      el.nodeName !== 'BODY' &&
      'classList' in el &&
      'contains' in el.classList
    ) {
      return true;
    }
    return false;
  }

  /**
   * Computes whether the given element should automatically trigger the
   * `focus-visible` class being added, i.e. whether it should always match
   * `:focus-visible` when focused.
   * @param {Element} el
   * @return {boolean}
   */
  function focusTriggersKeyboardModality(el) {
    var type = el.type;
    var tagName = el.tagName;

    if (tagName === 'INPUT' && inputTypesAllowlist[type] && !el.readOnly) {
      return true;
    }

    if (tagName === 'TEXTAREA' && !el.readOnly) {
      return true;
    }

    if (el.isContentEditable) {
      return true;
    }

    return false;
  }

  /**
   * Add the `focus-visible` class to the given element if it was not added by
   * the author.
   * @param {Element} el
   */
  function addFocusVisibleClass(el) {
    if (el.classList.contains('focus-visible')) {
      return;
    }
    el.classList.add('focus-visible');
    el.setAttribute('data-focus-visible-added', '');
  }

  /**
   * Remove the `focus-visible` class from the given element if it was not
   * originally added by the author.
   * @param {Element} el
   */
  function removeFocusVisibleClass(el) {
    if (!el.hasAttribute('data-focus-visible-added')) {
      return;
    }
    el.classList.remove('focus-visible');
    el.removeAttribute('data-focus-visible-added');
  }

  /**
   * If the most recent user interaction was via the keyboard;
   * and the key press did not include a meta, alt/option, or control key;
   * then the modality is keyboard. Otherwise, the modality is not keyboard.
   * Apply `focus-visible` to any current active element and keep track
   * of our keyboard modality state with `hadKeyboardEvent`.
   * @param {KeyboardEvent} e
   */
  function onKeyDown(e) {
    if (e.metaKey || e.altKey || e.ctrlKey) {
      return;
    }

    if (isValidFocusTarget(scope.activeElement)) {
      addFocusVisibleClass(scope.activeElement);
    }

    hadKeyboardEvent = true;
  }

  /**
   * If at any point a user clicks with a pointing device, ensure that we change
   * the modality away from keyboard.
   * This avoids the situation where a user presses a key on an already focused
   * element, and then clicks on a different element, focusing it with a
   * pointing device, while we still think we're in keyboard modality.
   * @param {Event} e
   */
  function onPointerDown(e) {
    hadKeyboardEvent = false;
  }

  /**
   * On `focus`, add the `focus-visible` class to the target if:
   * - the target received focus as a result of keyboard navigation, or
   * - the event target is an element that will likely require interaction
   *   via the keyboard (e.g. a text box)
   * @param {Event} e
   */
  function onFocus(e) {
    // Prevent IE from focusing the document or HTML element.
    if (!isValidFocusTarget(e.target)) {
      return;
    }

    if (hadKeyboardEvent || focusTriggersKeyboardModality(e.target)) {
      addFocusVisibleClass(e.target);
    }
  }

  /**
   * On `blur`, remove the `focus-visible` class from the target.
   * @param {Event} e
   */
  function onBlur(e) {
    if (!isValidFocusTarget(e.target)) {
      return;
    }

    if (
      e.target.classList.contains('focus-visible') ||
      e.target.hasAttribute('data-focus-visible-added')
    ) {
      // To detect a tab/window switch, we look for a blur event followed
      // rapidly by a visibility change.
      // If we don't see a visibility change within 100ms, it's probably a
      // regular focus change.
      hadFocusVisibleRecently = true;
      window.clearTimeout(hadFocusVisibleRecentlyTimeout);
      hadFocusVisibleRecentlyTimeout = window.setTimeout(function() {
        hadFocusVisibleRecently = false;
      }, 100);
      removeFocusVisibleClass(e.target);
    }
  }

  /**
   * If the user changes tabs, keep track of whether or not the previously
   * focused element had .focus-visible.
   * @param {Event} e
   */
  function onVisibilityChange(e) {
    if (document.visibilityState === 'hidden') {
      // If the tab becomes active again, the browser will handle calling focus
      // on the element (Safari actually calls it twice).
      // If this tab change caused a blur on an element with focus-visible,
      // re-apply the class when the user switches back to the tab.
      if (hadFocusVisibleRecently) {
        hadKeyboardEvent = true;
      }
      addInitialPointerMoveListeners();
    }
  }

  /**
   * Add a group of listeners to detect usage of any pointing devices.
   * These listeners will be added when the polyfill first loads, and anytime
   * the window is blurred, so that they are active when the window regains
   * focus.
   */
  function addInitialPointerMoveListeners() {
    document.addEventListener('mousemove', onInitialPointerMove);
    document.addEventListener('mousedown', onInitialPointerMove);
    document.addEventListener('mouseup', onInitialPointerMove);
    document.addEventListener('pointermove', onInitialPointerMove);
    document.addEventListener('pointerdown', onInitialPointerMove);
    document.addEventListener('pointerup', onInitialPointerMove);
    document.addEventListener('touchmove', onInitialPointerMove);
    document.addEventListener('touchstart', onInitialPointerMove);
    document.addEventListener('touchend', onInitialPointerMove);
  }

  function removeInitialPointerMoveListeners() {
    document.removeEventListener('mousemove', onInitialPointerMove);
    document.removeEventListener('mousedown', onInitialPointerMove);
    document.removeEventListener('mouseup', onInitialPointerMove);
    document.removeEventListener('pointermove', onInitialPointerMove);
    document.removeEventListener('pointerdown', onInitialPointerMove);
    document.removeEventListener('pointerup', onInitialPointerMove);
    document.removeEventListener('touchmove', onInitialPointerMove);
    document.removeEventListener('touchstart', onInitialPointerMove);
    document.removeEventListener('touchend', onInitialPointerMove);
  }

  /**
   * When the polfyill first loads, assume the user is in keyboard modality.
   * If any event is received from a pointing device (e.g. mouse, pointer,
   * touch), turn off keyboard modality.
   * This accounts for situations where focus enters the page from the URL bar.
   * @param {Event} e
   */
  function onInitialPointerMove(e) {
    // Work around a Safari quirk that fires a mousemove on <html> whenever the
    // window blurs, even if you're tabbing out of the page. ¯\_(ツ)_/¯
    if (e.target.nodeName && e.target.nodeName.toLowerCase() === 'html') {
      return;
    }

    hadKeyboardEvent = false;
    removeInitialPointerMoveListeners();
  }

  // For some kinds of state, we are interested in changes at the global scope
  // only. For example, global pointer input, global key presses and global
  // visibility change should affect the state at every scope:
  document.addEventListener('keydown', onKeyDown, true);
  document.addEventListener('mousedown', onPointerDown, true);
  document.addEventListener('pointerdown', onPointerDown, true);
  document.addEventListener('touchstart', onPointerDown, true);
  document.addEventListener('visibilitychange', onVisibilityChange, true);

  addInitialPointerMoveListeners();

  // For focus and blur, we specifically care about state changes in the local
  // scope. This is because focus / blur events that originate from within a
  // shadow root are not re-dispatched from the host element if it was already
  // the active element in its own scope:
  scope.addEventListener('focus', onFocus, true);
  scope.addEventListener('blur', onBlur, true);

  // We detect that a node is a ShadowRoot by ensuring that it is a
  // DocumentFragment and also has a host property. This check covers native
  // implementation and polyfill implementation transparently. If we only cared
  // about the native implementation, we could just check if the scope was
  // an instance of a ShadowRoot.
  if (scope.nodeType === Node.DOCUMENT_FRAGMENT_NODE && scope.host) {
    // Since a ShadowRoot is a special kind of DocumentFragment, it does not
    // have a root element to add a class to. So, we add this attribute to the
    // host element instead:
    scope.host.setAttribute('data-js-focus-visible', '');
  } else if (scope.nodeType === Node.DOCUMENT_NODE) {
    document.documentElement.classList.add('js-focus-visible');
    document.documentElement.setAttribute('data-js-focus-visible', '');
  }
}

// It is important to wrap all references to global window and document in
// these checks to support server-side rendering use cases
// @see https://github.com/WICG/focus-visible/issues/199
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  // Make the polyfill helper globally available. This can be used as a signal
  // to interested libraries that wish to coordinate with the polyfill for e.g.,
  // applying the polyfill to a shadow root:
  window.applyFocusVisiblePolyfill = applyFocusVisiblePolyfill;

  // Notify interested libraries of the polyfill's presence, in case the
  // polyfill was loaded lazily:
  var event;

  try {
    event = new CustomEvent('focus-visible-polyfill-ready');
  } catch (error) {
    // IE11 does not support using CustomEvent as a constructor directly:
    event = document.createEvent('CustomEvent');
    event.initCustomEvent('focus-visible-polyfill-ready', false, false, {});
  }

  window.dispatchEvent(event);
}

if (typeof document !== 'undefined') {
  // Apply the polyfill to the global document, so that no JavaScript
  // coordination is required to use the polyfill in the top-level document:
  applyFocusVisiblePolyfill(document);
}
"use strict";function _defineProperty(e,t,i){return t in e?Object.defineProperty(e,t,{value:i,enumerable:!0,configurable:!0,writable:!0}):e[t]=i,e}var _typeof="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e};!function(){for(var e=["DocumentType","Element","CharacterData"],t=function(){null!=this.parentNode&&this.parentNode.removeChild(this)},i=0;i<e.length;i++){var r=e[i];window[r]&&!window[r].prototype.remove&&(window[r].prototype.remove=t)}}(),function(e){function t(){}function i(e,t){return function(){e.apply(t,arguments)}}function r(e){if("object"!==_typeof(this))throw new TypeError("Promises must be constructed via new");if("function"!=typeof e)throw new TypeError("not a function");this._state=0,this._handled=!1,this._value=void 0,this._deferreds=[],u(e,this)}function n(e,t){for(;3===e._state;)e=e._value;return 0===e._state?void e._deferreds.push(t):(e._handled=!0,void r._immediateFn(function(){var i=1===e._state?t.onFulfilled:t.onRejected;if(null===i)return void(1===e._state?o:s)(t.promise,e._value);var r;try{r=i(e._value)}catch(n){return void s(t.promise,n)}o(t.promise,r)}))}function o(e,t){try{if(t===e)throw new TypeError("A promise cannot be resolved with itself.");if(t&&("object"===("undefined"==typeof t?"undefined":_typeof(t))||"function"==typeof t)){var n=t.then;if(t instanceof r)return e._state=3,e._value=t,void a(e);if("function"==typeof n)return void u(i(n,t),e)}e._state=1,e._value=t,a(e)}catch(o){s(e,o)}}function s(e,t){e._state=2,e._value=t,a(e)}function a(e){2===e._state&&0===e._deferreds.length&&r._immediateFn(function(){e._handled||r._unhandledRejectionFn(e._value)});for(var t=0,i=e._deferreds.length;t<i;t++)n(e,e._deferreds[t]);e._deferreds=null}function l(e,t,i){this.onFulfilled="function"==typeof e?e:null,this.onRejected="function"==typeof t?t:null,this.promise=i}function u(e,t){var i=!1;try{e(function(e){i||(i=!0,o(t,e))},function(e){i||(i=!0,s(t,e))})}catch(r){if(i)return;i=!0,s(t,r)}}var d=setTimeout;r.prototype["catch"]=function(e){return this.then(null,e)},r.prototype.then=function(e,i){var r=new this.constructor(t);return n(this,new l(e,i,r)),r},r.all=function(e){var t=Array.prototype.slice.call(e);return new r(function(e,i){function r(o,s){try{if(s&&("object"===("undefined"==typeof s?"undefined":_typeof(s))||"function"==typeof s)){var a=s.then;if("function"==typeof a)return void a.call(s,function(e){r(o,e)},i)}t[o]=s,0===--n&&e(t)}catch(l){i(l)}}if(0===t.length)return e([]);for(var n=t.length,o=0;o<t.length;o++)r(o,t[o])})},r.resolve=function(e){return e&&"object"===("undefined"==typeof e?"undefined":_typeof(e))&&e.constructor===r?e:new r(function(t){t(e)})},r.reject=function(e){return new r(function(t,i){i(e)})},r.race=function(e){return new r(function(t,i){for(var r=0,n=e.length;r<n;r++)e[r].then(t,i)})},r._immediateFn="function"==typeof setImmediate&&function(e){setImmediate(e)}||function(e){d(e,0)},r._unhandledRejectionFn=function(e){"undefined"!=typeof console&&console&&console.warn("Possible Unhandled Promise Rejection:",e)},r._setImmediateFn=function(e){r._immediateFn=e},r._setUnhandledRejectionFn=function(e){r._unhandledRejectionFn=e},"undefined"!=typeof module&&module.exports?module.exports=r:e.Promise||(e.Promise=r)}(window),function(e){e.Promise||(e.Promise=Promise);var t="required",i="email",r="minLength",n="maxLength",o="password",s="zip",a="phone",l="remote",u="strength",d="function",c=function(e,t){if("string"==typeof e)return e;var i="post"===t.toLowerCase()?"":"?";return Array.isArray(e)?i+e.map(function(e){return e.name+"="+e.value}).join("&"):i+Object.keys(e).map(function(t){return t+"="+e[t]}).join("&")},h=function(e){var t=e.url,i=e.method,r=e.data,n=e.debug,o=e.callback,s=e.error;if(n)return void o("test");var a=e.async!==!1,l=new XMLHttpRequest,u=c(r,"get"),d=null;"post"===i.toLowerCase()&&(d=c(r,"post"),u=""),l.open(i,t+u,a),l.setRequestHeader("Content-Type","application/x-www-form-urlencoded"),l.onreadystatechange=function(){4===this.readyState&&(200===this.status?o(this.responseText):s&&s(this.responseText))},l.send(d)},f=function(e,t){this.options=t||{},this.rules=this.options.rules||{},this.messages=this.options.messages||void 0,this.colorWrong=this.options.colorWrong||"#F06666",this.result={},this.elements=[],this.tooltip=this.options.tooltip||{},this.tooltipFadeOutTime=this.tooltip.fadeOutTime||5e3,this.tooltipFadeOutClass=this.tooltip.fadeOutClass||"just-validate-tooltip-hide",this.tooltipSelectorWrap=document.querySelectorAll(this.tooltip.selectorWrap).length?document.querySelectorAll(this.tooltip.selectorWrap):document.querySelectorAll(".just-validate-tooltip-container"),this.bindHandlerKeyup=this.handlerKeyup.bind(this),this.submitHandler=this.options.submitHandler||void 0,this.invalidFormCallback=this.options.invalidFormCallback||void 0,this.promisesRemote=[],this.isValidationSuccess=!1,this.focusWrongField=this.options.focusWrongField||!1,this.REGEXP={email:/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,zip:/^\d{5}(-\d{4})?$/,phone:/^([0-9]( |-)?)?(\(?[0-9]{3}\)?|[0-9]{3})( |-)?([0-9]{3}( |-)?[0-9]{4}|[a-zA-Z0-9]{7})$/,password:/[^\w\d]*(([0-9]+.*[A-Za-z]+.*)|[A-Za-z]+.*([0-9]+.*))/,strengthPass:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]/},this.DEFAULT_REMOTE_ERROR="Error",this.state={tooltipsTimer:null},this.setForm(document.querySelector(e))};f.prototype={defaultRules:{email:{required:!0,email:!0},name:{required:!0,minLength:3,maxLength:15},text:{required:!0,maxLength:300,minLength:5},password:{required:!0,password:!0,minLength:4,maxLength:8},zip:{required:!0,zip:!0},phone:{phone:!0}},defaultMessages:{required:"The field is required",email:"Please, type a valid email",maxLength:"The field must contain a maximum of :value characters",minLength:"The field must contain a minimum of :value characters",password:"Password is not valid",remote:"Email already exists",strength:"Password must contents at least one uppercase letter, one lowercase letter and one number","function":"Function returned false"},handlerKeyup:function(e){var t=e.target,i={name:t.getAttribute("data-validate-field"),value:t.value};delete this.result[i.name],this.validateItem({name:i.name,value:i.value,group:[],isKeyupChange:!0}),this.renderErrors()},setterEventListener:function(e,t,i,r){switch("keyup"===t&&(i=this.bindHandlerKeyup),r){case"add":e.addEventListener(t,i);break;case"remove":e.removeEventListener(t,i)}},getElementsRealValue:function(){for(var e=this.$form.querySelectorAll("*"),t=void 0,i={},r=0,n=e.length;r<n;++r)if(t=e[r].getAttribute("name")){if("checkbox"===e[r].type){i[t]=e[r].checked;continue}i[t]=e[r].value}return i},validationFailed:function(){this.invalidFormCallback&&this.invalidFormCallback(this.result);var e=document.querySelector(".js-validate-error-field");this.focusWrongField&&e&&e.focus&&e.focus()},validationSuccess:function(){if(0===Object.keys(this.result).length){if(this.isValidationSuccess=!1,this.submitHandler){var e=this.getElementsRealValue();return void this.submitHandler(this.$form,e,h)}this.$form.submit()}},setForm:function(e){var t=this;this.$form=e,this.$form.setAttribute("novalidate","novalidate"),this.$form.addEventListener("submit",function(e){return e.preventDefault(),t.result=[],t.getElements(),t.promisesRemote.length?void Promise.all(t.promisesRemote).then(function(){t.promisesRemote=[],t.isValidationSuccess?t.validationSuccess():t.validationFailed()}):void(t.isValidationSuccess?t.validationSuccess():t.validationFailed())})},isEmail:function(e){return this.REGEXP.email.test(e)},isZip:function(e){return this.REGEXP.zip.test(e)},isPhone:function(e){return this.REGEXP.phone.test(e)},isPassword:function(e){return this.REGEXP.password.test(e)},isEmpty:function(e){var t=e;return e.trim&&(t=e.trim()),!t},checkLengthMax:function(e,t){return e.length<=t},checkLengthMin:function(e,t){return e.length>=t},checkStrengthPass:function(e){return this.REGEXP.strengthPass.test(e)},getElements:function(){var e=this,t=this.$form.querySelectorAll("[data-validate-field]");this.elements=[];for(var i=function(i,r){var n=t[i],o=n.getAttribute("data-validate-field"),s=n.value,a=!1,l=[];if("checkbox"===n.type&&(s=n.checked||"",n.addEventListener("change",function(t){var i=t.target,r={name:i.getAttribute("data-validate-field"),value:i.checked};delete e.result[r.name],e.validateItem({name:r.name,value:r.value,group:[]}),e.renderErrors()})),"radio"===n.type){var u=e.elements.filter(function(e){if(e.name===o)return e})[0];u?(u.group.push(n.checked),a=!0):l.push(n.checked),n.addEventListener("change",function(t){var i=t.target,r={name:i.getAttribute("data-validate-field"),value:i.checked};delete e.result[r.name],e.validateItem({name:r.name,value:r.value,group:[]}),e.renderErrors()})}e.setterEventListener(n,"keyup",e.handlerKeyup,"add"),a||e.elements.push({name:o,value:s,group:l})},r=0,n=t.length;r<n;++r)i(r,n);this.validateElements()},validateRequired:function(e){return!this.isEmpty(e)},validateEmail:function(e){return this.isEmail(e)},validatePhone:function(e){return this.isPhone(e)},validateMinLength:function(e,t){return this.checkLengthMin(e,t)},validateMaxLength:function(e,t){return this.checkLengthMax(e,t)},validateStrengthPass:function(e){return this.checkStrengthPass(e)},validatePassword:function(e){return this.isPassword(e)},validateZip:function(e){return this.isZip(e)},validateRemote:function(e){var t=e.value,i=e.name,r=e.url,n=e.successAnswer,o=e.sendParam,s=e.method;return new Promise(function(e){h({url:r,method:s,data:_defineProperty({},o,t),async:!0,callback:function(t){t.toLowerCase()===n.toLowerCase()&&e("ok"),e({type:"incorrect",name:i})},error:function(){e({type:"error",name:i})}})})},generateMessage:function(e,t,i){var r=this.messages||this.defaultMessages,n=r[t]&&r[t][e]||this.messages&&"string"==typeof this.messages[t]&&r[t]||this.defaultMessages[e]||this.DEFAULT_REMOTE_ERROR;i&&(n=n.replace(":value",i.toString())),this.result[t]={message:n}},validateElements:function(){var e=this;return this.lockForm(),this.elements.forEach(function(t){e.validateItem({name:t.name,value:t.value,group:t.group})}),this.promisesRemote.length?void Promise.all(this.promisesRemote).then(function(t){t.forEach(function(t){return"ok"===t?void e.renderErrors():("error"===t.type&&alert("Server error occured. Please try later."),e.generateMessage(l,t.name),void e.renderErrors())})}):void this.renderErrors()},validateItem:function(e){var c=this,h=e.name,f=e.group,m=e.value,v=e.isKeyupChange,p=this.rules[h]||this.defaultRules[h]||!1;if(p)for(var g in p){var y=p[g];if(g!==t&&g!==d&&""==m)return;switch(g){case d:if("function"!=typeof y)break;if(y(h,m))break;return void this.generateMessage(d,h,y);case t:if(!y)break;if(f.length){var b=!1;if(f.forEach(function(e){c.validateRequired(e)&&(b=!0)}),b)break}else if(this.validateRequired(m))break;return void this.generateMessage(t,h);case i:if(!y)break;if(this.validateEmail(m))break;return void this.generateMessage(i,h);case r:if(!y)break;if(this.validateMinLength(m,y))break;return void this.generateMessage(r,h,y);case n:if(!y)break;if(this.validateMaxLength(m,y))break;return void this.generateMessage(n,h,y);case a:if(!y)break;if(this.validatePhone(m))break;return void this.generateMessage(a,h);case o:if(!y)break;if(this.validatePassword(m))break;return void this.generateMessage(o,h);case u:if(!y||"object"!==("undefined"==typeof y?"undefined":_typeof(y)))break;if(y["default"]&&this.validateStrengthPass(m))break;if(y.custom){var E=void 0;try{E=new RegExp(y.custom)}catch(w){E=this.REGEXP.strengthPass,console.error("Custom regexp for strength rule is not valid. Default regexp was used.")}if(E.test(m))break}return void this.generateMessage(u,h);case s:if(!y)break;if(this.validateZip(m))break;return void this.generateMessage(s,h);case l:if(v)break;if(!y)break;var k=y.url,_=y.successAnswer,P=y.method,R=y.sendParam,S=this.$form.querySelector('input[data-validate-field="'+h+'"]');return this.setterEventListener(S,"keyup",this.handlerKeyup,"remove"),void this.promisesRemote.push(this.validateRemote({name:h,value:m,url:k,method:P,sendParam:R,successAnswer:_}))}}},clearErrors:function(){for(var e=document.querySelectorAll(".js-validate-error-label"),t=0,i=e.length;t<i;++t)e[t].remove();e=document.querySelectorAll(".js-validate-error-field");for(var r=0,n=e.length;r<n;++r)e[r].classList.remove("js-validate-error-field"),e[r].style.border="",e[r].style.color=""},renderErrors:function(){var e=this;if(this.clearErrors(),this.unlockForm(),this.isValidationSuccess=!1,0===Object.keys(this.result).length)return void(this.isValidationSuccess=!0);for(var t in this.result){var i=this.result[t].message,r=this.$form.querySelectorAll('[data-validate-field="'+t+'"]'),n=r[r.length-1],o=document.createElement("div");if(o.innerHTML=i,o.className="js-validate-error-label",o.setAttribute("style","color: "+this.colorWrong),n.style.border="1px solid "+this.colorWrong,n.style.color=""+this.colorWrong,n.classList.add("js-validate-error-field"),"checkbox"===n.type||"radio"===n.type){var s=document.querySelector('label[for="'+n.getAttribute("id")+'"]');"label"===n.parentNode.tagName.toLowerCase()?n.parentNode.parentNode.insertBefore(o,null):s?s.parentNode.insertBefore(o,s.nextSibling):n.parentNode.insertBefore(o,n.nextSibling)}else n.parentNode.insertBefore(o,n.nextSibling)}this.tooltipSelectorWrap.length&&(this.state.tooltipsTimer=setTimeout(function(){e.hideTooltips()},this.tooltipFadeOutTime))},hideTooltips:function(){var e=this,t=document.querySelectorAll(".js-validate-error-label");t.forEach(function(t){t.classList.add(e.tooltipFadeOutClass)}),this.state.tooltipsTimer=null},lockForm:function(){for(var e=this.$form.querySelectorAll("input, textarea, button, select"),t=0,i=e.length;t<i;++t)e[t].setAttribute("disabled","disabled"),e[t].style.pointerEvents="none",e[t].style.webitFilter="grayscale(100%)",e[t].style.filter="grayscale(100%)"},unlockForm:function(){for(var e=this.$form.querySelectorAll("input, textarea, button, select"),t=0,i=e.length;t<i;++t)e[t].removeAttribute("disabled"),e[t].style.pointerEvents="",e[t].style.webitFilter="",e[t].style.filter=""}},e.JustValidate=f}(window);