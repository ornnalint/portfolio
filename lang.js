document.documentElement.classList.add('js');

function revealVisible(){
  var els = document.querySelectorAll('.reveal, .reveal-group');
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
  var saved = 'th';
  try{ saved = localStorage.getItem('portfolio-lang') || 'th'; }catch(e){}
  setLang(saved);
})();

/* ===== scroll reveal (worachet-style) ===== */
(function(){
  function init(){
    var targets = document.querySelectorAll('.reveal, .reveal-group');
    if('IntersectionObserver' in window && targets.length){
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(e){
          if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      targets.forEach(function(el){ io.observe(el); });
    } else {
      targets.forEach(function(el){ el.classList.add('in'); });
    }

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
  form.addEventListener('submit', function(e){
    e.preventDefault();
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
