document.querySelectorAll('[data-carousel]').forEach(function (car) {
  var track = car.querySelector('.carousel-track');
  var slides = Array.prototype.slice.call(car.querySelectorAll('.carousel-slide'));
  var cap = car.querySelector('.carousel-caption');
  var dotsWrap = car.querySelector('.carousel-dots');
  var i = 0;
  slides.forEach(function (_, idx) {
    var d = document.createElement('button');
    d.type = 'button';
    d.className = 'carousel-dot';
    d.setAttribute('aria-label', 'Go to image ' + (idx + 1));
    d.addEventListener('click', function () { go(idx); });
    dotsWrap.appendChild(d);
  });
  var dots = Array.prototype.slice.call(dotsWrap.children);
  function go(n) {
    i = (n + slides.length) % slides.length;
    slides.forEach(function (s, idx) { s.classList.toggle('active', idx === i); });
    var img = slides[i].querySelector('img');
    cap.textContent = img ? (img.getAttribute('data-caption') || '') : '';
    dots.forEach(function (d, idx) { d.classList.toggle('active', idx === i); });
  }
  car.querySelector('.prev').addEventListener('click', function () { go(i - 1); });
  car.querySelector('.next').addEventListener('click', function () { go(i + 1); });
  go(0);
});
