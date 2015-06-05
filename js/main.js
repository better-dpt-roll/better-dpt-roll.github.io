var lastSelected;

/*
 * File globals
 */
var selectors = {
  versionNumber: 'span#dpt-version',
  challenge: {
    container: 'div#challenge-container',
    table: 'div#challenge-container table',
    tbody: 'div#challenge-container table tbody'
  },
  modals: {
    roll: '#roll-modal',
    info: '#info-modal'
  },
  buttons: {
    roll: 'button#roll',
    dpt: 'button#dpt'
  }
};

/*
 * Utility functions
 */

/**
 * Generate a DOM node with given properties.
 */
function element(details) {
  var el = document.createElement(details.name);
  el.className = details.className || '';
  el.id = details.id || '';
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
    url: '//en.wikipedia.org/w/api.php'
      + '?action=query' 
      + '&format=json'
      + '&prop=extracts'
      + '&titles=' + encodeURIComponent(key.replace(/ /g, '_'))
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
  var target = document.querySelector(selectors.challenge.container)
    , data = window.challenges
    , challengeTable
    , challenge
    , index
    , row;

  // Set the challenge list version in the info modal
  document.querySelector(selectors.versionNumber)
    .innerHTML = data.version;

  // Set up the challenge container table
  target.innerHTML = '';
  target.appendChild(element({
    name: 'table',
    className: 'table table-striped table-condensed',
    children: [
      element({
        name: 'thead',
        children: [
          element({name: 'tr',
                   className: 'row',
                   children: [
                     element({name: 'th',
                              className: 'col-xs-1',
                              content: ''}),
                     element({name: 'th',
                              className: 'col-xs-1',
                              content: 'Difficulty'}),
                     element({name: 'th',
                              className: 'col-xs-10',
                              content: 'Challenge'})
                   ]})
        ]
      }),
      element({name: 'tbody'})
    ]
  }));
  challengeTable = document.querySelector(selectors.challenge.tbody);

  // Populate challenge data into the table
  for (var i = 0; i < data.challenges.length; i++) {
    challenge = data.challenges[i];

    row = element({
      name: 'tr',
      className: 'row',
      id: 'challenge-' + i.toString(),
      children: [
        element({
          name: 'td',
          className: 'index',
          content: pad(i)
        }),
        element({
          name: 'td',
          className: 'difficulty',
          content: challenge.difficulty
        }),
        element({
          name: 'td',
          className: 'challenge',
          content: challenge.name,
          children: []
        })
      ]
    });

    ['bonus', 'note'].forEach(function(extraType) {
      if (challenge[extraType]) {
        challenge[extraType].forEach(function(bonus) {
          row.querySelector('td:last-child')
            .appendChild(element({
              name: 'span',
              className: 'extra',
              content: extraType + ': ' + bonus
            }));
        });
      }
    });

    challengeTable.appendChild(row);
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
    , scrolledY
    , infoContainer;

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

  rollModal.find('.modal-header span')
    .html(pad(n)
          + ' '
          + '('
          + target.querySelector('.difficulty').innerHTML
          + ')');

  rollModal.find('.modal-footer a')
    .attr('href', '#' + n.toString())
    .html(window.location.href.replace(/\#.*$/, '') + '#' + n.toString());

  rollModal.find('.modal-body p.challenge')
    .html(target.querySelector('.challenge').innerHTML);

  infoContainer = rollModal.find('.modal-body p.info')[0];
  infoContainer.innerHTML = '';
  if (typeof data.info !== 'undefined') {
    loadInfo(data.info, infoContainer);
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
