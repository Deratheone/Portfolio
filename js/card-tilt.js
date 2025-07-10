// 3D Card Tilt Effect with Mouse Tracking
class CardTilt {
    constructor() {
        this.cards = [];
        this.isMobile = this.detectMobile();
        this.init();
    }

    detectMobile() {
        // Check for touch device or small screen
        return (
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            navigator.msMaxTouchPoints > 0 ||
            window.innerWidth <= 768 ||
            !window.matchMedia('(hover: hover)').matches
        );
    }

    init() {
        // Don't initialize tilt effect on mobile devices
        if (this.isMobile) {
            return;
        }

        // Find all project cards and skill categories
        const projectCards = document.querySelectorAll('.project-card');
        const skillCards = document.querySelectorAll('.skill-category');
        
        // Combine both types of cards
        this.cards = [...projectCards, ...skillCards];
        
        // Add event listeners to each card
        this.cards.forEach(card => {
            this.addCardListeners(card);
        });
    }

    addCardListeners(card) {
        const cardInner = card.querySelector('.card-inner');
        
        if (!cardInner) return;

        card.addEventListener('mouseenter', () => {
            cardInner.style.transition = 'transform 0.1s ease-out';
        });

        card.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e, card, cardInner);
        });

        card.addEventListener('mouseleave', () => {
            this.resetCard(cardInner);
        });
    }

    handleMouseMove(e, card, cardInner) {
        const rect = card.getBoundingClientRect();
        const cardWidth = rect.width;
        const cardHeight = rect.height;
        
        // Calculate mouse position relative to card center
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        // Convert to percentage from center (-1 to 1) and invert for "towards cursor" effect
        const rotateY = -((mouseX - cardWidth / 2) / (cardWidth / 2)) * 6; // Subtle 6 degree max rotation
        const rotateX = ((mouseY - cardHeight / 2) / (cardHeight / 2)) * 6; // Subtle 6 degree max rotation
        
        // Apply the transformation with subtle effect
        cardInner.style.transform = `
            perspective(1000px) 
            rotateX(${rotateX}deg) 
            rotateY(${rotateY}deg) 
            scale3d(1.005, 1.005, 1.005)
        `;
    }

    resetCard(cardInner) {
        cardInner.style.transition = 'transform 0.5s cubic-bezier(.25,.8,.25,1)';
        cardInner.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CardTilt();
});

// Re-initialize on window resize to handle orientation changes
let tiltInstance = null;
window.addEventListener('resize', () => {
    // Debounce resize events
    clearTimeout(window.tiltResizeTimeout);
    window.tiltResizeTimeout = setTimeout(() => {
        tiltInstance = new CardTilt();
    }, 250);
});

// Re-initialize if new content is added dynamically
window.reinitCardTilt = () => {
    tiltInstance = new CardTilt();
};
