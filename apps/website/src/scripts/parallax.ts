export function initParallax() {
  const icons = document.querySelectorAll('.parallax-icon');
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    icons.forEach(icon => {
      const speed = parseFloat(icon.getAttribute('data-speed') || '1');
      (icon as HTMLElement).style.transform = `translateY(${scrollY * speed * 0.1}px)`;
    });
  });
}
