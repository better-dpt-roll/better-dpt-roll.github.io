var lastSelected;

/*
 * Utility functions
 */

/**
 * Generate a DOM node with given properties.
 */
function element(details) {
  var el = document.createElement(details.name);
  el.className = details.className || '';
  el.innerHTML = details.content || '';
  if (typeof details.children !== 'undefined') {
    details.children.forEach(function(child) {
      el.appendChild(child);
    });
  }
  return el;
}

/**
 * Left-pad a number with a single 0 if necessary
 */
function pad(i) {
  return (i.toString().length < 2 ? '0' : '') + i;
}

/**
 * Fetch info for a given key from the Wikipedia API, and insert the
 * first paragraph of the resultant extract into the given target
 * element
 *
 * FIXME this has no real error handling (e.g. page not found)
 */
function fetchInfo(key, target) {
  var defer = jQuery.ajax({
    dataType: 'jsonp',
    url: 'http://en.wikipedia.org/w/api.php'
      + '?action=query' 
      + '&format=json'
      + '&prop=extracts'
      + '&titles=' + key.replace(/ /g, '_')
  });

  defer.then(function(data, status, xhr) {
    var foo = element({
      name: 'body',
      content: data.query.pages[Object.keys(data.query.pages)[0]]
        .extract
    });

    if (foo.querySelector('p')) {
      document.querySelector(target).innerHTML =
        foo.querySelector('p').innerHTML;
    } else {
      document.querySelector(target).innerHTML = '';
    }
  });
}

/**
 * Given an "info" struct from challenges.js, populate the roll result
 * modal with the relevant HTML.
 *
 * FIXME messy; refactor
 * FIXME cache wikimedia content
 */
function loadInfo(info, el) {
  Array.prototype.forEach.call(el.childNodes, function(node) {
    el.removeChild(node);
  });

  if (typeof info.wikipedia !== 'undefined') {
    // if this is a wikipedia ref (or set of same), fetch and append
    // all
    if (!Array.isArray(info.wikipedia)) {
      info.wikipedia = [info.wikipedia];
    }

    info.wikipedia.forEach(function(wik, i) {
      var wikiInfo
        , detailsLink;

      detailsLink = element({
        name: 'a',
        className: 'details',
        content: 'Read more'
      });
      detailsLink.href = 'http://en.wikipedia.org/wiki/'
        + wik;
      
      wikiInfo = element({
        name: 'span',
        className: 'wiki-info-' + i,
        children: [
          element({
            name: 'p',
            className: 'wiki-info',
            content: 'Loading...'
          }),
          detailsLink
        ]
      });
      fetchInfo(wik, 'span.wiki-info-' + i + ' p.wiki-info');
      el.appendChild(wikiInfo);
    });
  } else {
    // if the extra info is defined within challenges.js, just append
    // it
    var detailsLink = element({
      name: 'a',
      className: 'details',
      content: 'Read more'
    });
    detailsLink.href = info.source;
    el.appendChild(element({
      name: 'span',
      content: info.text.join('<br />'),
      children: [detailsLink]
    }));
  }
}

/*
 * Primary behaviors
 */

/**
 * Take the data from challenges.js (bound to window.challenges) and
 * populate the challenge list with it.
 *
 * NB: Called on DOMContentLoaded.
 */
