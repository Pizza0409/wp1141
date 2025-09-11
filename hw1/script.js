// JavaScript for Personal Website
class PersonalWebsite {
    constructor() {
        this.navMenu = document.querySelector('.nav-menu');
        this.hamburger = document.querySelector('.hamburger');
        this.skillBars = document.querySelectorAll('.skill-progress');
        this.contactForm = document.getElementById('contactForm');
        this.langToggle = document.getElementById('langToggle');
        this.currentLang = 'zh'; // Default language
        
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupScrollAnimations();
        this.setupSkillBars();
        this.setupContactForm();
        this.setupSmoothScrolling();
        this.setupNavbarScroll();
        this.setupLanguageToggle();
    }

    // Navigation functionality
    setupNavigation() {
        if (this.hamburger && this.navMenu) {
            this.hamburger.addEventListener('click', () => {
                this.hamburger.classList.toggle('active');
                this.navMenu.classList.toggle('active');
                
                // Add language switcher to mobile menu when active
                if (this.navMenu.classList.contains('active')) {
                    const languageSwitcher = document.querySelector('.language-switcher');
                    if (languageSwitcher && !this.navMenu.querySelector('.language-switcher')) {
                        this.navMenu.appendChild(languageSwitcher.cloneNode(true));
                    }
                }
            });

            // Close menu when clicking on nav links
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    this.hamburger.classList.remove('active');
                    this.navMenu.classList.remove('active');
                });
            });
        }
    }

    // Smooth scrolling for navigation links
    setupSmoothScrolling() {
        const navLinks = document.querySelectorAll('a[href^="#"]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href');
                if (targetId) {
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        const offsetTop = targetElement.offsetTop - 70; // Account for fixed navbar
                        window.scrollTo({
                            top: offsetTop,
                            behavior: 'smooth'
                        });
                    }
                }
            });
        });
    }

    // Navbar scroll effect
    setupNavbarScroll() {
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            window.addEventListener('scroll', () => {
                if (window.scrollY > 100) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
            });
        }
    }

    // Scroll animations using Intersection Observer
    setupScrollAnimations() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    
                    // Special handling for skill bars
                    if (entry.target.classList.contains('skill-progress')) {
                        this.animateSkillBar(entry.target);
                    }
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // Observe elements for animation
        const animatedElements = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right, .skill-progress');
        animatedElements.forEach(el => {
            this.observer.observe(el);
        });
    }

    // Skill bars animation
    setupSkillBars() {
        this.skillBars.forEach(bar => {
            const width = bar.getAttribute('data-width');
            if (width) {
                bar.style.width = '0%';
            }
        });
    }

    animateSkillBar(element) {
        const width = element.getAttribute('data-width');
        if (width) {
            setTimeout(() => {
                element.style.width = width + '%';
            }, 200);
        }
    }

    // Contact form handling
    setupContactForm() {
        if (this.contactForm) {
            this.contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmission();
            });
        }
    }

    handleFormSubmission() {
        if (!this.contactForm) return;

        const formData = new FormData(this.contactForm);
        const contactData = {
            name: formData.get('name'),
            email: formData.get('email'),
            subject: formData.get('subject'),
            message: formData.get('message')
        };

        // Validate form data
        if (this.validateForm(contactData)) {
            this.submitForm(contactData);
        }
    }

    validateForm(data) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!data.name.trim()) {
            this.showMessage('請輸入您的姓名', 'error');
            return false;
        }
        
        if (!data.email.trim() || !emailRegex.test(data.email)) {
            this.showMessage('請輸入有效的Email地址', 'error');
            return false;
        }
        
        if (!data.subject.trim()) {
            this.showMessage('請輸入主旨', 'error');
            return false;
        }
        
        if (!data.message.trim()) {
            this.showMessage('請輸入訊息內容', 'error');
            return false;
        }
        
        return true;
    }

    submitForm(data) {
        // Simulate form submission
        this.showMessage('訊息發送中...', 'info');
        
        setTimeout(() => {
            // In a real application, you would send the data to a server
            console.log('Form submitted:', data);
            this.showMessage('訊息已成功發送！我會盡快回覆您。', 'success');
            this.contactForm.reset();
        }, 1500);
    }

    showMessage(message, type) {
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.textContent = message;
        
        // Style the message
        messageEl.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
        `;
        
        // Set background color based on type
        switch (type) {
            case 'success':
                messageEl.style.backgroundColor = '#10b981';
                break;
            case 'error':
                messageEl.style.backgroundColor = '#ef4444';
                break;
            case 'info':
                messageEl.style.backgroundColor = '#3b82f6';
                break;
        }
        
        document.body.appendChild(messageEl);
        
        // Animate in
        setTimeout(() => {
            messageEl.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 5 seconds
        setTimeout(() => {
            messageEl.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(messageEl);
            }, 300);
        }, 5000);
    }

    // Typing animation for hero title
    startTypingAnimation() {
        const nameElement = document.querySelector('.hero .name');
        if (nameElement) {
            const text = nameElement.textContent || '';
            nameElement.textContent = '';
            
            let i = 0;
            const typeWriter = () => {
                if (i < text.length) {
                    nameElement.textContent += text.charAt(i);
                    i++;
                    setTimeout(typeWriter, 100);
                }
            };
            
            setTimeout(typeWriter, 1000);
        }
    }

    // Parallax effect for hero section
    setupParallax() {
        const hero = document.querySelector('.hero');
        if (hero) {
            window.addEventListener('scroll', () => {
                const scrolled = window.pageYOffset;
                const rate = scrolled * -0.5;
                hero.style.transform = `translateY(${rate}px)`;
            });
        }
    }

    // Add hover effects to cards
    setupCardHovers() {
        const cards = document.querySelectorAll('.highlight, .timeline-content, .skill-items, .contact-form');
        cards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-5px)';
                card.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.1)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
            });
        });
    }

    // Language toggle functionality
    setupLanguageToggle() {
        if (this.langToggle) {
            this.langToggle.addEventListener('click', () => {
                this.toggleLanguage();
            });
        }
    }

    toggleLanguage() {
        this.currentLang = this.currentLang === 'zh' ? 'en' : 'zh';
        this.updateLanguage();
        this.langToggle.textContent = this.currentLang === 'zh' ? 'EN' : '中';
        
        // Force update nav logo after a short delay to ensure it's not overridden
        setTimeout(() => {
            const navLogo = document.querySelector('.nav-logo h2');
            if (navLogo && navLogo.hasAttribute('data-zh') && navLogo.hasAttribute('data-en')) {
                const text = this.currentLang === 'zh' ? 
                    navLogo.getAttribute('data-zh') : 
                    navLogo.getAttribute('data-en');
                navLogo.textContent = text;
                console.log('Nav logo force updated to:', text);
            }
        }, 100);
    }

    updateLanguage() {
        const elements = document.querySelectorAll('[data-zh][data-en]');
        elements.forEach(element => {
            const text = this.currentLang === 'zh' ? 
                element.getAttribute('data-zh') : 
                element.getAttribute('data-en');
            element.textContent = text;
        });
        
        // Update specific content that needs special handling
        this.updateSpecialContent();
        
        // Ensure nav logo is updated (in case it was missed)
        const navLogo = document.querySelector('.nav-logo h2');
        if (navLogo && navLogo.hasAttribute('data-zh') && navLogo.hasAttribute('data-en')) {
            const text = this.currentLang === 'zh' ? 
                navLogo.getAttribute('data-zh') : 
                navLogo.getAttribute('data-en');
            navLogo.textContent = text;
            console.log('Nav logo updated to:', text); // Debug log
        }
    }

    updateSpecialContent() {
        // Update about section content
        const aboutTexts = document.querySelectorAll('.about-text p');
        if (aboutTexts.length >= 2) {
            if (this.currentLang === 'zh') {
                aboutTexts[0].textContent = '我是一名充滿熱忱的軟體工程師學生，目前就讀於國立台灣大學。我對程式設計有著深厚的興趣，特別專精於前端開發、後端系統設計，以及資料結構與演算法。';
                aboutTexts[1].textContent = '除了學術上的追求，我也是一個多元發展的人。在冬季時，我擔任滑雪教練，這不僅展現了我的運動能力，也培養了我的溝通技巧和領導能力。我相信這種多元的背景讓我成為一個更全面的專業人士。';
            } else {
                aboutTexts[0].textContent = 'I am a passionate software engineering student currently studying at National Taiwan University. I have a deep interest in programming, specializing in frontend development, backend system design, and data structures & algorithms.';
                aboutTexts[1].textContent = 'Beyond academic pursuits, I am a multifaceted individual. During winter, I work as a ski instructor, which not only showcases my athletic abilities but also develops my communication skills and leadership qualities. I believe this diverse background makes me a more well-rounded professional.';
            }
        }

        // Update highlight cards
        const highlights = document.querySelectorAll('.highlight');
        if (highlights.length >= 3) {
            if (this.currentLang === 'zh') {
                highlights[0].querySelector('h4').textContent = '程式設計';
                highlights[0].querySelector('p').textContent = '熱愛解決複雜問題，享受程式設計的創造過程';
                highlights[1].querySelector('h4').textContent = '滑雪教練';
                highlights[1].querySelector('p').textContent = '冬季擔任滑雪教練，培養溝通與教學能力';
                highlights[2].querySelector('h4').textContent = '持續學習';
                highlights[2].querySelector('p').textContent = '保持對新技術的熱忱，不斷提升專業技能';
            } else {
                highlights[0].querySelector('h4').textContent = 'Programming';
                highlights[0].querySelector('p').textContent = 'Passionate about solving complex problems and enjoying the creative process of programming';
                highlights[1].querySelector('h4').textContent = 'Ski Instructor';
                highlights[1].querySelector('p').textContent = 'Work as a ski instructor during winter, developing communication and teaching skills';
                highlights[2].querySelector('h4').textContent = 'Continuous Learning';
                highlights[2].querySelector('p').textContent = 'Maintain enthusiasm for new technologies and continuously improve professional skills';
            }
        }

        // Update timeline content
        const timelineItems = document.querySelectorAll('.timeline-content');
        if (timelineItems.length >= 3) {
            if (this.currentLang === 'zh') {
                timelineItems[0].querySelector('h3').textContent = '國立台灣大學';
                timelineItems[0].querySelector('.timeline-description').textContent = '就讀軟體工程相關科系，專精於程式設計、資料結構、演算法、系統設計等核心課程。積極參與專案開發，累積實務經驗。';
                timelineItems[1].querySelector('h3').textContent = '滑雪教練';
                timelineItems[1].querySelector('.timeline-description').textContent = '冬季期間擔任滑雪教練，教授初學者滑雪技巧。培養了良好的溝通能力、耐心和領導技巧，這些技能也應用在團隊合作和專案管理中。';
                timelineItems[2].querySelector('h3').textContent = '專案開發經驗';
                timelineItems[2].querySelector('.timeline-description').textContent = '參與多個軟體開發專案，包括網頁應用程式、資料庫設計、API開發等。熟悉現代開發工具和最佳實務，具備完整的軟體開發生命週期經驗。';
            } else {
                timelineItems[0].querySelector('h3').textContent = 'National Taiwan University';
                timelineItems[0].querySelector('.timeline-description').textContent = 'Studying software engineering related fields, specializing in programming, data structures, algorithms, system design and other core courses. Actively participating in project development and accumulating practical experience.';
                timelineItems[1].querySelector('h3').textContent = 'Ski Instructor';
                timelineItems[1].querySelector('.timeline-description').textContent = 'Work as a ski instructor during winter, teaching skiing techniques to beginners. Developed excellent communication skills, patience and leadership skills, which are also applied in teamwork and project management.';
                timelineItems[2].querySelector('h3').textContent = 'Project Development Experience';
                timelineItems[2].querySelector('.timeline-description').textContent = 'Participated in multiple software development projects, including web applications, database design, API development, etc. Familiar with modern development tools and best practices, with complete software development lifecycle experience.';
            }
        }

        // Update skill categories
        const skillCategories = document.querySelectorAll('.skill-category h3');
        if (skillCategories.length >= 3) {
            if (this.currentLang === 'zh') {
                skillCategories[0].textContent = '程式語言';
                skillCategories[1].textContent = '技術框架';
                skillCategories[2].textContent = '軟技能';
            } else {
                skillCategories[0].textContent = 'Programming Languages';
                skillCategories[1].textContent = 'Technical Frameworks';
                skillCategories[2].textContent = 'Soft Skills';
            }
        }

        // Update skill items
        const skillItems = document.querySelectorAll('.skill-item span');
        if (skillItems.length >= 4) {
            if (this.currentLang === 'zh') {
                skillItems[0].textContent = '團隊合作';
                skillItems[1].textContent = '溝通能力';
                skillItems[2].textContent = '問題解決';
                skillItems[3].textContent = '教學指導';
            } else {
                skillItems[0].textContent = 'Teamwork';
                skillItems[1].textContent = 'Communication';
                skillItems[2].textContent = 'Problem Solving';
                skillItems[3].textContent = 'Teaching & Mentoring';
            }
        }

        // Update footer - use data attributes if available
        const footer = document.querySelector('.footer p');
        if (footer) {
            if (footer.hasAttribute('data-zh') && footer.hasAttribute('data-en')) {
                const text = this.currentLang === 'zh' ? 
                    footer.getAttribute('data-zh') : 
                    footer.getAttribute('data-en');
                footer.textContent = text;
            } else {
                // Fallback for elements without data attributes
                footer.textContent = this.currentLang === 'zh' ? 
                    '© 2025 羅筠笙. 保留所有權利.' : 
                    '© 2025 Yun-Sheng Lo. All rights reserved.';
            }
        }
    }
}

// Initialize the website when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const website = new PersonalWebsite();
    website.initializeAnimations();
    
    // Add loading animation
    const loader = document.createElement('div');
    loader.className = 'loader';
    loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        transition: opacity 0.5s ease;
    `;
    
    loader.innerHTML = `
        <div style="color: white; font-size: 2rem; font-weight: 600;">
            羅雲生
        </div>
    `;
    
    document.body.appendChild(loader);
    
    // Remove loader after page loads
    window.addEventListener('load', () => {
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(loader);
            }, 500);
        }, 1000);
    });
});

// Add CSS for navbar scroll effect
const style = document.createElement('style');
style.textContent = `
    .navbar.scrolled {
        background: rgba(255, 255, 255, 0.98);
        box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
    }
    
    .hamburger.active .bar:nth-child(2) {
        opacity: 0;
    }
    
    .hamburger.active .bar:nth-child(1) {
        transform: translateY(8px) rotate(45deg);
    }
    
    .hamburger.active .bar:nth-child(3) {
        transform: translateY(-8px) rotate(-45deg);
    }
`;
document.head.appendChild(style);
