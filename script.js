


function scrollToSlide(index) {
    if (typeof document !== 'undefined') {
        const slide = document.querySelector(`[data-slide="${index}"]`);
        slide.scrollIntoView({ behavior: 'smooth' });
    }
}

// Function to update the active dot based on scroll position
function updateActiveDot() {
    const scenes = document.querySelectorAll('.scene');
    const dots = document.querySelectorAll('.dot');

    let activeIndex = 0;
    scenes.forEach((scene, index) => {
        const rect = scene.getBoundingClientRect();
        if (rect.top >= 0 && rect.top <= window.innerHeight / 2) {
            activeIndex = index;
        }
    });

    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === activeIndex);
    });
}

// Initialize by showing the first scene
scrollToSlide(0);

// Add scroll event listener to update the active dot
// window.addEventListener('scroll', updateActiveDot);



