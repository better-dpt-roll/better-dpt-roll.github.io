var lastSelected;

function pad(i) {
  return (i.toString().length < 2 ? '0' : '') + i;
}

function fetchInfo(key) {
  console.log('fetchInfo');
  
  var defer = jQuery.ajax({
    dataType: 'jsonp',
    url: 'http://en.wikipedia.org/w/api.php'
      + '?action=query' 
      + '&format=json'
      + '&prop=extracts'
      + '&titles=' + key.replace(/ /g, '_')
  });

  console.log(defer);
  
  defer.then(function(data, status, xhr) {
    console.log(data);
  });
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
      content: challenge[0],
      children: []
    };

    for (var j = 1; j < challenge.length; j++) {
      var subinfo = challenge[j];
      if (typeof subinfo === 'number') {
        cell.children.push(element({
          name: 'span',
          className: 'extra',
          content: 'Note: ' + data.notes[subinfo]
        }));
      } else {
        cell.children.push(element({
          name: 'span',
          className: 'extra',
          content: 'Bonus: ' + subinfo
        }));
      }
    }
    
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
    , target
    , scrolledY;

  if (typeof n === 'undefined') {
    n = Math.floor(Math.random() * window.challenges.challenges.length);
  }

  fetchInfo('Connect Four');

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
  rollModal.find('.modal-body p')
    .html(target.querySelector('.challenge').innerHTML);
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
