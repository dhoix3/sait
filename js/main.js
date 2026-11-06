/* ============================================================
   Landing page — скрипты
   - Мобильное меню
   - Эффект шапки при скролле
   - Анимация появления при скролле (IntersectionObserver)
   - Маска телефона
   - Валидация формы записи + localStorage
   - Успешное сообщение
   - Плавный скролл к форме по кнопкам «Записаться»
   ============================================================ */

(function () {
  'use strict';

  // ---------- Константы ----------
  const STORAGE_KEY = 'salon_bookings';
  const SELECTORS = {
    header: '#header',
    menuBtn: '#headerMenu',
    nav: '#headerNav',
    bookingSection: '#booking',
    bookingForm: '#bookingForm',
    bookingSuccess: '#bookingSuccess',
    formNote: '#formNote',
    successText: '#successText',
    successNewBtn: '#successNew',
    bookBtns: 'a[href="#booking"]',
    fadeElements: '.fade-in',
  };

  // ---------- Мобильное меню ----------
  const menuBtn = document.querySelector(SELECTORS.menuBtn);
  const nav = document.querySelector(SELECTORS.nav);

  if (menuBtn && nav) {
    menuBtn.addEventListener('click', () => {
      const isOpen = menuBtn.getAttribute('aria-expanded') === 'true';
      menuBtn.setAttribute('aria-expanded', String(!isOpen));
      nav.classList.toggle('open');
      document.body.style.overflow = isOpen ? '' : 'hidden';
    });

    // Закрытие меню по клику на ссылку
    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        menuBtn.setAttribute('aria-expanded', 'false');
        nav.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // ---------- Шапка при скролле ----------
  const header = document.querySelector(SELECTORS.header);
  if (header) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (window.scrollY > 40) {
            header.classList.add('scrolled');
          } else {
            header.classList.remove('scrolled');
          }
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  // ---------- Анимация появления при скролле ----------
  const fadeElements = document.querySelectorAll(SELECTORS.fadeElements);
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) {
    fadeElements.forEach((el) => el.classList.add('is-visible'));
  } else if ('IntersectionObserver' in window && fadeElements.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );
    fadeElements.forEach((el) => observer.observe(el));
  } else {
    fadeElements.forEach((el) => el.classList.add('is-visible'));
  }

  // ---------- Маска телефона ----------
  function phoneMask(value) {
    let digits = value.replace(/\D/g, '');
    if (digits[0] === '7' || digits[0] === '8') digits = digits.slice(1);
    let formatted = '+7';
    if (digits.length > 0) formatted += ' (' + digits.slice(0, 3);
    if (digits.length > 3) formatted += ') ' + digits.slice(3, 6);
    if (digits.length > 6) formatted += '-' + digits.slice(6, 8);
    if (digits.length > 8) formatted += '-' + digits.slice(8, 10);
    return formatted;
  }

  const phoneInput = document.querySelector('input[name="phone"]');
  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      const raw = e.target.value;
      const masked = phoneMask(raw);
      if (masked !== raw) {
        e.target.value = masked;
      }
    });
  }

  // ---------- Минимальная дата сегодня ----------
  const dateInput = document.querySelector('input[name="date"]');
  if (dateInput) {
    const today = new Date().toISOString().slice(0, 10);
    dateInput.setAttribute('min', today);
  }

  // ---------- Валидация формы ----------
  const form = document.querySelector(SELECTORS.bookingForm);
  const successBlock = document.querySelector(SELECTORS.bookingSuccess);
  const formNote = document.querySelector(SELECTORS.formNote);
  const successTextEl = document.querySelector(SELECTORS.successText);
  const successNewBtn = document.querySelector(SELECTORS.successNewBtn);

  if (!form) return;

  const fields = {
    name: form.elements.name,
    phone: form.elements.phone,
    service: form.elements.service,
    date: form.elements.date,
    comment: form.elements.comment,
  };

  const fieldWrappers = {
    name: document.getElementById('error-name')?.closest('.form__field'),
    phone: document.getElementById('error-phone')?.closest('.form__field'),
    service: document.getElementById('error-service')?.closest('.form__field'),
    date: document.getElementById('error-date')?.closest('.form__field'),
  };

  function clearErrors() {
    Object.values(fieldWrappers).forEach((wrapper) => {
      if (wrapper) wrapper.classList.remove('invalid');
    });
    if (formNote) formNote.textContent = '';
  }

  function showError(fieldKey, message) {
    const el = document.getElementById(`error-${fieldKey}`);
    if (fieldWrappers[fieldKey]) fieldWrappers[fieldKey].classList.add('invalid');
    if (el) el.textContent = message;
  }

  function getPhoneDigits() {
    return (fields.phone.value || '').replace(/\D/g, '');
  }

  function validate() {
    clearErrors();
    let valid = true;

    if (!fields.name.value.trim() || fields.name.value.trim().length < 2) {
      showError('name', 'Пожалуйста, укажите имя');
      fields.name.focus();
      valid = false;
    }

    const phoneDigits = getPhoneDigits();
    if (phoneDigits.length < 11) {
      showError('phone', 'Пожалуйста, укажите корректный телефон');
      if (valid) fields.phone.focus();
      valid = false;
    }

    if (!fields.service.value) {
      showError('service', 'Пожалуйста, выберите услугу');
      if (valid) fields.service.focus();
      valid = false;
    }

    if (!fields.date.value) {
      showError('date', 'Пожалуйста, выберите дату');
      if (valid) fields.date.focus();
      valid = false;
    }

    return valid;
  }

  // ---------- Сохранение в localStorage ----------
  function saveBooking(data) {
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      existing.push({
        ...data,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    } catch (err) {
      // localStorage недоступен — не прерываем работу формы
      console.warn('localStorage недоступен:', err);
    }
  }

  // ---------- Отправка формы ----------
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!validate()) return;

    const data = {
      name: fields.name.value.trim(),
      phone: fields.phone.value,
      service: fields.service.value,
      date: fields.date.value,
      comment: fields.comment.value.trim(),
    };

    // Сохраняем заявку локально
    saveBooking(data);

    const text = `Заявка с сайта:%0AИмя: ${encodeURIComponent(data.name)}%0AТелефон: ${encodeURIComponent(data.phone)}%0AУслуга: ${encodeURIComponent(data.service)}%0AДата: ${encodeURIComponent(data.date)}%0AКомментарий: ${encodeURIComponent(data.comment)}`;
    window.open('https://wa.me/79373356998?text=' + text, '_blank');

    // Показываем успешное сообщение
    form.style.display = 'none';
    if (formNote) formNote.textContent = '';
    if (successBlock) {
      successBlock.classList.remove('hidden');
      successBlock.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (successTextEl) {
      successTextEl.textContent = `Заявка отправлена в WhatsApp. Если окно не открылось — нажмите кнопку ниже.`;
    }

    // Сбрасываем форму, чтобы при повторном открытии она была пустой
    form.reset();
  });

  if (successNewBtn) {
    successNewBtn.addEventListener('click', (e) => {
      e.preventDefault();
      successBlock.classList.add('hidden');
      form.style.display = '';
      form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  // ---------- Плавный скролл к форме ----------
  document.querySelectorAll(SELECTORS.bookBtns).forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(SELECTORS.bookingSection);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ---------- Сброс ошибок при вводе ----------
  Object.values(fields).forEach((field) => {
    if (!field) return;
    field.addEventListener('input', () => {
      const wrapper = field.closest('.form__field');
      if (wrapper) wrapper.classList.remove('invalid');
    });
    field.addEventListener('change', () => {
      const wrapper = field.closest('.form__field');
      if (wrapper) wrapper.classList.remove('invalid');
    });
  });
})();
