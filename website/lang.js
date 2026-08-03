document.documentElement.classList.add('js');

function revealVisible(){
  var els = document.querySelectorAll('.reveal, .reveal-group, .reveal-group.per-item > *');
  var vh = window.innerHeight || document.documentElement.clientHeight;
  els.forEach(function(el){
    if(el.classList.contains('in')) return;
    var r = el.getBoundingClientRect();
    if(r.height > 0 && r.top < vh * 0.92 && r.bottom > 0) el.classList.add('in');
  });
}

var cfPlaceholders = {
  name:{ th:'ชื่อ', en:'Name' },
  email:{ th:'อีเมล', en:'Email' },
  message:{ th:'ข้อความ', en:'Message' }
};

function setLang(lang){
  if(lang === 'th'){
    alert('Thai version is coming soon! Currently displaying in English.');
    return;
  }
  document.documentElement.setAttribute('data-active', lang);
  document.documentElement.setAttribute('lang', lang);
  var thBtn = document.getElementById('btn-th');
  var enBtn = document.getElementById('btn-en');
  if(thBtn) thBtn.classList.toggle('active', lang==='th');
  if(enBtn) enBtn.classList.toggle('active', lang==='en');
  try{ localStorage.setItem('portfolio-lang', lang); }catch(e){}

  var cfName = document.getElementById('cf-name');
  var cfEmail = document.getElementById('cf-email');
  var cfMessage = document.getElementById('cf-message');
  if(cfName) cfName.placeholder = cfPlaceholders.name[lang];
  if(cfEmail) cfEmail.placeholder = cfPlaceholders.email[lang];
  if(cfMessage) cfMessage.placeholder = cfPlaceholders.message[lang];

  // language just changed: reveal anything now visible (avoids invisible-on-toggle)
  requestAnimationFrame(revealVisible);
}
(function(){
  /* Thai isn't ready yet — always start in English regardless of any
     previously saved preference, and setLang() blocks switching to 'th'. */
  setLang('en');
})();

/* ===== scroll reveal ===== */
(function(){
  var MOBILE = window.matchMedia('(max-width:640px)');

  function init(){
    var targets = document.querySelectorAll('.reveal, .reveal-group');
    if(!('IntersectionObserver' in window) || !targets.length){
      targets.forEach(function(el){ el.classList.add('in'); });
      return;
    }

    var vh = window.innerHeight || document.documentElement.clientHeight;
    var isMobile = MOBILE.matches;

    /* threshold 0 (not 0.12): a section taller than ~8x the viewport can never
       reach a 12% ratio, so on a phone those sections used to never appear. */
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(!e.isIntersecting) return;
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { threshold: 0, rootMargin: isMobile ? '0px 0px -6% 0px' : '0px 0px -10% 0px' });

    targets.forEach(function(el){ io.observe(el); });

    /* On mobile, a group taller than the viewport would fire its whole stagger
       while most children are still off-screen — so reveal those children one
       at a time instead. Re-checked after load because image heights change
       the measurement. */
    function flagTallGroups(){
      if(!MOBILE.matches) return;
      var h = window.innerHeight || vh;
      document.querySelectorAll('.reveal-group').forEach(function(el){
        if(el.classList.contains('per-item')) return;
        var kids = el.children;
        if(kids.length < 2 || el.getBoundingClientRect().height <= h * 0.9) return;
        el.classList.add('per-item');
        for(var i = 0; i < kids.length; i++){
          if(!kids[i].classList.contains('in')) io.observe(kids[i]);
        }
      });
    }
    flagTallGroups();

    /* failsafe: never leave content invisible if the observer misbehaves */
    window.addEventListener('load', function(){
      flagTallGroups();
      setTimeout(function(){
        var h = window.innerHeight || vh;
        document.querySelectorAll('.reveal, .reveal-group, .reveal-group.per-item > *').forEach(function(el){
          var r = el.getBoundingClientRect();
          if(r.top < h && r.bottom > 0) el.classList.add('in');
        });
      }, 400);
    });

    /* nav: condense brand on scroll */
    var nav = document.querySelector('nav');
    function onScroll(){
      if(nav){ nav.classList.toggle('scrolled', window.pageYOffset > 80); }
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive:true });
  }
  if(document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();

/* ===== contact form (Formspree) ===== */
(function(){
  var form = document.getElementById('contact-form');
  if(!form) return;

  /* spam trap #2: stamp the load time, then reject anything submitted
     implausibly fast. Bots fill and post in well under a second. */
  var loadStamp = form.querySelector('#cf-loadtime');
  if(loadStamp) loadStamp.value = String(Date.now());

  form.addEventListener('submit', function(e){
    e.preventDefault();

    var trap = form.querySelector('input[name="_gotcha"]');
    var tooFast = loadStamp && (Date.now() - Number(loadStamp.value)) < 3000;
    if((trap && trap.value) || tooFast){
      /* silently pretend it worked — never tell a bot why it failed */
      form.reset();
      if(loadStamp) loadStamp.value = String(Date.now());
      return;
    }

    var statusEls = form.querySelectorAll('.cf-status');
    var lang = document.documentElement.getAttribute('data-active') || 'th';
    var msgSending = { th:'กำลังส่ง...', en:'Sending...' };
    var msgOk = { th:'ส่งข้อความแล้ว ขอบคุณค่ะ จะติดต่อกลับโดยเร็วที่สุด', en:'Message sent — thank you! I\'ll get back to you soon.' };
    var msgErr = { th:'ส่งไม่สำเร็จ ลองอีเมลตรงแทนได้ที่ ornnalintlt@gmail.com', en:'Something went wrong — please email me directly at ornnalintlt@gmail.com' };

    statusEls.forEach(function(el){
      el.textContent = msgSending[el.getAttribute('data-lang')] || '';
      el.className = 'cf-status';
    });

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    }).then(function(res){
      if(res.ok){
        statusEls.forEach(function(el){
          var l = el.getAttribute('data-lang');
          el.textContent = msgOk[l];
          el.classList.add('ok');
        });
        form.reset();
      } else {
        throw new Error('bad status');
      }
    }).catch(function(){
      statusEls.forEach(function(el){
        var l = el.getAttribute('data-lang');
        el.textContent = msgErr[l];
        el.classList.add('err');
      });
    });
  });
})();