function renderChallenges() {
  var target = document.querySelector('#challenge-container')
    , data = window.challenges
    , challenge
    , index
    , rowHtml
    , cellHtml;

  // Set the challenge list version in the info modal
  document.querySelector('span#dpt-version')
    .innerHTML = data.version;

  // Render each challenge into a row div within #challenge-container
  for (var i = 0; i < data.challenges.length; i++) {
    challenge = data.challenges[i];
    
    rowHtml = document.createElement('div');
    rowHtml.id = 'challenge-' + i.toString();
    rowHtml.className = 'row ' + (i % 2 ? 'even' : 'odd');

    // Index cell
    rowHtml.appendChild(element({
      name: 'div',
      className: 'col-xs-1 col-sm-1 index',
      content: pad(i)
    }));

    // Challenge text cell
    var cell = {
      name: 'div',
      className: 'col-xs-11 col-sm-11 challenge',
      content: challenge.name,
      children: []
    };

    // Extra details if the challenge includes them
    ['bonus', 'note'].forEach(function(extraType) {
      if (challenge[extraType]) {
        challenge[extraType].forEach(function(bonus) {
          cell.children.push(element({
            name: 'span',
            className: 'extra',
            content: extraType + ': ' + bonus
          }));
        });
      }
    });

    // Clicking on a challenge pops it up as though rolled
    rowHtml.addEventListener('click', function(e) {
      var rowDiv = e.target;
      while (rowDiv.tagName !== 'div' && !rowDiv.className.match(/^row/)) {
        rowDiv = rowDiv.parentNode;
      }
      roll(parseInt(rowDiv.querySelector('.index').innerHTML));
    });

    // Add new nodes to DOM
    rowHtml.appendChild(element(cell));
    target.appendChild(rowHtml);
  }
}

/**
 * Roll a random challenge, or select the challenge with the given
 * number if a number is given.
 *
 * NB: Called on DOMContentLoaded if the href has a hash with a
 * challenge number (e.g. #12).
 * NB: Called when the 'roll' button is clicked.
 */
function roll(n) {
  var headerHeight = window.getComputedStyle(document.querySelector('nav'))
        .height
        .replace(/px$/, '')
    , rollModal = $('#roll-modal')
    , data
    , target
    , scrolledY;

  if (typeof n === 'undefined') {
    n = Math.floor(Math.random() * window.challenges.challenges.length);
  }
  data = window.challenges.challenges[n];

  headerHeight = parseInt(headerHeight, 10);
  
  target = document
        .querySelector('#challenge-container')
        .querySelector('#challenge-' + n.toString());
  target.classList.add('selected');

  if (typeof lastSelected !== 'undefined' && lastSelected !== target) {
    lastSelected.classList.remove('selected');
  }
  lastSelected = target;
  
  target.scrollIntoView();
  scrolledY = window.scrollY;
  if (scrolledY) {
    window.scroll(0, scrolledY - headerHeight);
  }

  rollModal.find('.modal-header span').html(pad(n));

  rollModal.find('.modal-footer a')
    .attr('href', '#' + n.toString())
    .html(window.location.href.replace(/\#.*$/, '') + '#' + n.toString());

  rollModal.find('.modal-body p.challenge')
    .html(target.querySelector('.challenge').innerHTML);

  if (typeof data.info !== 'undefined') {
    loadInfo(data.info, rollModal.find('.modal-body p.info')[0]);
  }

  rollModal.modal('show');
}

/**
 * Search 4chan's catalog for the daily programming thread.
 *
 * NB: Called when the '>>>/dpt/' button is clicked.
 */
function dpt() {
  window.location.href = 'https://boards.4chan.org/g/catalog#s=/dpt/';
}

/**
 * Bind header buttons to their behaviors (the "How to" button is
 * handled by Bootstrap).
 *
 * NB: Called on DOMContentLoaded.
 */
function bindButtons() {
  document.querySelector('button#dpt')
    .addEventListener('click', dpt);
  document.querySelector('button#roll')
    .addEventListener('click', function() { roll(); });
}

/**
 * If the window has a hash, select (roll) the challenge with the
 * given number.
 *
 * NB: Called on DOMContentLoaded.
 * FIXME: This function doesn't handle errors (e.g. a bogus hash).
 */
function setInitialRoll() {
  if (window.location.hash !== '') {
    roll(window.location.hash.replace(/^#/, ''));
  }
}

/*
 * Set up the page behaviors once it's ready to receive them
 */
document.addEventListener('DOMContentLoaded', renderChallenges);
document.addEventListener('DOMContentLoaded', bindButtons);
document.addEventListener('DOMContentLoaded', setInitialRoll);
