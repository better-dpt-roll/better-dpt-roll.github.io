var lastSelected;

function pad(i) {
  return (i.toString().length < 2 ? '0' : '') + i;
}

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
    document.querySelector(target).innerHTML =
      foo.querySelector('p').innerHTML;
  });
}

function loadInfo(info, el) {
  Array.prototype.forEach.call(el.childNodes, function(node) {
    el.removeChild(node);
  });

  if (typeof info.wikipedia !== 'undefined') {
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

function renderChallenges() {
  var target = document.querySelector('#challenge-container')
    , data = window.challenges
    , challenge
    , index
    , rowHtml
    , cellHtml;

  document.querySelector('span#dpt-version')
    .innerHTML = data.version;

  for (var i = 0; i < data.challenges.length; i++) {
    challenge = data.challenges[i];
    
    rowHtml = document.createElement('div');
    rowHtml.id = 'challenge-' + i.toString();
    rowHtml.className = 'row ' + (i % 2 ? 'even' : 'odd');

    rowHtml.appendChild(element({
      name: 'div',
      className: 'col-xs-1 col-sm-1 index',
      content: pad(i)
    }));

    var cell = {
      name: 'div',
      className: 'col-xs-11 col-sm-11 challenge',
      content: challenge.name,
      children: []
    };

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
    
    rowHtml.appendChild(element(cell));
    rowHtml.addEventListener('click', function(e) {
      var rowDiv = e.target;
      while (rowDiv.tagName !== 'div' && !rowDiv.className.match(/^row/)) {
        rowDiv = rowDiv.parentNode;
      }
      roll(parseInt(rowDiv.querySelector('.index').innerHTML));
    });

    target.appendChild(rowHtml);
  }
}

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

function dpt() {
  window.location.href = 'https://boards.4chan.org/g/catalog#s=/dpt/';
}

function info() {
  $('#info').modal();
}

function bindButtons() {
  document.querySelector('button#dpt')
    .addEventListener('click', dpt);
  document.querySelector('button#roll')
    .addEventListener('click', function() { roll(); });
}

function setInitialRoll() {
  if (window.location.hash !== '') {
    roll(window.location.hash.replace(/^#/, ''));
  }
}

document.addEventListener('DOMContentLoaded', renderChallenges);
document.addEventListener('DOMContentLoaded', bindButtons);
document.addEventListener('DOMContentLoaded', setInitialRoll);
