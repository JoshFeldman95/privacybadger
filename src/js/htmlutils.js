/*
 * This file is part of Privacy Badger <https://www.eff.org/privacybadger>
 * Copyright (C) 2014 Electronic Frontier Foundation
 *
 * Privacy Badger is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as
 * published by the Free Software Foundation.
 *
 * Privacy Badger is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Privacy Badger.  If not, see <http://www.gnu.org/licenses/>.
 */

require.scopes.htmlutils = (function() {

const i18n = chrome.i18n;
const constants = require("constants");

const UNDO_ARROW_TOOLTIP_TEXT = i18n.getMessage('feed_the_badger_title');

var exports = {};
var htmlUtils = exports.htmlUtils = {

  // Tooltipster config for domain list tooltips
  DOMAIN_TOOLTIP_CONF: {
    delay: 100,
    side: 'bottom',

    // allow per-instance option overriding
    functionInit: function (instance, helper) {
      let dataOptions = helper.origin.dataset.tooltipster;

      if (dataOptions) {
        try {
          dataOptions = JSON.parse(dataOptions);
        } catch (e) {
          console.error(e);
        }

        for (let name in dataOptions) {
          instance.option(name, dataOptions[name]);
        }
      }
    },
  },

  /**
   * Determines if radio input is checked based on origin's action.
   *
   * @param {String} inputAction Action of current radio input.
   * @param {String} originAction Action of current origin.
   * @returns {String} 'checked' if both actions match otherwise empty string.
   */
  isChecked: function(inputAction, originAction) {
    if ((originAction == constants.NO_TRACKING) || (originAction == constants.DNT)) {
      originAction = constants.ALLOW;
    }
    return (inputAction === originAction) ? 'checked' : '';
  },

  /**
   * Gets localized description for given action and origin.
   *
   * @param {String} action The action to get description for.
   * @param {String} origin The origin to get description for.
   * @returns {String} Localized action description with origin.
   */
  getActionDescription: (function () {
    const messages = {
      block: i18n.getMessage('badger_status_block', "XXX"),
      cookieblock: i18n.getMessage('badger_status_block', "XXX"),
      noaction: i18n.getMessage('badger_status_noaction', "XXX"),
      allow: i18n.getMessage('badger_status_allow', "XXX"),
      dntTooltip: i18n.getMessage('dnt_tooltip')
    };
    return function (action, origin, is_whitelisted) {
      if (is_whitelisted) {
        return messages.dntTooltip;
      }

      const rv_action = messages[action];

      if (!rv_action) {
        return origin;
      }

      return rv_action.replace("XXX", origin);
    };
  }()),
  /**
   * Gets HTML for origin action toggle switch (block, block cookies, allow).
   *
   * @param {String} origin Origin to get toggle for.
   * @param {String} action Current action of given origin.
   * @returns {String} HTML for toggle switch.
   */
  getToggleHtml: (function () {
    let tooltips = {
      block: i18n.getMessage('domain_slider_block_tooltip'),
      cookieblock: i18n.getMessage('domain_slider_cookieblock_tooltip'),
      allow: i18n.getMessage('domain_slider_allow_tooltip')
    };
    let button_text_map= {
      'block':'Unblock',
      'cookieblock':'Block',
      'noaction':'Block'
    };
    return function (origin, action) {
      var button_text = button_text_map[action]
      if(button_text == 'Block'){
        var toggleHtml = '<button class="blockButton">'+button_text+'</button>'
      } else {
        var toggleHtml = '<button class="unblockButton">'+button_text+'</button>'
      }

      return toggleHtml;
    };
  }()),

  /**
   * Get HTML for tracker container.
   *
   * @returns {String} HTML for empty tracker container.
   */
  getTrackerContainerHtml: function() {
    var trackerHtml = '' +
      '<div id="blockedResourcesInner" class="clickerContainer">'+
        '<div id="trackers">'+
          '<table><tr>'+
            '<td><div id="blocked"></div></th>'+
            '<td><div id="notblocked"></div></th>'+
          '</table></tr>'+
        '</div>'+
        '<div id="nontrackers"></div>'+
      '</div>';
    return trackerHtml;
  },

  /**
   * Generates HTML for given origin.
   *
   * @param {String} origin Origin to get HTML for.
   * @param {String} action Action for given origin.
   * @param {Boolean} isWhitelisted Whether origin is whitelisted or not.
   * @returns {String} Origin HTML.
   */
  getOriginHtml: function(origin, owner, action, isWhitelisted) {
    action = _.escape(action);
    origin = _.escape(origin);

    // Get classes for main div.
    var classes = ['clicker'];
    if (action.indexOf('user') === 0) {
      classes.push('userset');
      action = action.substr(5);
    }
    if (action === constants.BLOCK || action === constants.COOKIEBLOCK || action === constants.ALLOW || action === constants.NO_TRACKING) {
      classes.push(action);
    }

    // If origin has been whitelisted set text for DNT.
    var whitelistedText = '';
    if (isWhitelisted) {
      whitelistedText = '' +
        '<div id="dnt-compliant">' +
        '<a target=_blank href="https://www.eff.org/privacybadger/faq#-I-am-an-online-advertising-/-tracking-company.--How-do-I-stop-Privacy-Badger-from-blocking-me">' +
        '<img src="' +
        chrome.runtime.getURL('/icons/dnt-16.png') +
        '"></a></div>';
    }

    // Construct HTML for origin.
    var actionDescription = htmlUtils.getActionDescription(action, owner, isWhitelisted);
    var originHtml = '' +

      '<div class="' + classes.join(' ') + '" data-origin="' + owner + '">' +
      '<table style="table-layout: fixed; width: 100%; hyphens:manual"><tr>'+
      '<td><div class="origin tooltip" title="' + actionDescription + '">' + whitelistedText + origin.replace('.','.&shy;') + '</div>' +
      '<div class="removeOrigin">&#10006</div></td>' +
      '<td style="text-align:center">'+htmlUtils.getToggleHtml(origin, action)+'</td>' +
      '<div class="honeybadgerPowered tooltip" title="'+ UNDO_ARROW_TOOLTIP_TEXT + '"></div>' +
      '</div>';

    return originHtml;
  },

  /**
   * Toggle the GUI blocked status of GUI element(s)
   *
   * @param {jQuery} $el Identify the jQuery element object(s) to manipulate
   * @param {String} status New status to set
   */
  toggleBlockedStatus: function ($el, status) {
    $el
      .removeClass([
        constants.BLOCK,
        constants.COOKIEBLOCK,
        constants.ALLOW,
        constants.NO_TRACKING
      ].join(" "))
      .addClass(status)
      .addClass("userset");
  },

  /**
   * Compare two domains, reversing them to start comparing the least
   * significant parts (TLD) first.
   *
   * @param {Array} domains The domains to sort.
   * @returns {Array} Sorted domains.
   */
  sortDomains: (domains) => {
    // optimization: cache makeSortable output by walking the array once
    // to extract the actual values used for sorting into a temporary array
    return domains.map((domain, i) => {
      return {
        index: i,
        value: htmlUtils.makeSortable(domain)
      };
    // sort the temporary array
    }).sort((a, b) => {
      if (a.value > b.value) {
        return 1;
      }
      if (a.value < b.value) {
        return -1;
      }
      return 0;
    // walk the temporary array to achieve the right order
    }).map(item => domains[item.index]);
  },

  /**
   * Reverse order of domain items to have the least exact (TLD) first.
   *
   * @param {String} domain The domain to shuffle
   * @returns {String} The 'reversed' domain
   */
  makeSortable: (domain) => {
    let base = window.getBaseDomain(domain),
      base_minus_tld = base,
      dot_index = base.indexOf('.'),
      rest_of_it_reversed = '';

    if (domain.length > base.length) {
      rest_of_it_reversed = domain
        .slice(0, domain.length - base.length - 1)
        .split('.').reverse().join('.');
    }

    if (dot_index > -1 && !window.isIPv4(domain) && !window.isIPv6(domain)) {
      base_minus_tld = base.slice(0, dot_index);
    }

    return (base_minus_tld + '.' + rest_of_it_reversed);
  },

  /**
  * Get the action class from the element
  *
  * @param elt Element
  * @returns {String} block/cookieblock/noaction
  */
  getCurrentClass: function(elt) {
    if (elt.hasClass(constants.BLOCK)) {
      return constants.BLOCK;
    } else if (elt.hasClass(constants.COOKIEBLOCK)) {
      return constants.COOKIEBLOCK;
    } else if (elt.hasClass(constants.ALLOW)) {
      return constants.ALLOW;
    } else {
      return constants.NO_TRACKING;
    }
  },

  /**
  * Get the html for the tracker and non-tracker tabs
  *
  *@returns{String} list of tabs
  */
  getTabHtml: function() {
    const tabHtml = '' +
      '<div id="tabs">'+
      '<ul>'+
      '<li><a href="#trackers">Trackers</a></li>'+
      '<li><a href="#nontrackers">Not Trackers</a></li>'+
      '</ul>'+
      '</div>';

    return tabHtml;
  },
};

return exports;

})();
