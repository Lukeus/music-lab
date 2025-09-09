function o() {
    const e = document.querySelectorAll('.parallax-icon');
    window.addEventListener('scroll', () => {
        const a = window.scrollY;
        e.forEach(t => {
            const l = parseFloat(t.getAttribute('data-speed') || '1');
            t.style.transform = `translateY(${a * l * 0.1}px)`;
        });
    });
}
export { o as i };
//# sourceMappingURL=parallax.js.map
