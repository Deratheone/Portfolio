// 3D Card Tilt Effect with Mouse Tracking
class CardTilt {
    constructor() {
        this.cards = [];
        this.init();
    }

    init() {
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
        
        // Convert to percentage from center (-1 to 1)
        const rotateY = ((mouseX - cardWidth / 2) / (cardWidth / 2)) * 8; // Reduced from 15 to 8 degrees
        const rotateX = -((mouseY - cardHeight / 2) / (cardHeight / 2)) * 8; // Reduced from 15 to 8 degrees, inverted
        
        // Apply the transformation
        cardInner.style.transform = `
            perspective(800px) 
            rotateX(${rotateX}deg) 
            rotateY(${rotateY}deg) 
            scale3d(1.01, 1.01, 1.01)
        `;
    }

    resetCard(cardInner) {
        cardInner.style.transition = 'transform 0.5s cubic-bezier(.25,.8,.25,1)';
        cardInner.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CardTilt();
});

// Re-initialize if new content is added dynamically
window.reinitCardTilt = () => {
    new CardTilt();
};
